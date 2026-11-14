-- Atomic JSON import for Command Centre content. Imports remain drafts until the
-- existing publish function creates a new immutable gameplay release.

create or replace function public.decked_command_centre_save_content_item(p_item_id uuid,p_game_id text,p_item_kind text,p_body text,p_metadata jsonb,p_category_ids text[],p_expected_version integer default null,p_change_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target_id uuid:=coalesce(p_item_id,gen_random_uuid()); next_version integer; actor_role text;
begin
  if not public.decked_is_command_centre_staff('editor') then raise exception 'Content editor access is required.' using errcode='42501'; end if;
  if char_length(btrim(coalesce(p_body,''))) not between 1 and 1000 or coalesce(array_length(p_category_ids,1),0)=0 then raise exception 'Body and at least one category are required.' using errcode='22023'; end if;
  if p_metadata is null or jsonb_typeof(p_metadata)<>'object' or octet_length(p_metadata::text)>16384 then raise exception 'Invalid content metadata.' using errcode='22023'; end if;
  if exists(select 1 from jsonb_object_keys(p_metadata) as keys(key) where key !~ '^[A-Za-z][A-Za-z0-9_]{0,63}$' or lower(key) in ('password','token','secret','email','phone','player_name','user_id','room_code','answer_text')) then raise exception 'Unsupported content metadata.' using errcode='22023'; end if;
  if (select count(*) from jsonb_object_keys(p_metadata))>32 then raise exception 'Too many content metadata fields.' using errcode='22023'; end if;
  if p_item_kind not in ('prompt','challenge','scenario','choice') then raise exception 'Invalid content type.' using errcode='22023'; end if;
  if p_item_kind='choice' and (nullif(btrim(p_metadata->>'option_a'),'') is null or nullif(btrim(p_metadata->>'option_b'),'') is null) then raise exception 'Choice cards require both options.' using errcode='22023'; end if;
  if exists(select 1 from unnest(p_category_ids) category_id where not exists(select 1 from public.content_categories c where c.game_id=p_game_id and c.category_id=category_id)) then raise exception 'Unknown content category.' using errcode='22023'; end if;
  if not exists(select 1 from public.content_items where id=target_id) then
    insert into public.content_items(id,game_id,item_kind,source,created_by,updated_by) values(target_id,p_game_id,p_item_kind,'managed',auth.uid(),auth.uid());
    next_version:=1;
  else
    select current_version into next_version from public.content_items where id=target_id for update;
    if p_expected_version is null or next_version<>p_expected_version then raise exception 'Content changed since it was opened.' using errcode='40001'; end if;
    next_version:=next_version+1;
    update public.content_item_versions set editorial_status='superseded' where item_id=target_id and editorial_status='draft';
    update public.content_items set game_id=p_game_id,item_kind=p_item_kind,current_version=next_version,updated_at=now(),updated_by=auth.uid() where id=target_id;
  end if;
  insert into public.content_item_versions(item_id,version,body,normalized_body,metadata,editorial_status,change_note,created_by)
    values(target_id,next_version,btrim(p_body),lower(regexp_replace(btrim(p_body),'[^[:alnum:]'']+',' ','g')),p_metadata,'draft',p_change_note,auth.uid());
  delete from public.content_item_categories where item_id=target_id;
  insert into public.content_item_categories(item_id,game_id,category_id,sort_order)
    select target_id,p_game_id,category_id,ordinality-1 from unnest(p_category_ids) with ordinality categories(category_id,ordinality);
  select role into actor_role from public.command_centre_staff where user_id=auth.uid();
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties)
    values(auth.uid(),actor_role,case when p_item_id is null then 'content_item_created' else 'content_item_updated' end,'content_item',target_id::text,jsonb_build_object('game_id',p_game_id,'version',next_version,'category_count',array_length(p_category_ids,1)));
  return jsonb_build_object('id',target_id,'version',next_version,'status','draft');
end; $$;

create or replace function public.decked_command_centre_import_content_json(p_document jsonb,p_request_id uuid default gen_random_uuid())
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  target_game_id text;
  item jsonb;
  target_item_id uuid;
  current_item public.content_items%rowtype;
  current_body text;
  current_metadata jsonb;
  current_categories text[];
  category_ids text[];
  target_normalized_body text;
  next_version integer;
  actor_role text;
  created_count integer:=0;
  updated_count integer:=0;
  unchanged_count integer:=0;
  archived_count integer:=0;
begin
  if not public.decked_is_command_centre_staff('editor') then raise exception 'Content editor access is required.' using errcode='42501'; end if;
  if p_document is null or jsonb_typeof(p_document)<>'object' or octet_length(p_document::text)>5242880 then raise exception 'Invalid content JSON document.' using errcode='22023'; end if;
  if p_document->>'format' is distinct from 'decked-content-v1' then raise exception 'Unsupported content JSON format.' using errcode='22023'; end if;
  target_game_id:=btrim(p_document->>'game_id');
  if target_game_id is null or not exists(select 1 from public.content_categories where content_categories.game_id=target_game_id) then raise exception 'Unknown content game.' using errcode='22023'; end if;
  if jsonb_typeof(p_document->'items') is distinct from 'array' then raise exception 'Content JSON items must be an array.' using errcode='22023'; end if;
  if jsonb_array_length(p_document->'items') not between 1 and 5000 then raise exception 'Content JSON must contain between 1 and 5000 cards.' using errcode='22023'; end if;
  if exists(
    select 1 from jsonb_array_elements(p_document->'items') entry
    where jsonb_typeof(entry) is distinct from 'object'
      or coalesce(entry->>'item_kind','') not in ('prompt','challenge','scenario','choice')
      or char_length(btrim(coalesce(entry->>'body',''))) not between 1 and 1000
      or jsonb_typeof(entry->'metadata') is distinct from 'object'
      or octet_length((entry->'metadata')::text)>16384
      or case when jsonb_typeof(entry->'category_ids')='array' then jsonb_array_length(entry->'category_ids') not between 1 and 32 else true end
      or coalesce(entry->>'lifecycle_status','active') not in ('active','archived')
      or (entry ? 'id' and nullif(entry->>'id','') is not null and entry->>'id' !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
  ) then raise exception 'One or more content cards are invalid.' using errcode='22023'; end if;
  if exists(
    select 1 from jsonb_array_elements(p_document->'items') entry
    where (select count(*) from jsonb_object_keys(entry->'metadata'))>32
       or exists(select 1 from jsonb_object_keys(entry->'metadata') keys(key) where key !~ '^[A-Za-z][A-Za-z0-9_]{0,63}$' or lower(key) in ('password','token','secret','email','phone','player_name','user_id','room_code','answer_text'))
       or exists(select 1 from jsonb_array_elements_text(entry->'category_ids') as categories(category_id) where not exists(select 1 from public.content_categories c where c.game_id=target_game_id and c.category_id=categories.category_id))
       or (select count(*) from jsonb_array_elements_text(entry->'category_ids'))<>(select count(distinct categories.category_id) from jsonb_array_elements_text(entry->'category_ids') as categories(category_id))
       or (entry->>'item_kind'='choice' and (nullif(btrim(entry->'metadata'->>'option_a'),'') is null or nullif(btrim(entry->'metadata'->>'option_b'),'') is null))
  ) then raise exception 'One or more cards contain invalid metadata or categories.' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_document->'items') entry where nullif(entry->>'id','') is not null group by entry->>'id' having count(*)>1) then raise exception 'Content JSON repeats a card id.' using errcode='22023'; end if;
  if exists(select 1 from jsonb_array_elements(p_document->'items') entry group by lower(regexp_replace(btrim(entry->>'body'),'[^[:alnum:]'']+',' ','g')) having count(*)>1) then raise exception 'Content JSON contains duplicate card text.' using errcode='23505'; end if;

  for item in select value from jsonb_array_elements(p_document->'items') loop
    target_normalized_body:=lower(regexp_replace(btrim(item->>'body'),'[^[:alnum:]'']+',' ','g'));
    category_ids:=array(select value from jsonb_array_elements_text(item->'category_ids') with ordinality categories(value,position) order by position);
    target_item_id:=null;
    if nullif(item->>'id','') is not null then target_item_id:=(item->>'id')::uuid; end if;
    if target_item_id is not null and exists(select 1 from public.content_items i where i.id=target_item_id and i.game_id<>target_game_id) then raise exception 'A card id belongs to another game.' using errcode='23505'; end if;
    if target_item_id is null then
      select i.id into target_item_id from public.content_items i join public.content_item_versions v on v.item_id=i.id and v.version=i.current_version where i.game_id=target_game_id and v.normalized_body=target_normalized_body order by i.updated_at desc limit 1;
    end if;
    target_item_id:=coalesce(target_item_id,gen_random_uuid());
    select * into current_item from public.content_items where id=target_item_id for update;
    if current_item.id is null then
      insert into public.content_items(id,game_id,item_kind,lifecycle_status,current_version,published_version,source,created_by,updated_by)
        values(target_item_id,target_game_id,item->>'item_kind',coalesce(item->>'lifecycle_status','active'),1,null,'managed',auth.uid(),auth.uid());
      insert into public.content_item_versions(item_id,version,body,normalized_body,metadata,editorial_status,change_note,created_by)
        values(target_item_id,1,btrim(item->>'body'),target_normalized_body,item->'metadata','draft','Imported from Command Centre JSON',auth.uid());
      insert into public.content_item_categories(item_id,game_id,category_id,sort_order)
        select target_item_id,target_game_id,category_id,ordinality-1 from unnest(category_ids) with ordinality categories(category_id,ordinality);
      created_count:=created_count+1;
    else
      select v.body,v.metadata into current_body,current_metadata from public.content_item_versions v where v.item_id=target_item_id and v.version=current_item.current_version;
      select array_agg(m.category_id order by m.sort_order,m.category_id) into current_categories from public.content_item_categories m where m.item_id=target_item_id and m.enabled;
      if current_item.item_kind=item->>'item_kind' and current_item.lifecycle_status=coalesce(item->>'lifecycle_status','active') and current_body=btrim(item->>'body') and current_metadata=item->'metadata' and coalesce(current_categories,'{}'::text[])=category_ids then
        unchanged_count:=unchanged_count+1;
      else
        next_version:=current_item.current_version+1;
        update public.content_item_versions v set editorial_status='superseded' where v.item_id=current_item.id and v.editorial_status='draft';
        insert into public.content_item_versions(item_id,version,body,normalized_body,metadata,editorial_status,change_note,created_by)
          values(current_item.id,next_version,btrim(item->>'body'),target_normalized_body,item->'metadata','draft','Imported from Command Centre JSON',auth.uid());
        update public.content_items set item_kind=item->>'item_kind',lifecycle_status=coalesce(item->>'lifecycle_status','active'),current_version=next_version,updated_at=now(),updated_by=auth.uid() where id=current_item.id;
        delete from public.content_item_categories m where m.item_id=current_item.id;
        insert into public.content_item_categories(item_id,game_id,category_id,sort_order)
          select current_item.id,target_game_id,category_id,ordinality-1 from unnest(category_ids) with ordinality categories(category_id,ordinality);
        updated_count:=updated_count+1;
      end if;
    end if;
    if coalesce(item->>'lifecycle_status','active')='archived' then archived_count:=archived_count+1; end if;
  end loop;

  select role into actor_role from public.command_centre_staff where user_id=auth.uid();
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id)
    values(auth.uid(),actor_role,'content_json_imported','content_game',target_game_id,jsonb_build_object('game_id',target_game_id,'item_count',jsonb_array_length(p_document->'items'),'created_count',created_count,'updated_count',updated_count,'unchanged_count',unchanged_count,'archived_count',archived_count),p_request_id);
  return jsonb_build_object('game_id',target_game_id,'item_count',jsonb_array_length(p_document->'items'),'created_count',created_count,'updated_count',updated_count,'unchanged_count',unchanged_count,'archived_count',archived_count);
end; $$;

revoke all on function public.decked_command_centre_import_content_json(jsonb,uuid) from public,anon,authenticated;
grant execute on function public.decked_command_centre_import_content_json(jsonb,uuid) to authenticated;

comment on function public.decked_command_centre_import_content_json(jsonb,uuid) is 'Atomically validates and imports a bounded Decked content JSON document as managed drafts. Live gameplay remains unchanged until publish.';
