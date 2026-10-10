-- Decked Content Management foundation. Additive only: bundled content remains in code.

alter table public.command_centre_staff drop constraint if exists command_centre_staff_role_check;
alter table public.command_centre_staff add constraint command_centre_staff_role_check check (role in ('admin','editor','viewer'));
alter table public.command_centre_audit_log drop constraint if exists command_centre_audit_log_actor_role_check;
alter table public.command_centre_audit_log add constraint command_centre_audit_log_actor_role_check check (actor_role is null or actor_role in ('admin','editor','viewer','service'));

create table public.content_categories (
  game_id text not null,
  category_id text not null,
  label text not null,
  target_count integer not null default 300 check (target_count >= 0),
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (game_id, category_id),
  check (game_id in ('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','most-likely-to','choose-your-side','who-said-that','we-just-met')),
  check (category_id ~ '^[A-Za-z0-9][A-Za-z0-9/_-]*$')
);

create table public.content_items (
  id uuid primary key,
  game_id text not null,
  item_kind text not null default 'prompt' check (item_kind in ('prompt','challenge','scenario','choice')),
  lifecycle_status text not null default 'active' check (lifecycle_status in ('active','archived')),
  current_version integer not null default 1 check (current_version > 0),
  published_version integer check (published_version is null or published_version > 0),
  source text not null default 'managed' check (source in ('bundled_import','managed')),
  source_ref text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  check (game_id in ('truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','most-likely-to','choose-your-side','who-said-that','we-just-met'))
);

create table public.content_item_versions (
  item_id uuid not null references public.content_items(id) on delete restrict,
  version integer not null check (version > 0),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  normalized_body text not null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  editorial_status text not null default 'draft' check (editorial_status in ('draft','published','superseded')),
  change_note text check (change_note is null or char_length(change_note) <= 500),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  primary key (item_id, version)
);

create table public.content_item_categories (
  item_id uuid not null references public.content_items(id) on delete restrict,
  game_id text not null,
  category_id text not null,
  sort_order integer not null default 0,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (item_id, game_id, category_id),
  foreign key (game_id, category_id) references public.content_categories(game_id, category_id) on delete restrict
);

create table public.content_releases (
  id uuid primary key default gen_random_uuid(),
  game_id text not null,
  status text not null default 'publishing' check (status in ('publishing','published','superseded','failed')),
  item_count integer not null default 0 check (item_count >= 0),
  membership_count integer not null default 0 check (membership_count >= 0),
  checksum text not null,
  notes text check (notes is null or char_length(notes) <= 1000),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  published_at timestamptz
);

create table public.content_release_items (
  release_id uuid not null references public.content_releases(id) on delete restrict,
  item_id uuid not null references public.content_items(id) on delete restrict,
  version integer not null,
  category_ids text[] not null check (cardinality(category_ids) > 0),
  primary key (release_id, item_id),
  foreign key (item_id, version) references public.content_item_versions(item_id, version) on delete restrict
);

create index content_items_game_status_idx on public.content_items(game_id,lifecycle_status,updated_at desc);
create index content_versions_normalized_idx on public.content_item_versions(normalized_body);
create index content_memberships_category_idx on public.content_item_categories(game_id,category_id,enabled,sort_order);
create index content_releases_game_idx on public.content_releases(game_id,published_at desc) where status='published';

comment on table public.content_items is 'Managed card identities. Imported bundled records are retained in source code and represented here with deterministic UUIDs.';
comment on table public.content_item_versions is 'Versioned card payloads. Player names, answers, custom cards, room codes, credentials, and analytics identities are forbidden.';
comment on column public.content_item_versions.metadata is 'Structured game fields only, such as choice options. Never store player-entered content or secrets.';
comment on table public.content_releases is 'Immutable publish history used for rollback and content-source analytics.';

alter table public.content_categories enable row level security;
alter table public.content_items enable row level security;
alter table public.content_item_versions enable row level security;
alter table public.content_item_categories enable row level security;
alter table public.content_releases enable row level security;
alter table public.content_release_items enable row level security;

revoke all on table public.content_categories,public.content_items,public.content_item_versions,public.content_item_categories,public.content_releases,public.content_release_items from public,anon,authenticated;
grant select,insert,update,delete on table public.content_categories,public.content_items,public.content_item_versions,public.content_item_categories,public.content_releases,public.content_release_items to service_role;

create or replace function public.decked_is_command_centre_staff(p_required_role text default 'viewer')
returns boolean language sql stable security definer set search_path='' as $$
  select auth.uid() is not null
    and p_required_role in ('viewer','editor','admin')
    and exists(select 1 from auth.users where id=auth.uid() and not coalesce(is_anonymous,false))
    and exists(
      select 1 from public.command_centre_staff staff
      where staff.user_id=auth.uid() and staff.status='active'
        and case p_required_role
          when 'viewer' then staff.role in ('viewer','editor','admin')
          when 'editor' then staff.role in ('editor','admin')
          else staff.role='admin'
        end
    );
$$;

create or replace function public.decked_set_command_centre_staff_role(p_user_id uuid,p_role text,p_status text,p_request_id uuid default gen_random_uuid())
returns void language plpgsql security definer set search_path='' as $$
declare old_role text;old_status text;
begin
  if not public.decked_is_command_centre_staff('admin') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  if p_role not in ('admin','editor','viewer') or p_status not in ('active','disabled') then raise exception 'Invalid staff role.' using errcode='22023'; end if;
  if exists(select 1 from public.command_centre_audit_log where request_id=p_request_id) then return; end if;
  select role,status into old_role,old_status from public.command_centre_staff where user_id=p_user_id for update;
  if old_role is null then raise exception 'Staff record not found.' using errcode='P0002'; end if;
  if old_role='admin' and old_status='active' and (p_role<>'admin' or p_status<>'active') and (select count(*) from public.command_centre_staff where role='admin' and status='active')<=1 then raise exception 'The final active administrator cannot be removed or disabled.' using errcode='23514'; end if;
  update public.command_centre_staff set role=p_role,status=p_status,updated_at=now() where user_id=p_user_id;
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id) values(auth.uid(),'admin','staff_role_changed','staff_account','staff-'||substr(md5(p_user_id::text),1,10),jsonb_build_object('old_role',old_role,'new_role',p_role,'old_status',old_status,'new_status',p_status),p_request_id);
end $$;

create function public.decked_command_centre_content_catalog(p_game_id text default null,p_category_id text default null,p_status text default null,p_query text default null,p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  if p_limit not between 1 and 200 or p_offset < 0 then raise exception 'Invalid pagination.' using errcode='22023'; end if;
  if p_status is not null and p_status not in ('draft','published','archived') then raise exception 'Invalid status.' using errcode='22023'; end if;
  with candidates as (
    select i.id,i.game_id,i.item_kind,i.lifecycle_status,i.current_version,i.published_version,i.source,i.updated_at,
      v.body,v.metadata,v.editorial_status,
      coalesce(jsonb_agg(jsonb_build_object('category_id',m.category_id,'enabled',m.enabled,'sort_order',m.sort_order) order by m.category_id) filter(where m.category_id is not null),'[]'::jsonb) categories
    from public.content_items i
    join public.content_item_versions v on v.item_id=i.id and v.version=i.current_version
    left join public.content_item_categories m on m.item_id=i.id
    where (p_game_id is null or i.game_id=p_game_id)
      and (p_category_id is null or exists(select 1 from public.content_item_categories cm where cm.item_id=i.id and cm.category_id=p_category_id))
      and (p_status is null or (p_status='archived' and i.lifecycle_status='archived') or (p_status<>'archived' and i.lifecycle_status='active' and v.editorial_status=p_status))
      and (p_query is null or length(btrim(p_query))=0 or v.body ilike '%'||replace(replace(btrim(p_query),'%','\%'),'_','\_')||'%' escape '\')
    group by i.id,v.body,v.metadata,v.editorial_status
  ), counted as (select *,count(*) over() total_count from candidates order by updated_at desc,id limit p_limit offset p_offset)
  select jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(counted)-'total_count'),'[]'::jsonb),'total',coalesce(max(total_count),0),'limit',p_limit,'offset',p_offset) into result from counted;
  return result;
end; $$;

create function public.decked_command_centre_content_counts()
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  return jsonb_build_object('games',coalesce((select jsonb_agg(to_jsonb(row_data) order by game_id,category_id) from (
    select c.game_id,c.category_id,c.label,c.target_count,
      count(m.item_id) filter(where m.enabled and i.lifecycle_status='active' and i.published_version is not null) published_count,
      count(m.item_id) filter(where i.lifecycle_status='active' and i.published_version is null) draft_count,
      count(m.item_id) filter(where i.lifecycle_status='archived') archived_count
    from public.content_categories c left join public.content_item_categories m on (m.game_id,m.category_id)=(c.game_id,c.category_id)
    left join public.content_items i on i.id=m.item_id group by c.game_id,c.category_id,c.label,c.target_count
  ) row_data),'[]'::jsonb));
end; $$;

create function public.decked_command_centre_content_history(p_item_id uuid)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  return jsonb_build_object('rows',coalesce((select jsonb_agg(jsonb_build_object('version',v.version,'status',v.editorial_status,'created_at',v.created_at,'change_note',v.change_note,'body',v.body) order by v.version desc) from public.content_item_versions v where v.item_id=p_item_id),'[]'::jsonb));
end; $$;

create function public.decked_command_centre_save_content_item(p_item_id uuid,p_game_id text,p_item_kind text,p_body text,p_metadata jsonb,p_category_ids text[],p_expected_version integer default null,p_change_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target_id uuid:=coalesce(p_item_id,gen_random_uuid()); next_version integer; actor_role text;
begin
  if not public.decked_is_command_centre_staff('editor') then raise exception 'Content editor access is required.' using errcode='42501'; end if;
  if char_length(btrim(coalesce(p_body,''))) not between 1 and 1000 or coalesce(array_length(p_category_ids,1),0)=0 then raise exception 'Body and at least one category are required.' using errcode='22023'; end if;
  if p_metadata is null or jsonb_typeof(p_metadata)<>'object' or octet_length(p_metadata::text)>4096 then raise exception 'Invalid content metadata.' using errcode='22023'; end if;
  if exists(select 1 from jsonb_object_keys(p_metadata) as keys(key) where key not in ('option_a','option_b','content_warning','locale')) then raise exception 'Unsupported content metadata.' using errcode='22023'; end if;
  if p_item_kind='choice' and (nullif(btrim(p_metadata->>'option_a'),'') is null or nullif(btrim(p_metadata->>'option_b'),'') is null) then raise exception 'Choice cards require both options.' using errcode='22023'; end if;
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

create function public.decked_command_centre_set_content_archived(p_item_id uuid,p_archived boolean,p_expected_version integer)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text; affected integer;
begin
  if not public.decked_is_command_centre_staff('editor') then raise exception 'Content editor access is required.' using errcode='42501'; end if;
  update public.content_items set lifecycle_status=case when p_archived then 'archived' else 'active' end,updated_at=now(),updated_by=auth.uid()
    where id=p_item_id and current_version=p_expected_version;
  get diagnostics affected=row_count;
  if affected<>1 then raise exception 'Content changed since it was opened.' using errcode='40001'; end if;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid();
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties)
    values(auth.uid(),actor_role,case when p_archived then 'content_item_archived' else 'content_item_restored' end,'content_item',p_item_id::text,'{}');
end; $$;

create function public.decked_command_centre_publish_content(p_game_id text,p_notes text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare release_id uuid:=gen_random_uuid(); release_checksum text; item_total integer; membership_total integer; actor_role text;
begin
  if not public.decked_is_command_centre_staff('editor') then raise exception 'Content editor access is required.' using errcode='42501'; end if;
  if exists(select 1 from public.content_items i join public.content_item_versions v on v.item_id=i.id and v.version=i.current_version where i.game_id=p_game_id and i.lifecycle_status='active' and v.editorial_status='draft' and exists(select 1 from public.content_item_versions other join public.content_items oi on oi.id=other.item_id where oi.game_id=p_game_id and oi.id<>i.id and oi.lifecycle_status='active' and other.version=oi.current_version and other.normalized_body=v.normalized_body)) then raise exception 'Duplicate active card content must be resolved before publishing.' using errcode='23505'; end if;
  update public.content_releases set status='superseded' where game_id=p_game_id and status='published';
  update public.content_item_versions v set editorial_status='published' from public.content_items i where i.id=v.item_id and i.game_id=p_game_id and i.lifecycle_status='active' and v.version=i.current_version and v.editorial_status='draft';
  update public.content_items set published_version=current_version where game_id=p_game_id and lifecycle_status='active';
  select count(*),coalesce(md5(string_agg(i.id::text||':'||i.published_version::text,',' order by i.id)),'') into item_total,release_checksum from public.content_items i where i.game_id=p_game_id and i.lifecycle_status='active' and i.published_version is not null;
  select count(*) into membership_total from public.content_item_categories m join public.content_items i on i.id=m.item_id where i.game_id=p_game_id and i.lifecycle_status='active' and i.published_version is not null and m.enabled;
  insert into public.content_releases(id,game_id,status,item_count,membership_count,checksum,notes,created_by,published_at) values(release_id,p_game_id,'published',item_total,membership_total,release_checksum,p_notes,auth.uid(),now());
  insert into public.content_release_items(release_id,item_id,version,category_ids)
    select release_id,i.id,i.published_version,array_agg(m.category_id order by m.sort_order,m.category_id)
    from public.content_items i join public.content_item_categories m on m.item_id=i.id and m.enabled
    where i.game_id=p_game_id and i.lifecycle_status='active' and i.published_version is not null group by i.id;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid();
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties) values(auth.uid(),actor_role,'content_release_published','content_release',release_id::text,jsonb_build_object('game_id',p_game_id,'item_count',item_total,'membership_count',membership_total,'checksum',release_checksum));
  return jsonb_build_object('release_id',release_id,'game_id',p_game_id,'item_count',item_total,'membership_count',membership_total,'checksum',release_checksum);
end; $$;

create function public.decked_get_published_content(p_game_id text,p_category_ids text[] default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare active_release public.content_releases%rowtype;
begin
  select * into active_release from public.content_releases where game_id=p_game_id and status='published' order by published_at desc limit 1;
  if active_release.id is null then return jsonb_build_object('available',false,'game_id',p_game_id,'items','[]'::jsonb); end if;
  return jsonb_build_object('available',true,'game_id',p_game_id,'release_id',active_release.id,'checksum',active_release.checksum,'published_at',active_release.published_at,'items',coalesce((
    select jsonb_agg(jsonb_build_object('id',i.id,'kind',i.item_kind,'body',v.body,'metadata',v.metadata,'categories',ri.category_ids) order by i.id)
    from public.content_release_items ri join public.content_items i on i.id=ri.item_id join public.content_item_versions v on (v.item_id,v.version)=(ri.item_id,ri.version)
    where ri.release_id=active_release.id and (p_category_ids is null or ri.category_ids && p_category_ids)
  ),'[]'::jsonb));
end; $$;

revoke all on function public.decked_command_centre_content_catalog(text,text,text,text,integer,integer),public.decked_command_centre_content_counts(),public.decked_command_centre_content_history(uuid),public.decked_command_centre_save_content_item(uuid,text,text,text,jsonb,text[],integer,text),public.decked_command_centre_set_content_archived(uuid,boolean,integer),public.decked_command_centre_publish_content(text,text),public.decked_get_published_content(text,text[]) from public,anon,authenticated;
grant execute on function public.decked_command_centre_content_catalog(text,text,text,text,integer,integer),public.decked_command_centre_content_counts(),public.decked_command_centre_content_history(uuid),public.decked_command_centre_save_content_item(uuid,text,text,text,jsonb,text[],integer,text),public.decked_command_centre_set_content_archived(uuid,boolean,integer),public.decked_command_centre_publish_content(text,text) to authenticated;
grant execute on function public.decked_get_published_content(text,text[]) to anon,authenticated;

comment on function public.decked_get_published_content(text,text[]) is 'Bounded public gameplay read path. Returns published card payloads only; no staff, audit, or draft data.';
