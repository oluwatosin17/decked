-- Recovered from the linked project's Supabase migration history.

-- Trusted QA traffic classification and launch-baseline reporting.
-- Classification is derived exclusively from authenticated server identity.
-- Existing rows remain unclassified unless an administrator explicitly and
-- separately performs a reviewed historical reconciliation.

create table public.analytics_trusted_qa_principals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 100),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  revoked_at timestamptz,
  revoked_by uuid references auth.users(id),
  check ((active and revoked_at is null and revoked_by is null) or
         (not active and revoked_at is not null and revoked_by is not null))
);

alter table public.analytics_trusted_qa_principals enable row level security;

revoke all on public.analytics_trusted_qa_principals from public,anon,authenticated;

grant select,insert,update,delete on public.analytics_trusted_qa_principals to service_role;

create table public.analytics_reporting_settings (
  singleton boolean primary key default true check (singleton),
  official_launch_at timestamptz,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

insert into public.analytics_reporting_settings(singleton) values(true);

alter table public.analytics_reporting_settings enable row level security;

revoke all on public.analytics_reporting_settings from public,anon,authenticated;

grant select,insert,update,delete on public.analytics_reporting_settings to service_role;

alter table public.analytics_events add column is_trusted_qa boolean not null default false;

alter table public.analytics_game_sessions add column is_trusted_qa boolean not null default false;

alter table public.analytics_room_facts add column is_trusted_qa boolean not null default false;

alter table public.analytics_room_links add column is_trusted_qa boolean not null default false;

create index analytics_events_reporting_scope_idx on public.analytics_events(environment,is_trusted_qa,occurred_at);

create index analytics_game_sessions_reporting_scope_idx on public.analytics_game_sessions(environment,is_trusted_qa,setup_started_at);

create index analytics_room_facts_reporting_scope_idx on public.analytics_room_facts(environment,is_trusted_qa,created_at);

create function public.decked_is_trusted_qa_principal(p_user_id uuid)
returns boolean language sql stable security definer set search_path='' as $$
  select coalesce(exists(select 1 from public.analytics_trusted_qa_principals where user_id=p_user_id and active),false)
$$;

revoke all on function public.decked_is_trusted_qa_principal(uuid) from public,anon,authenticated;

grant execute on function public.decked_is_trusted_qa_principal(uuid) to service_role;

create function public.decked_classify_analytics_event()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.is_trusted_qa :=
    public.decked_is_trusted_qa_principal(new.supabase_user_id)
    or exists(select 1 from public.analytics_game_sessions s where s.game_session_id=new.game_session_id and s.is_trusted_qa)
    or exists(select 1 from public.analytics_room_facts r where r.multiplayer_room_ref=new.multiplayer_room_ref and r.is_trusted_qa);
  return new;
end $$;

create trigger analytics_events_trusted_qa before insert or update of supabase_user_id,game_session_id,multiplayer_room_ref
on public.analytics_events for each row execute function public.decked_classify_analytics_event();

create function public.decked_classify_room_link()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.is_trusted_qa := exists(
    select 1 from public.decked_rooms room
    where room.id=new.room_id and public.decked_is_trusted_qa_principal(room.host_user_id)
  );
  return new;
end $$;

create trigger analytics_room_links_trusted_qa before insert on public.analytics_room_links
for each row execute function public.decked_classify_room_link();

create function public.decked_classify_room_fact()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.is_trusted_qa := new.is_trusted_qa or exists(
    select 1 from public.analytics_room_links link
    where link.multiplayer_room_ref=new.multiplayer_room_ref and link.is_trusted_qa
  );
  return new;
end $$;

create trigger analytics_room_facts_trusted_qa before insert or update of multiplayer_room_ref
on public.analytics_room_facts for each row execute function public.decked_classify_room_fact();

create function public.decked_classify_game_session()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  new.is_trusted_qa := new.is_trusted_qa
    or exists(select 1 from public.analytics_room_facts r where r.multiplayer_room_ref=new.multiplayer_room_ref and r.is_trusted_qa)
    or exists(select 1 from public.analytics_events e where e.game_session_id=new.game_session_id and e.is_trusted_qa);
  return new;
end $$;

create trigger analytics_game_sessions_trusted_qa before insert or update of multiplayer_room_ref
on public.analytics_game_sessions for each row execute function public.decked_classify_game_session();

create function public.decked_propagate_event_qa_to_session()
returns trigger language plpgsql security definer set search_path='' as $$
begin
  if new.is_trusted_qa and new.game_session_id is not null then
    update public.analytics_game_sessions set is_trusted_qa=true
    where game_session_id=new.game_session_id and not is_trusted_qa;
  end if;
  return new;
end $$;

create trigger analytics_events_propagate_trusted_qa after insert on public.analytics_events
for each row execute function public.decked_propagate_event_qa_to_session();

revoke all on function public.decked_classify_analytics_event(),public.decked_classify_room_link(),public.decked_classify_room_fact(),public.decked_classify_game_session(),public.decked_propagate_event_qa_to_session() from public,anon,authenticated;

create function public.decked_command_centre_set_qa_principal(p_user_id uuid,p_label text,p_active boolean)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.decked_is_command_centre_staff('admin') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  if p_user_id is null or char_length(trim(p_label)) not between 1 and 100 then raise exception 'A valid identity and label are required.' using errcode='22023'; end if;
  insert into public.analytics_trusted_qa_principals(user_id,label,active,created_by,revoked_at,revoked_by)
  values(p_user_id,trim(p_label),p_active,auth.uid(),case when p_active then null else now() end,case when p_active then null else auth.uid() end)
  on conflict(user_id) do update set label=excluded.label,active=excluded.active,
    revoked_at=excluded.revoked_at,revoked_by=excluded.revoked_by;
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties)
  select auth.uid(),role,'settings_changed','qa_principal','qa-'||substr(md5(p_user_id::text),1,12),
    jsonb_build_object('setting_key','trusted_qa_principal','active',p_active)
  from public.command_centre_staff where user_id=auth.uid() and status='active';
end $$;

create function public.decked_command_centre_set_launch_baseline(p_official_launch_at timestamptz)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.decked_is_command_centre_staff('admin') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  if p_official_launch_at is not null and p_official_launch_at>now()+interval '1 year' then raise exception 'Invalid launch baseline.' using errcode='22023'; end if;
  update public.analytics_reporting_settings set official_launch_at=p_official_launch_at,updated_at=now(),updated_by=auth.uid() where singleton;
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties)
  select auth.uid(),role,'settings_changed','analytics_setting','official_launch_at',jsonb_build_object('setting_key','official_launch_at','configured',p_official_launch_at is not null)
  from public.command_centre_staff where user_id=auth.uid() and status='active';
end $$;

revoke all on function public.decked_command_centre_set_qa_principal(uuid,text,boolean),public.decked_command_centre_set_launch_baseline(timestamptz) from public,anon,authenticated;

grant execute on function public.decked_command_centre_set_qa_principal(uuid,text,boolean),public.decked_command_centre_set_launch_baseline(timestamptz) to authenticated;

create function public.decked_reporting_from(p_from date,p_include_prelaunch boolean)
returns date language sql stable security definer set search_path='' as $$
  select case when p_include_prelaunch then p_from else greatest(p_from,coalesce((select official_launch_at::date from public.analytics_reporting_settings where singleton),p_from)) end
$$;

revoke all on function public.decked_reporting_from(date,boolean) from public,anon,authenticated;

create or replace function public.decked_command_centre_games_v3(
  p_environment text,p_from date,p_to date,p_play_mode text default null,p_trend_days integer default 7,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb; effective_from date;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  if p_trend_days not in (7,30) then raise exception 'Trend window must be 7 or 30 days.' using errcode='22023'; end if;
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  with games(game_id) as (select unnest(array[
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast','not-me-your-honour','bad-advice-only'
  ])), current_sessions as (
    select game_id,count(*) setups,count(*) filter(where started_at is not null and play_mode='pass_and_play') pass_and_play_starts,count(*) filter(where started_at is not null and play_mode='play_together') multiplayer_starts,count(distinct analytics_user_id) filter(where analytics_user_id is not null) unique_players,count(*) filter(where cards_presented>0) first_cards,count(*) filter(where status='completed') completions,percentile_cont(.5) within group(order by cards_presented) filter(where started_at is not null) median_cards_played,percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) filter(where status='completed' and started_at is not null and completed_at is not null) median_duration_seconds
    from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa) and (p_play_mode is null or play_mode=p_play_mode) group by game_id
  ), event_counts as (
    select game_id,count(*) filter(where event_name='screen_viewed') game_views,count(*) filter(where event_name='game_selected') selections,count(*) filter(where event_name='game_replay_selected') replays from public.analytics_events where environment=p_environment and (occurred_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa) and game_id is not null group by game_id
  ), rematches as (
    select game_id,coalesce(sum(rematch_start_count),0) rematches from public.analytics_room_facts where environment=p_environment and (created_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa) group by game_id
  ), rows as (
    select g.game_id,coalesce(e.game_views,0) game_views,coalesce(e.selections,0) selections,coalesce(s.pass_and_play_starts,0) pass_and_play_starts,coalesce(s.multiplayer_starts,0) multiplayer_starts,coalesce(s.unique_players,0) unique_players,
      case when coalesce(s.setups,0)=0 then 0 else round(100.0*s.first_cards/s.setups,1) end first_card_rate,
      case when coalesce(s.pass_and_play_starts,0)+coalesce(s.multiplayer_starts,0)=0 then 0 else round(100.0*s.completions/(s.pass_and_play_starts+s.multiplayer_starts),1) end completion_rate,
      s.median_cards_played,s.median_duration_seconds,case when coalesce(s.completions,0)=0 then 0 else round(100.0*(coalesce(e.replays,0)+coalesce(r.rematches,0))/s.completions,1) end replay_rate,null::numeric trend_percent
    from games g left join current_sessions s using(game_id) left join event_counts e using(game_id) left join rematches r using(game_id)
  ) select jsonb_build_object('rows',jsonb_agg(to_jsonb(rows) order by game_id),'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),
    'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from),
    'partial_warnings',jsonb_build_array('Unique-player counts exclude authoritative sessions without a browser analytics identity.')) into result from rows;
  return result;
end $$;

create or replace function public.decked_command_centre_overview_v3(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date; prior_from date; prior_to date; days integer; current jsonb; previous jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);days:=p_to-effective_from+1;prior_to:=effective_from-1;prior_from:=prior_to-days+1;
  select jsonb_build_object('daily_active',count(distinct analytics_user_id) filter(where (setup_started_at at time zone 'UTC')::date=p_to),'weekly_active',count(distinct analytics_user_id) filter(where (setup_started_at at time zone 'UTC')::date between p_to-6 and p_to),'monthly_active',count(distinct analytics_user_id),'new_players',count(distinct analytics_user_id),'returning_players',0,'game_starts',count(*) filter(where started_at is not null),'completions',count(*) filter(where status='completed'),'cards_played',coalesce(sum(cards_presented),0),'replays',0,'rooms_created',(select count(*) from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not r.is_trusted_qa)),'rooms_started',(select count(*) from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between effective_from and p_to and r.first_game_started_at is not null and (p_include_qa or not r.is_trusted_qa)),'eligible_rooms',(select count(*) from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between effective_from and p_to and r.successful_join_count>0 and (p_include_qa or not r.is_trusted_qa)),'rematch_starts',(select coalesce(sum(rematch_start_count),0) from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not r.is_trusted_qa)),'sessions',count(*),'error_sessions',0,'median_session_duration_seconds',percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) filter(where status='completed' and started_at is not null and completed_at is not null)) into current from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa) and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode);
  select jsonb_build_object('daily_active',0,'weekly_active',0,'monthly_active',count(distinct analytics_user_id),'new_players',0,'returning_players',count(distinct analytics_user_id),'game_starts',count(*) filter(where started_at is not null),'completions',count(*) filter(where status='completed'),'cards_played',coalesce(sum(cards_presented),0),'replays',0,'rooms_created',0,'rooms_started',0,'eligible_rooms',0,'rematch_starts',0,'sessions',count(*),'error_sessions',0,'median_session_duration_seconds',percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) filter(where status='completed' and started_at is not null and completed_at is not null)) into previous from public.analytics_game_sessions where environment=p_environment and (setup_started_at at time zone 'UTC')::date between prior_from and prior_to and (p_include_qa or not is_trusted_qa) and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode);
  return jsonb_build_object('current',current,'previous',previous,'trend','[]'::jsonb,'top_games','[]'::jsonb,'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from),'partial_warnings',jsonb_build_array('Expanded identity, reliability, and trend panels retain their existing report scope until migrated to trusted-QA-aware v3 queries.'));
end $$;

create or replace function public.decked_command_centre_game_detail_v3(
  p_environment text,p_from date,p_to date,p_game_id text,p_trend_days integer default 7,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date;result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  with date_series as (select generate_series(effective_from,p_to,'1 day'::interval)::date metric_date), scoped_sessions as (select * from public.analytics_game_sessions where environment=p_environment and game_id=p_game_id and (setup_started_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa)), scoped_events as (select * from public.analytics_events where environment=p_environment and game_id=p_game_id and (occurred_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa)), trend as (select d.metric_date,count(s.game_session_id) filter(where s.started_at is not null) starts,count(s.game_session_id) filter(where s.status='completed') completions from date_series d left join scoped_sessions s on (s.setup_started_at at time zone 'UTC')::date=d.metric_date group by d.metric_date), mode_split as (select play_mode,count(*) filter(where started_at is not null) starts,count(*) filter(where status='completed') completions,percentile_cont(.5) within group(order by cards_presented) filter(where started_at is not null) median_cards_played from scoped_sessions group by play_mode), depth as (select case when cards_presented=0 then '0' when cards_presented<=5 then '1–5' when cards_presented<=10 then '6–10' when cards_presented<=20 then '11–20' else '21+' end depth_bucket,count(*) sessions from scoped_sessions where started_at is not null group by 1), errors as (select event_name error_type,coalesce(properties->>'failure_class',properties->>'status','unknown') error_class,count(*) occurrences from scoped_events where event_name in ('rpc_failed','frontend_error','realtime_status_changed') group by 1,2), dimensions as (select 'category' dimension_type,value dimension_id,count(*) observations from scoped_events cross join lateral jsonb_array_elements_text(case when jsonb_typeof(properties->'category_ids')='array' then properties->'category_ids' else '[]'::jsonb end) value where event_name='deck_configured' group by value)
  select jsonb_build_object('game_id',p_game_id,'trend',(select coalesce(jsonb_agg(to_jsonb(trend) order by metric_date),'[]') from trend),'mode_split',(select coalesce(jsonb_agg(to_jsonb(mode_split) order by play_mode),'[]') from mode_split),
    'device_split',(select coalesce(jsonb_agg(jsonb_build_object('device_class',device_class,'sessions',sessions) order by device_class),'[]'::jsonb) from (select case when properties->>'device_class' in ('mobile','tablet','desktop') then properties->>'device_class' else 'unknown' end device_class,count(distinct analytics_session_id) sessions from scoped_events where event_name='app_opened' group by 1) device_rows),
    'funnel',(select coalesce(jsonb_agg(jsonb_build_object('step_name',step_name,'step_order',step_order,'count',event_count) order by step_order),'[]'::jsonb) from (select d.step_name,d.step_order,count(distinct coalesce(e.game_session_id,e.analytics_session_id,e.multiplayer_room_ref)) event_count from (values('Selected',1,'game_selected'),('Started',2,'game_started'),('First card',3,'card_presented'),('Completed',4,'game_completed')) d(step_name,step_order,event_name) left join scoped_events e on e.event_name=d.event_name group by 1,2) funnel_rows),
    'dimensions',(select coalesce(jsonb_agg(to_jsonb(dimensions)),'[]') from dimensions),'session_depth',(select coalesce(jsonb_agg(to_jsonb(depth)),'[]') from depth),'errors',(select coalesce(jsonb_agg(to_jsonb(errors)),'[]') from errors),'replay_behavior',jsonb_build_object('replays',(select count(*) from scoped_events where event_name='game_replay_selected'),'rematches',(select coalesce(sum(rematch_start_count),0) from public.analytics_room_facts where environment=p_environment and game_id=p_game_id and (created_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not is_trusted_qa))),'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'partial_warnings','[]'::jsonb,'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from)) into result;
  return result;
end $$;

create or replace function public.decked_command_centre_funnels_v3(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_device_class text default null,p_country text default null,p_acquisition_source text default null,p_app_version text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date; result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_country is not null then raise exception 'Country filtering is unavailable because country is not collected.' using errcode='22023'; end if;
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  with eligible_sessions as (select distinct analytics_session_id from public.analytics_events where environment=p_environment and event_name='app_opened' and analytics_session_id is not null and (occurred_at at time zone 'UTC')::date between effective_from-1 and p_to and (p_include_qa or not is_trusted_qa) and (p_device_class is null or coalesce(properties->>'device_class','unknown')=p_device_class) and (p_acquisition_source is null or properties->>'utm_source'=p_acquisition_source) and (p_app_version is null or app_version=p_app_version)), scoped as (select e.* from public.analytics_events e where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode) and (e.analytics_session_id is null or exists(select 1 from eligible_sessions x where x.analytics_session_id=e.analytics_session_id))), defs as (select * from (values('discovery',1,'Landing','app_opened'),('discovery',2,'Game selected','game_selected'),('discovery',3,'Play mode selected','play_mode_selected'),('discovery',4,'Game started','game_started'),('discovery',5,'Completion','game_completed'),('multiplayer_host',1,'Room created','room_created'),('multiplayer_host',2,'First guest joined','room_joined'),('multiplayer_host',3,'Game started','multiplayer_game_started'),('multiplayer_host',4,'Completion','multiplayer_game_completed')) d(funnel_id,step_order,step_name,event_name)), counts as (select d.funnel_id,d.step_order,d.step_name,count(distinct coalesce(e.game_session_id,e.analytics_session_id,e.multiplayer_room_ref))::bigint entrants from defs d left join scoped e on e.event_name=d.event_name group by 1,2,3), rates as (select *,first_value(entrants) over(partition by funnel_id order by step_order) first_entrants,lag(entrants) over(partition by funnel_id order by step_order) previous_entrants from counts), grouped as (select funnel_id,jsonb_agg(jsonb_build_object('step_order',step_order,'step_name',step_name,'entrants',entrants,'conversion_from_previous',case when step_order=1 then 100 when coalesce(previous_entrants,0)=0 then 0 else round(100.0*entrants/previous_entrants,1) end,'conversion_from_first',case when coalesce(first_entrants,0)=0 then 0 else round(100.0*entrants/first_entrants,1) end,'median_seconds_from_previous',null) order by step_order) steps from rates group by funnel_id) select jsonb_build_object('funnels',coalesce(jsonb_agg(jsonb_build_object('funnel_id',funnel_id,'name',case funnel_id when 'discovery' then 'Discovery to completion' else 'Play Together host' end,'steps',steps)),'[]'::jsonb),'rules',jsonb_build_object('conversion_window_hours',24,'ordering','authoritative event identity','repeat_handling','distinct lifecycle identity','timezone','UTC entry date','first_card_note','QA filtering is server-authoritative.'),'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from),'available_filters',jsonb_build_object('country',false,'device_class',true,'acquisition_source',true,'app_version',true)) into result from grouped;return result;
end $$;

revoke all on function public.decked_command_centre_games_v3(text,date,date,text,integer,boolean,boolean),public.decked_command_centre_game_detail_v3(text,date,date,text,integer,boolean,boolean),public.decked_command_centre_overview_v3(text,date,date,text,text,boolean,boolean),public.decked_command_centre_funnels_v3(text,date,date,text,text,text,text,text,text,boolean,boolean) from public,anon;

grant execute on function public.decked_command_centre_games_v3(text,date,date,text,integer,boolean,boolean),public.decked_command_centre_game_detail_v3(text,date,date,text,integer,boolean,boolean),public.decked_command_centre_overview_v3(text,date,date,text,text,boolean,boolean),public.decked_command_centre_funnels_v3(text,date,date,text,text,text,text,text,text,boolean,boolean) to authenticated;

create or replace function public.decked_export_command_centre_scoped_csv(
  p_report text,p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_trend_days integer default 7,p_device_class text default null,p_acquisition_source text default null,p_app_version text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false,p_request_id uuid default gen_random_uuid()
) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare payload jsonb;csv text;row_data jsonb;row_count integer:=0;generated timestamptz:=now();actor_role text;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  if p_report='games' then
    payload:=public.decked_command_centre_games_v3(p_environment,p_from,p_to,p_play_mode,p_trend_days,p_include_qa,p_include_prelaunch);
    csv:='game_id,game_views,selections,pass_and_play_starts,multiplayer_starts,unique_players,completion_rate,replay_rate';
    for row_data in select value from jsonb_array_elements(payload->'rows') loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(row_data->>'game_id'),public.decked_csv_cell(row_data->>'game_views'),public.decked_csv_cell(row_data->>'selections'),public.decked_csv_cell(row_data->>'pass_and_play_starts'),public.decked_csv_cell(row_data->>'multiplayer_starts'),public.decked_csv_cell(row_data->>'unique_players'),public.decked_csv_cell(row_data->>'completion_rate'),public.decked_csv_cell(row_data->>'replay_rate')],',');end loop;
  elsif p_report='overview' then
    payload:=public.decked_command_centre_overview_v3(p_environment,p_from,p_to,p_game_id,p_play_mode,p_include_qa,p_include_prelaunch);
    csv:='period,game_starts,completions,cards_played,rooms_created,rooms_started,rematch_starts';
    for row_data in select jsonb_build_object('period','current')||(payload->'current') union all select jsonb_build_object('period','previous')||(payload->'previous') loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(row_data->>'period'),public.decked_csv_cell(row_data->>'game_starts'),public.decked_csv_cell(row_data->>'completions'),public.decked_csv_cell(row_data->>'cards_played'),public.decked_csv_cell(row_data->>'rooms_created'),public.decked_csv_cell(row_data->>'rooms_started'),public.decked_csv_cell(row_data->>'rematch_starts')],',');end loop;
  elsif p_report='funnels' then
    payload:=public.decked_command_centre_funnels_v3(p_environment,p_from,p_to,p_game_id,p_play_mode,p_device_class,null,p_acquisition_source,p_app_version,p_include_qa,p_include_prelaunch);
    csv:='funnel_id,step_order,step_name,entrants,conversion_from_previous,conversion_from_first';
    for row_data in select jsonb_build_object('funnel_id',f->>'funnel_id')||step from jsonb_array_elements(payload->'funnels') f cross join lateral jsonb_array_elements(f->'steps') step loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(row_data->>'funnel_id'),public.decked_csv_cell(row_data->>'step_order'),public.decked_csv_cell(row_data->>'step_name'),public.decked_csv_cell(row_data->>'entrants'),public.decked_csv_cell(row_data->>'conversion_from_previous'),public.decked_csv_cell(row_data->>'conversion_from_first')],',');end loop;
  else raise exception 'Unsupported scoped report.' using errcode='22023';
  end if;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid() and status='active';
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id) values(auth.uid(),actor_role,'report_exported','analytics_report',p_report,jsonb_build_object('report',p_report,'include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'row_count',row_count),p_request_id) on conflict(request_id) do nothing;
  return jsonb_build_object('filename','decked-'||p_report||'-'||p_from||'-'||p_to||'.csv','csv',csv,'row_count',row_count,'generated_at',generated,'refreshed_at',payload->>'refreshed_at');
end $$;

revoke all on function public.decked_export_command_centre_scoped_csv(text,text,date,date,text,text,integer,text,text,text,boolean,boolean,uuid) from public,anon;

grant execute on function public.decked_export_command_centre_scoped_csv(text,text,date,date,text,text,integer,text,text,text,boolean,boolean,uuid) to authenticated;

comment on table public.analytics_trusted_qa_principals is 'Server-maintained allowlist of authenticated QA principals. Never writable or readable by gameplay clients.';

comment on column public.analytics_events.is_trusted_qa is 'Server-derived QA classification. Client payloads cannot set this field.';

comment on column public.analytics_game_sessions.is_trusted_qa is 'Inherited trusted QA scope for report filtering; false does not assert that historical traffic is genuine.';

comment on column public.analytics_room_facts.is_trusted_qa is 'Inherited from the room host trusted identity for new rooms only.';

-- Overview companion reports intentionally read the classified raw facts rather
-- than the legacy unscoped rollups. This preserves every existing panel while
-- applying one reporting scope consistently.
create or replace function public.decked_command_centre_overview_trends_v3(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,p_granularity text default 'day',
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date;bucket_step interval;result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  if p_granularity not in ('day','week','month','year') then raise exception 'Invalid trend granularity.' using errcode='22023'; end if;
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  bucket_step:=case p_granularity when 'day' then interval '1 day' when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end;
  with buckets as (
    select bucket::date bucket_start,least(p_to,(bucket+bucket_step-interval '1 day')::date) bucket_end
    from generate_series(date_trunc(p_granularity,effective_from::timestamp),date_trunc(p_granularity,p_to::timestamp),bucket_step) bucket
  ), scoped_sessions as (
    select * from public.analytics_game_sessions s where s.environment=p_environment and (s.setup_started_at at time zone 'UTC')::date between effective_from and p_to
      and (p_include_qa or not s.is_trusted_qa) and (p_game_id is null or s.game_id=p_game_id) and (p_play_mode is null or s.play_mode=p_play_mode)
  ), scoped_events as (
    select * from public.analytics_events e where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between effective_from and p_to
      and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode)
  ), series as (
    select b.bucket_start,b.bucket_end,
      (select count(distinct e.analytics_user_id) from scoped_events e where (e.occurred_at at time zone 'UTC')::date between greatest(effective_from,b.bucket_start) and b.bucket_end) active_players,
      (select count(*) from scoped_sessions s where s.started_at is not null and (s.started_at at time zone 'UTC')::date between greatest(effective_from,b.bucket_start) and b.bucket_end) game_starts,
      (select count(*) from scoped_sessions s where s.status='completed' and (s.completed_at at time zone 'UTC')::date between greatest(effective_from,b.bucket_start) and b.bucket_end) completions,
      (select coalesce(sum(s.cards_presented),0) from scoped_sessions s where (s.setup_started_at at time zone 'UTC')::date between greatest(effective_from,b.bucket_start) and b.bucket_end) cards_played
    from buckets b
  ), durations as (
    select case when extract(epoch from completed_at-started_at)<300 then 'Under 5m' when extract(epoch from completed_at-started_at)<900 then '5–15m' when extract(epoch from completed_at-started_at)<1800 then '15–30m' when extract(epoch from completed_at-started_at)<3600 then '30–60m' else '60m+' end bucket,
      case when extract(epoch from completed_at-started_at)<300 then 1 when extract(epoch from completed_at-started_at)<900 then 2 when extract(epoch from completed_at-started_at)<1800 then 3 when extract(epoch from completed_at-started_at)<3600 then 4 else 5 end bucket_order,count(*) sessions
    from scoped_sessions where status='completed' and started_at is not null and completed_at is not null group by 1,2
  ) select jsonb_build_object('granularity',p_granularity,'series',coalesce((select jsonb_agg(to_jsonb(s) order by bucket_start) from series s),'[]'::jsonb),
    'duration_histogram',coalesce((select jsonb_agg(jsonb_build_object('bucket',bucket,'sessions',sessions) order by bucket_order) from durations),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'partial_warnings','[]'::jsonb,
    'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from)) into result;
  return result;
end $$;

create or replace function public.decked_command_centre_retention_v3(
  p_environment text,p_from date,p_to date,p_play_mode text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date;result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  with active as (
    select distinct e.analytics_user_id,(e.occurred_at at time zone 'UTC')::date active_date
    from public.analytics_events e where e.environment=p_environment and e.analytics_user_id is not null and (e.occurred_at at time zone 'UTC')::date<=p_to
      and (p_include_qa or not e.is_trusted_qa) and (p_play_mode is null or e.play_mode=p_play_mode)
  ), first_seen as (select analytics_user_id,min(active_date) first_seen_date from active group by 1), daily as (
    select f.first_seen_date cohort_date,count(*) cohort_size,
      case when f.first_seen_date+1<=p_to then count(*) filter(where exists(select 1 from active a where a.analytics_user_id=f.analytics_user_id and a.active_date=f.first_seen_date+1)) end d1_retained,
      case when f.first_seen_date+7<=p_to then count(*) filter(where exists(select 1 from active a where a.analytics_user_id=f.analytics_user_id and a.active_date=f.first_seen_date+7)) end d7_retained,
      case when f.first_seen_date+30<=p_to then count(*) filter(where exists(select 1 from active a where a.analytics_user_id=f.analytics_user_id and a.active_date=f.first_seen_date+30)) end d30_retained
    from first_seen f where f.first_seen_date between effective_from and p_to group by 1
  ), daily_rows as (
    select *,case when d1_retained is null then null else round(100.0*d1_retained/nullif(cohort_size,0),1) end d1_rate,
      case when d7_retained is null then null else round(100.0*d7_retained/nullif(cohort_size,0),1) end d7_rate,
      case when d30_retained is null then null else round(100.0*d30_retained/nullif(cohort_size,0),1) end d30_rate from daily
  ), weekly as (
    select date_trunc('week',f.first_seen_date)::date cohort_start,count(*) cohort_size,count(*) filter(where exists(select 1 from active a where a.analytics_user_id=f.analytics_user_id and a.active_date between date_trunc('week',f.first_seen_date)::date+7 and date_trunc('week',f.first_seen_date)::date+13)) retained
    from first_seen f where f.first_seen_date between effective_from and p_to group by 1
  ), monthly as (
    select date_trunc('month',f.first_seen_date)::date cohort_start,count(*) cohort_size,count(*) filter(where exists(select 1 from active a where a.analytics_user_id=f.analytics_user_id and a.active_date>=date_trunc('month',f.first_seen_date)+interval '1 month' and a.active_date<date_trunc('month',f.first_seen_date)+interval '2 months')) retained
    from first_seen f where f.first_seen_date between effective_from and p_to group by 1
  ) select jsonb_build_object('summary',jsonb_build_object(
      'd1_rate',(select round(100.0*sum(d1_retained)/nullif(sum(cohort_size),0),1) from daily where d1_retained is not null),
      'd7_rate',(select round(100.0*sum(d7_retained)/nullif(sum(cohort_size),0),1) from daily where d7_retained is not null),
      'd30_rate',(select round(100.0*sum(d30_retained)/nullif(sum(cohort_size),0),1) from daily where d30_retained is not null)),
    'daily',coalesce((select jsonb_agg(to_jsonb(d) order by cohort_date) from daily_rows d),'[]'::jsonb),
    'weekly',coalesce((select jsonb_agg(jsonb_build_object('cohort_start',cohort_start,'cohort_size',cohort_size,'retained',retained,'retention_rate',round(100.0*retained/nullif(cohort_size,0),1)) order by cohort_start) from weekly),'[]'::jsonb),
    'monthly',coalesce((select jsonb_agg(jsonb_build_object('cohort_start',cohort_start,'cohort_size',cohort_size,'retained',retained,'retention_rate',round(100.0*retained/nullif(cohort_size,0),1)) order by cohort_start) from monthly),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from)) into result;
  return result;
end $$;

create or replace function public.decked_command_centre_devices_v3(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date;result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  with relevant_events as (
    select e.analytics_session_id,e.analytics_user_id,e.event_name from public.analytics_events e where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between effective_from and p_to and e.analytics_session_id is not null and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode)
  ), sessions as (
    select analytics_session_id,(min(analytics_user_id::text) filter(where analytics_user_id is not null))::uuid analytics_user_id,count(*) filter(where event_name in ('game_started','multiplayer_game_started','rematch_started')) game_starts,count(*) filter(where event_name in ('game_completed','multiplayer_game_completed')) completions from relevant_events group by analytics_session_id
  ), attributed as (
    select s.*,case when o.properties->>'device_class' in ('mobile','tablet','desktop') then o.properties->>'device_class' else 'unknown' end device_class,case when o.event_id is null then 'unknown' when coalesce((o.properties->>'is_pwa')::boolean,false) then 'pwa' else 'browser' end access_mode from sessions s left join lateral (
      select a.event_id,a.properties from public.analytics_events a where a.environment=p_environment and a.analytics_session_id=s.analytics_session_id and a.event_name='app_opened' and (p_include_qa or not a.is_trusted_qa) order by a.occurred_at limit 1
    ) o on true
  ), device_rows as (select device_class,count(distinct analytics_user_id) active_players,count(*) sessions,coalesce(sum(game_starts),0) game_starts,coalesce(sum(completions),0) completions from attributed group by 1),
  access_rows as (select access_mode,count(distinct analytics_user_id) active_players,count(*) sessions,coalesce(sum(game_starts),0) game_starts,coalesce(sum(completions),0) completions from attributed group by 1)
  select jsonb_build_object('devices',coalesce((select jsonb_agg(to_jsonb(d) order by device_class) from device_rows d),'[]'::jsonb),'access_modes',coalesce((select jsonb_agg(to_jsonb(a) order by access_mode) from access_rows a),'[]'::jsonb),'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'partial_warnings',case when exists(select 1 from attributed where device_class='unknown') then jsonb_build_array('Some sessions predate device capture or did not include an app-open marker and are shown as Unknown.') else '[]'::jsonb end,'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from)) into result;
  return result;
end $$;

create or replace function public.decked_command_centre_overview_v3(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date;prior_from date;prior_to date;period_days integer;current_metrics jsonb;previous_metrics jsonb;trend jsonb;games jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then raise exception 'Invalid play mode filter.' using errcode='22023'; end if;
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);period_days:=p_to-effective_from+1;prior_to:=effective_from-1;prior_from:=prior_to-period_days+1;
  with identities as (
    select e.analytics_user_id,min((e.occurred_at at time zone 'UTC')::date) first_seen_date from public.analytics_events e
    where e.environment=p_environment and e.analytics_user_id is not null and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode) group by 1
  ), active as (
    select distinct e.analytics_user_id,(e.occurred_at at time zone 'UTC')::date active_date,e.analytics_session_id,e.event_name from public.analytics_events e
    where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode)
  ), sess as (
    select * from public.analytics_game_sessions s where s.environment=p_environment and (s.setup_started_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not s.is_trusted_qa) and (p_game_id is null or s.game_id=p_game_id) and (p_play_mode is null or s.play_mode=p_play_mode)
  ), room as (
    select * from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not r.is_trusted_qa) and (p_game_id is null or r.game_id=p_game_id) and (p_play_mode is null or p_play_mode='play_together')
  ) select jsonb_build_object(
    'daily_active',(select count(distinct analytics_user_id) from active where active_date=p_to),'weekly_active',(select count(distinct analytics_user_id) from active where active_date between p_to-6 and p_to),'monthly_active',(select count(distinct analytics_user_id) from active where active_date between p_to-29 and p_to),
    'new_players',(select count(distinct a.analytics_user_id) from active a join identities i using(analytics_user_id) where i.first_seen_date between effective_from and p_to),'returning_players',(select count(distinct a.analytics_user_id) from active a join identities i using(analytics_user_id) where i.first_seen_date<effective_from),
    'game_starts',(select count(*) from sess where started_at is not null),'completions',(select count(*) from sess where status='completed'),'cards_played',(select coalesce(sum(cards_presented),0) from sess),'replays',(select count(*) from active where event_name in ('game_replay_selected','rematch_started')),
    'rooms_created',(select count(*) from room),'rooms_started',(select count(*) from room where first_game_started_at is not null),'eligible_rooms',(select count(*) from room where successful_join_count>0),'rematch_starts',(select coalesce(sum(rematch_start_count),0) from room),
    'sessions',(select count(distinct analytics_session_id) from active where analytics_session_id is not null),'error_sessions',(select count(distinct analytics_session_id) from active where analytics_session_id is not null and event_name in ('rpc_failed','frontend_error')),
    'median_session_duration_seconds',(select percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) from sess where status='completed' and started_at is not null and completed_at is not null)
  ) into current_metrics;
  with identities as (
    select e.analytics_user_id,min((e.occurred_at at time zone 'UTC')::date) first_seen_date from public.analytics_events e where e.environment=p_environment and e.analytics_user_id is not null and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode) group by 1
  ), active as (
    select distinct e.analytics_user_id,(e.occurred_at at time zone 'UTC')::date active_date,e.analytics_session_id,e.event_name from public.analytics_events e where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between prior_from and prior_to and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode)
  ), sess as (
    select * from public.analytics_game_sessions s where s.environment=p_environment and (s.setup_started_at at time zone 'UTC')::date between prior_from and prior_to and (p_include_qa or not s.is_trusted_qa) and (p_game_id is null or s.game_id=p_game_id) and (p_play_mode is null or s.play_mode=p_play_mode)
  ), room as (
    select * from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between prior_from and prior_to and (p_include_qa or not r.is_trusted_qa) and (p_game_id is null or r.game_id=p_game_id) and (p_play_mode is null or p_play_mode='play_together')
  ) select jsonb_build_object(
    'daily_active',(select count(distinct analytics_user_id) from active where active_date=prior_to),'weekly_active',(select count(distinct analytics_user_id) from active where active_date between prior_to-6 and prior_to),'monthly_active',(select count(distinct analytics_user_id) from active where active_date between prior_to-29 and prior_to),
    'new_players',(select count(distinct a.analytics_user_id) from active a join identities i using(analytics_user_id) where i.first_seen_date between prior_from and prior_to),'returning_players',(select count(distinct a.analytics_user_id) from active a join identities i using(analytics_user_id) where i.first_seen_date<prior_from),
    'game_starts',(select count(*) from sess where started_at is not null),'completions',(select count(*) from sess where status='completed'),'cards_played',(select coalesce(sum(cards_presented),0) from sess),'replays',(select count(*) from active where event_name in ('game_replay_selected','rematch_started')),
    'rooms_created',(select count(*) from room),'rooms_started',(select count(*) from room where first_game_started_at is not null),'eligible_rooms',(select count(*) from room where successful_join_count>0),'rematch_starts',(select coalesce(sum(rematch_start_count),0) from room),
    'sessions',(select count(distinct analytics_session_id) from active where analytics_session_id is not null),'error_sessions',(select count(distinct analytics_session_id) from active where analytics_session_id is not null and event_name in ('rpc_failed','frontend_error')),
    'median_session_duration_seconds',(select percentile_cont(.5) within group(order by extract(epoch from completed_at-started_at)) from sess where status='completed' and started_at is not null and completed_at is not null)
  ) into previous_metrics;
  with dates as (select generate_series(effective_from,p_to,'1 day'::interval)::date metric_date), scoped as (select * from public.analytics_game_sessions s where s.environment=p_environment and (s.setup_started_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not s.is_trusted_qa) and (p_game_id is null or s.game_id=p_game_id) and (p_play_mode is null or s.play_mode=p_play_mode)), rows as (select d.metric_date,count(s.game_session_id) filter(where s.started_at is not null) starts,count(s.game_session_id) filter(where s.status='completed') completions from dates d left join scoped s on (s.setup_started_at at time zone 'UTC')::date=d.metric_date group by d.metric_date)
  select coalesce(jsonb_agg(to_jsonb(rows) order by metric_date),'[]'::jsonb) into trend from rows;
  with scoped as (select * from public.analytics_game_sessions s where s.environment=p_environment and (s.setup_started_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not s.is_trusted_qa) and (p_game_id is null or s.game_id=p_game_id) and (p_play_mode is null or s.play_mode=p_play_mode)), rows as (select game_id,count(*) filter(where started_at is not null) starts,count(*) filter(where status='completed') completions from scoped group by game_id)
  select coalesce(jsonb_agg(jsonb_build_object('game_id',game_id,'starts',starts,'completions',completions,'completion_rate',case when starts=0 then 0 else round(100.0*completions/starts,1) end) order by starts desc,game_id),'[]'::jsonb) into games from (select * from rows order by starts desc,game_id limit 10) ranked;
  return jsonb_build_object('current',current_metrics,'previous',previous_metrics,'trend',trend,'top_games',games,'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from),'partial_warnings','[]'::jsonb);
end $$;

revoke all on function public.decked_command_centre_overview_trends_v3(text,date,date,text,text,text,boolean,boolean),public.decked_command_centre_retention_v3(text,date,date,text,boolean,boolean),public.decked_command_centre_devices_v3(text,date,date,text,text,boolean,boolean) from public,anon;

grant execute on function public.decked_command_centre_overview_trends_v3(text,date,date,text,text,text,boolean,boolean),public.decked_command_centre_retention_v3(text,date,date,text,boolean,boolean),public.decked_command_centre_devices_v3(text,date,date,text,text,boolean,boolean) to authenticated;
