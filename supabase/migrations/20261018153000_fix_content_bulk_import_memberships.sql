-- Recovered from the linked project's Supabase migration history.

-- Staff-only, recoverable JSON export/import for managed content operations.

create or replace function public.decked_command_centre_export_content_json(
  p_game_id text,
  p_category_id text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then
    raise exception 'Command Centre staff access is required.' using errcode='42501';
  end if;
  if not exists(select 1 from public.content_categories where game_id=p_game_id and (p_category_id is null or category_id=p_category_id)) then
    raise exception 'Game or category not found.' using errcode='P0002';
  end if;

  select jsonb_build_object(
    'schema_version',1,
    'game_id',p_game_id,
    'category_id',p_category_id,
    'exported_at',now(),
    'cards',coalesce(jsonb_agg(jsonb_build_object(
      'id',i.id,
      'kind',i.item_kind,
      'body',v.body,
      'metadata',v.metadata,
      'categories',category_data.category_ids
    ) order by i.updated_at desc,i.id) filter(where i.id is not null),'[]'::jsonb)
  ) into result
  from public.content_items i
  join public.content_item_versions v on (v.item_id,v.version)=(i.id,i.current_version)
  cross join lateral (
    select coalesce(jsonb_agg(m.category_id order by m.sort_order,m.category_id),'[]'::jsonb) category_ids
    from public.content_item_categories m where m.item_id=i.id and m.enabled
  ) category_data
  where i.game_id=p_game_id and i.lifecycle_status='active'
    and (p_category_id is null or exists(select 1 from public.content_item_categories scope where scope.item_id=i.id and scope.category_id=p_category_id and scope.enabled));
  return result;
end;
$$;

create or replace function public.decked_command_centre_import_content_json(
  p_payload jsonb,
  p_mode text,
  p_apply boolean default false,
  p_request_id uuid default gen_random_uuid()
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  payload_game text:=p_payload->>'game_id';
  payload_category text:=nullif(p_payload->>'category_id','');
  cards jsonb:=p_payload->'cards';
  card jsonb;
  card_id uuid;
  target_id uuid;
  card_kind text;
  card_body text;
  card_metadata jsonb;
  category_ids text[];
  imported_ids uuid[]:='{}'::uuid[];
  current_number integer;
  next_number integer;
  payload_count integer;
  existing_count integer:=0;
  new_count integer:=0;
  archive_count integer:=0;
  actor_role text;
begin
  if not public.decked_is_command_centre_staff('editor') then
    raise exception 'Content editor access is required.' using errcode='42501';
  end if;
  if p_mode not in ('add','replace') then raise exception 'Import mode must be add or replace.' using errcode='22023'; end if;
  if jsonb_typeof(p_payload)<>'object' or coalesce((p_payload->>'schema_version')::integer,0)<>1 or jsonb_typeof(cards)<>'array' then
    raise exception 'Invalid Decked content JSON.' using errcode='22023';
  end if;
  payload_count:=jsonb_array_length(cards);
  if payload_count not between 1 and 10000 then raise exception 'Import must contain between 1 and 10000 cards.' using errcode='22023'; end if;
  if not exists(select 1 from public.content_categories where game_id=payload_game and enabled) then raise exception 'Game not found.' using errcode='P0002'; end if;
  if payload_category is not null and not exists(select 1 from public.content_categories where game_id=payload_game and category_id=payload_category and enabled) then raise exception 'Category not found.' using errcode='P0002'; end if;

  if exists(
    select 1 from jsonb_array_elements(cards) entry
    where jsonb_typeof(entry)<>'object'
      or entry->>'kind' not in ('prompt','challenge','scenario','choice')
      or char_length(btrim(coalesce(entry->>'body',''))) not between 1 and 1000
      or jsonb_typeof(coalesce(entry->'metadata','{}'::jsonb))<>'object'
      or octet_length(coalesce(entry->'metadata','{}'::jsonb)::text)>4096
      or jsonb_typeof(entry->'categories')<>'array'
      or jsonb_array_length(entry->'categories')=0
      or (entry->>'id' is not null and entry->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
      or (entry->>'kind'='choice' and (nullif(btrim(entry->'metadata'->>'option_a'),'') is null or nullif(btrim(entry->'metadata'->>'option_b'),'') is null))
  ) then raise exception 'One or more cards are malformed.' using errcode='22023'; end if;

  if exists(
    select 1 from jsonb_array_elements(cards) entry
    cross join lateral jsonb_array_elements_text(entry->'categories') category(category_id)
    where not exists(select 1 from public.content_categories c where c.game_id=payload_game and c.category_id=category.category_id and c.enabled)
  ) then raise exception 'A card references an invalid category for this import scope.' using errcode='22023'; end if;

  if exists(select 1 from jsonb_array_elements(cards) entry where entry->>'id' is not null group by entry->>'id' having count(*)>1) then
    raise exception 'Duplicate card IDs are not allowed.' using errcode='23505';
  end if;
  if exists(select 1 from jsonb_array_elements(cards) entry group by lower(regexp_replace(btrim(entry->>'body'),'[^[:alnum:]'']+',' ','g')) having count(*)>1) then
    raise exception 'Duplicate card text is not allowed in one import.' using errcode='23505';
  end if;
  if exists(select 1 from jsonb_array_elements(cards) entry join public.content_items i on i.id=(entry->>'id')::uuid where i.game_id<>payload_game) then
    raise exception 'A card ID belongs to another game.' using errcode='22023';
  end if;

  select count(*) into existing_count from jsonb_array_elements(cards) entry join public.content_items i on i.id=(entry->>'id')::uuid where entry->>'id' is not null;
  new_count:=payload_count-existing_count;
  if p_mode='replace' then
    select count(*) into archive_count from public.content_items i
    where i.game_id=payload_game and i.lifecycle_status='active'
      and (payload_category is null or exists(select 1 from public.content_item_categories m where m.item_id=i.id and m.category_id=payload_category and m.enabled))
      and not exists(select 1 from jsonb_array_elements(cards) entry where entry->>'id' is not null and (entry->>'id')::uuid=i.id);
  end if;

  if not p_apply then
    return jsonb_build_object('valid',true,'applied',false,'game_id',payload_game,'category_id',payload_category,'mode',p_mode,'card_count',payload_count,'existing_count',existing_count,'new_count',new_count,'archive_count',archive_count);
  end if;
  if exists(select 1 from public.command_centre_audit_log where request_id=p_request_id) then
    return jsonb_build_object('valid',true,'applied',true,'already_applied',true,'game_id',payload_game,'category_id',payload_category,'mode',p_mode,'card_count',payload_count,'existing_count',existing_count,'new_count',new_count,'archive_count',archive_count);
  end if;

  for card in select value from jsonb_array_elements(cards) loop
    card_id:=case when card->>'id' is null then null else (card->>'id')::uuid end;
    target_id:=coalesce(card_id,gen_random_uuid());
    card_kind:=card->>'kind';
    card_body:=btrim(card->>'body');
    card_metadata:=coalesce(card->'metadata','{}'::jsonb);
    select array_agg(value order by ordinality) into category_ids from jsonb_array_elements_text(card->'categories') with ordinality;

    select current_version into current_number from public.content_items where id=target_id for update;
    if current_number is null then
      insert into public.content_items(id,game_id,item_kind,lifecycle_status,current_version,published_version,source,created_by,updated_by)
      values(target_id,payload_game,card_kind,'active',1,null,'managed',auth.uid(),auth.uid());
      next_number:=1;
    else
      next_number:=current_number+1;
      update public.content_item_versions set editorial_status='superseded' where item_id=target_id and editorial_status='draft';
      update public.content_items set item_kind=card_kind,lifecycle_status='active',current_version=next_number,updated_at=now(),updated_by=auth.uid() where id=target_id;
      delete from public.content_item_categories where item_id=target_id;
    end if;
    insert into public.content_item_versions(item_id,version,body,normalized_body,metadata,editorial_status,change_note,created_by)
    values(target_id,next_number,card_body,lower(regexp_replace(card_body,'[^[:alnum:]'']+',' ','g')),card_metadata,'draft','Bulk JSON '||p_mode||' import',auth.uid());
    insert into public.content_item_categories(item_id,game_id,category_id,sort_order)
    select target_id,payload_game,category.category_id,category.position-1 from unnest(category_ids) with ordinality as category(category_id,position);
    imported_ids:=array_append(imported_ids,target_id);
  end loop;

  if p_mode='replace' then
    if payload_category is null then
      update public.content_items i set lifecycle_status='archived',updated_at=now(),updated_by=auth.uid()
      where i.game_id=payload_game and i.lifecycle_status='active' and not (i.id=any(imported_ids));
    else
      update public.content_item_categories m set enabled=false
      where m.game_id=payload_game and m.category_id=payload_category and m.enabled and not (m.item_id=any(imported_ids));
      update public.content_items i set lifecycle_status='archived',updated_at=now(),updated_by=auth.uid()
      where i.game_id=payload_game and i.lifecycle_status='active' and not (i.id=any(imported_ids))
        and not exists(select 1 from public.content_item_categories remaining where remaining.item_id=i.id and remaining.enabled);
    end if;
  end if;

  select role into actor_role from public.command_centre_staff where user_id=auth.uid();
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id)
  values(auth.uid(),actor_role,'content_bulk_imported','content_collection',payload_game||coalesce('/'||payload_category,''),jsonb_build_object('game_id',payload_game,'category_id',payload_category,'mode',p_mode,'card_count',payload_count,'existing_count',existing_count,'new_count',new_count,'archived_count',archive_count),p_request_id);
  return jsonb_build_object('valid',true,'applied',true,'game_id',payload_game,'category_id',payload_category,'mode',p_mode,'card_count',payload_count,'existing_count',existing_count,'new_count',new_count,'archive_count',archive_count);
end;
$$;

revoke all on function public.decked_command_centre_export_content_json(text,text),public.decked_command_centre_import_content_json(jsonb,text,boolean,uuid) from public,anon,authenticated;

grant execute on function public.decked_command_centre_export_content_json(text,text),public.decked_command_centre_import_content_json(jsonb,text,boolean,uuid) to authenticated;

comment on function public.decked_command_centre_export_content_json(text,text) is 'Exports current staff-visible content as portable schema-versioned JSON without player data.';

comment on function public.decked_command_centre_import_content_json(jsonb,text,boolean,uuid) is 'Validates or atomically imports schema-versioned content as drafts. Replace archives omitted cards; publishing remains a separate action.';
