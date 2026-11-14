-- Recovered from the linked project's Supabase migration history.

-- Correct future gameplay depth and room-lifecycle reporting without rewriting
-- historical analytics. Gameplay state and protected multiplayer data are not changed.

begin;

set local lock_timeout = '10s';

set local statement_timeout = '60s';

select pg_advisory_xact_lock(hashtext('decked:gameplay-metrics-room-events:20261020'));

do $$
begin
  if to_regprocedure('public.decked_write_database_event(text,uuid,text,uuid,jsonb,text)') is null
    or position('coalesce(p_properties' in pg_get_functiondef('public.decked_write_database_event(text,uuid,text,uuid,jsonb,text)'::regprocedure))=0 then
    raise exception 'Production database-event writer differs from the reviewed baseline';
  end if;
  if to_regprocedure('public.decked_command_centre_overview_v3(text,date,date,text,text,boolean,boolean)') is null
    or to_regprocedure('public.decked_command_centre_funnels_v3(text,date,date,text,text,text,text,text,text,boolean,boolean)') is null then
    raise exception 'Trusted-QA reporting prerequisites are missing';
  end if;
end $$;

create or replace function public.decked_authoritative_gameplay_metrics(
  p_game_id text,
  p_session jsonb,
  p_fallback_total integer default null
)
returns table(cards_presented integer, rounds_completed integer)
language plpgsql immutable set search_path = '' as $$
declare
  configured integer;
  progress integer;
  terminal boolean;
  total_turns integer;
begin
  configured := public.decked_multiplayer_configured_card_count(p_game_id,p_session,p_fallback_total);
  progress := public.decked_multiplayer_card_number(p_session);
  terminal := public.decked_multiplayer_session_is_terminal(p_session);

  if p_game_id='charades' then
    total_turns := nullif(greatest(0,coalesce(
      (p_session->>'totalTurns')::integer,
      case when jsonb_typeof(p_session->'teams')='array'
        then jsonb_array_length(p_session->'teams')*coalesce((p_session->>'deckSize')::integer,0) end,
      0)),0);
    cards_presented := case when terminal and total_turns is not null then total_turns
      else least(coalesce(total_turns,progress+1),progress+1) end;
    rounds_completed := cards_presented;
    return next; return;
  end if;

  cards_presented := case
    when configured is null then greatest(0,progress+1)
    when terminal then configured
    else least(configured,greatest(0,progress+1))
  end;
  rounds_completed := case when p_game_id in (
    'two-truths-bluff','who-said-that','bad-advice-only','not-me-your-honour',
    'mini-mystery','imposter','do-you-know-me','think-fast','whot'
  ) then cards_presented else 0 end;
  return next;
end;
$$;

create or replace function public.decked_write_database_event(
  p_name text,p_room_ref uuid,p_game_id text,p_game_session_id uuid,
  p_properties jsonb,p_idempotency_key text
) returns void language plpgsql security definer set search_path='' as $$
declare corrected jsonb:=coalesce(p_properties,'{}'::jsonb);session_state jsonb;fallback_total integer;metrics record;
begin
  if p_name='multiplayer_game_completed' and p_game_id not in (
    'imposter','mini-mystery','do-you-know-me','think-fast','whot'
  ) then
    select coalesce(r.game_state->'session','{}'::jsonb),r.total_cards into session_state,fallback_total
    from public.analytics_room_links l join public.decked_rooms r on r.id=l.room_id
    where l.multiplayer_room_ref=p_room_ref;
    if session_state is not null then
      select * into metrics from public.decked_authoritative_gameplay_metrics(p_game_id,session_state,fallback_total);
      corrected:=jsonb_set(jsonb_set(corrected,'{cards_presented}',to_jsonb(metrics.cards_presented),true),'{rounds_completed}',to_jsonb(metrics.rounds_completed),true);
    end if;
  end if;
  insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,supabase_user_id,game_session_id,multiplayer_room_ref,game_id,play_mode,app_version,properties,idempotency_key)
  values(gen_random_uuid(),p_name,'database',public.decked_analytics_environment(),now(),auth.uid(),p_game_session_id,p_room_ref,p_game_id,'play_together','database',corrected,p_idempotency_key)
  on conflict do nothing;
end;
$$;

revoke all on function public.decked_write_database_event(text,uuid,text,uuid,jsonb,text) from public,anon,authenticated;

grant execute on function public.decked_write_database_event(text,uuid,text,uuid,jsonb,text) to service_role;

create or replace function public.decked_reconcile_shared_gameplay_metrics()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  link public.analytics_room_links;
  session_state jsonb:=coalesce(new.game_state->'session','{}'::jsonb);
  metrics record;
begin
  -- These games maintain dedicated, server-authoritative state and analytics.
  -- Never infer their metrics from the compatibility room JSON.
  if new.game_id in ('imposter','mini-mystery','do-you-know-me','think-fast','whot') then
    return new;
  end if;
  select * into link from public.analytics_room_links where room_id=new.id;
  if link.current_game_session_id is null then return new; end if;

  select * into metrics from public.decked_authoritative_gameplay_metrics(new.game_id,session_state,new.total_cards);
  update public.analytics_game_sessions
  set cards_presented=case when new.game_id='charades' or public.decked_multiplayer_session_is_terminal(session_state) then metrics.cards_presented else greatest(cards_presented,metrics.cards_presented) end,
      rounds_completed=case when new.game_id='charades' or public.decked_multiplayer_session_is_terminal(session_state) then metrics.rounds_completed else greatest(rounds_completed,metrics.rounds_completed) end,
      updated_at=now()
  where game_session_id=link.current_game_session_id;
  return new;
end;
$$;

drop trigger if exists zzz_decked_rooms_reconcile_gameplay_metrics on public.decked_rooms;

create trigger zzz_decked_rooms_reconcile_gameplay_metrics
after insert or update of game_state,status on public.decked_rooms
for each row execute function public.decked_reconcile_shared_gameplay_metrics();

revoke all on function public.decked_authoritative_gameplay_metrics(text,jsonb,integer),public.decked_reconcile_shared_gameplay_metrics() from public,anon,authenticated;

grant execute on function public.decked_authoritative_gameplay_metrics(text,jsonb,integer),public.decked_reconcile_shared_gameplay_metrics() to service_role;

create or replace function public.decked_command_centre_overview_v4(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare payload jsonb;effective_from date;period_days integer;prior_from date;prior_to date;current_started bigint;previous_started bigint;
begin
  payload:=public.decked_command_centre_overview_v3(p_environment,p_from,p_to,p_game_id,p_play_mode,p_include_qa,p_include_prelaunch);
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);period_days:=p_to-effective_from+1;prior_to:=effective_from-1;prior_from:=prior_to-period_days+1;
  select count(*) into current_started from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between effective_from and p_to and r.successful_join_count>0 and r.first_game_started_at is not null and (p_include_qa or not r.is_trusted_qa) and (p_game_id is null or r.game_id=p_game_id) and (p_play_mode is null or p_play_mode='play_together');
  select count(*) into previous_started from public.analytics_room_facts r where r.environment=p_environment and (r.created_at at time zone 'UTC')::date between prior_from and prior_to and r.successful_join_count>0 and r.first_game_started_at is not null and (p_include_qa or not r.is_trusted_qa) and (p_game_id is null or r.game_id=p_game_id) and (p_play_mode is null or p_play_mode='play_together');
  payload:=jsonb_set(payload,'{current,eligible_rooms_started}',to_jsonb(current_started),true);
  payload:=jsonb_set(payload,'{previous,eligible_rooms_started}',to_jsonb(previous_started),true);
  return payload;
end;
$$;

create or replace function public.decked_command_centre_funnels_v4(
  p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_device_class text default null,p_country text default null,p_acquisition_source text default null,p_app_version text default null,
  p_include_qa boolean default false,p_include_prelaunch boolean default false
) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare effective_from date;result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_country is not null then raise exception 'Country filtering is unavailable because country is not collected.' using errcode='22023'; end if;
  effective_from:=public.decked_reporting_from(p_from,p_include_prelaunch);
  with eligible_sessions as (
    select distinct analytics_session_id from public.analytics_events where environment=p_environment and event_name='app_opened' and analytics_session_id is not null and (occurred_at at time zone 'UTC')::date between effective_from-1 and p_to and (p_include_qa or not is_trusted_qa) and (p_device_class is null or coalesce(properties->>'device_class','unknown')=p_device_class) and (p_acquisition_source is null or properties->>'utm_source'=p_acquisition_source) and (p_app_version is null or app_version=p_app_version)
  ), scoped as (
    select e.* from public.analytics_events e where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between effective_from and p_to and (p_include_qa or not e.is_trusted_qa) and (p_game_id is null or e.game_id=p_game_id) and (p_play_mode is null or e.play_mode=p_play_mode) and (e.analytics_session_id is null or exists(select 1 from eligible_sessions x where x.analytics_session_id=e.analytics_session_id))
  ), defs as (
    select * from (values
      ('discovery',1,'Landing','app_opened',null::text,false),('discovery',2,'Game selected','game_selected',null::text,false),('discovery',3,'Play mode selected','play_mode_selected',null::text,false),('discovery',4,'Game started','game_started',null::text,false),('discovery',5,'Completion','game_completed',null::text,false),
      ('multiplayer_host',1,'Room created','room_created','database',false),('multiplayer_host',2,'First guest joined','room_joined','database',true),('multiplayer_host',3,'Game started','multiplayer_game_started','database',false),('multiplayer_host',4,'Completion','multiplayer_game_completed','database',false)
    ) d(funnel_id,step_order,step_name,event_name,required_source,first_guest_only)
  ), counts as (
    select d.funnel_id,d.step_order,d.step_name,count(distinct case when d.funnel_id='multiplayer_host' then e.multiplayer_room_ref::text else coalesce(e.game_session_id::text,e.analytics_session_id::text,e.multiplayer_room_ref::text) end)::bigint entrants
    from defs d left join scoped e on e.event_name=d.event_name and (d.required_source is null or e.source=d.required_source) and (not d.first_guest_only or e.properties->>'is_first_guest'='true') group by 1,2,3
  ), rates as (
    select *,first_value(entrants) over(partition by funnel_id order by step_order) first_entrants,lag(entrants) over(partition by funnel_id order by step_order) previous_entrants from counts
  ), grouped as (
    select funnel_id,jsonb_agg(jsonb_build_object('step_order',step_order,'step_name',step_name,'entrants',entrants,'conversion_from_previous',case when step_order=1 then 100 when coalesce(previous_entrants,0)=0 then 0 else round(100.0*entrants/previous_entrants,1) end,'conversion_from_first',case when coalesce(first_entrants,0)=0 then 0 else round(100.0*entrants/first_entrants,1) end,'median_seconds_from_previous',null) order by step_order) steps from rates group by funnel_id
  ) select jsonb_build_object('funnels',coalesce(jsonb_agg(jsonb_build_object('funnel_id',funnel_id,'name',case funnel_id when 'discovery' then 'Discovery to completion' else 'Play Together host' end,'steps',steps)),'[]'::jsonb),'rules',jsonb_build_object('conversion_window_hours',24,'ordering','authoritative event identity','repeat_handling','one room per multiplayer stage','timezone','UTC entry date','first_card_note','QA filtering is server-authoritative.'),'refreshed_at',public.decked_aggregate_freshness(effective_from,p_to),'scope',jsonb_build_object('include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'effective_from',effective_from),'available_filters',jsonb_build_object('country',false,'device_class',true,'acquisition_source',true,'app_version',true)) into result from grouped;
  return result;
end;
$$;

revoke all on function public.decked_command_centre_overview_v4(text,date,date,text,text,boolean,boolean),public.decked_command_centre_funnels_v4(text,date,date,text,text,text,text,text,text,boolean,boolean) from public,anon;

grant execute on function public.decked_command_centre_overview_v4(text,date,date,text,text,boolean,boolean),public.decked_command_centre_funnels_v4(text,date,date,text,text,text,text,text,text,boolean,boolean) to authenticated;

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
    payload:=public.decked_command_centre_overview_v4(p_environment,p_from,p_to,p_game_id,p_play_mode,p_include_qa,p_include_prelaunch);
    csv:='period,game_starts,completions,cards_played,rooms_created,rooms_started,eligible_rooms_started,rematch_starts';
    for row_data in select jsonb_build_object('period','current')||(payload->'current') union all select jsonb_build_object('period','previous')||(payload->'previous') loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(row_data->>'period'),public.decked_csv_cell(row_data->>'game_starts'),public.decked_csv_cell(row_data->>'completions'),public.decked_csv_cell(row_data->>'cards_played'),public.decked_csv_cell(row_data->>'rooms_created'),public.decked_csv_cell(row_data->>'rooms_started'),public.decked_csv_cell(row_data->>'eligible_rooms_started'),public.decked_csv_cell(row_data->>'rematch_starts')],',');end loop;
  elsif p_report='funnels' then
    payload:=public.decked_command_centre_funnels_v4(p_environment,p_from,p_to,p_game_id,p_play_mode,p_device_class,null,p_acquisition_source,p_app_version,p_include_qa,p_include_prelaunch);
    csv:='funnel_id,step_order,step_name,entrants,conversion_from_previous,conversion_from_first';
    for row_data in select jsonb_build_object('funnel_id',f->>'funnel_id')||step from jsonb_array_elements(payload->'funnels') f cross join lateral jsonb_array_elements(f->'steps') step loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(row_data->>'funnel_id'),public.decked_csv_cell(row_data->>'step_order'),public.decked_csv_cell(row_data->>'step_name'),public.decked_csv_cell(row_data->>'entrants'),public.decked_csv_cell(row_data->>'conversion_from_previous'),public.decked_csv_cell(row_data->>'conversion_from_first')],',');end loop;
  else raise exception 'Unsupported scoped report.' using errcode='22023'; end if;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid() and status='active';
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id) values(auth.uid(),actor_role,'report_exported','analytics_report',p_report,jsonb_build_object('report',p_report,'include_qa',p_include_qa,'include_prelaunch',p_include_prelaunch,'row_count',row_count),p_request_id) on conflict(request_id) do nothing;
  return jsonb_build_object('filename','decked-'||p_report||'-'||p_from||'-'||p_to||'.csv','csv',csv,'row_count',row_count,'generated_at',generated,'refreshed_at',payload->>'refreshed_at');
end $$;

revoke all on function public.decked_export_command_centre_scoped_csv(text,text,date,date,text,text,integer,text,text,text,boolean,boolean,uuid) from public,anon;

grant execute on function public.decked_export_command_centre_scoped_csv(text,text,date,date,text,text,integer,text,text,text,boolean,boolean,uuid) to authenticated;

do $$
declare m record;
begin
  select * into m from public.decked_authoritative_gameplay_metrics('charades','{"step":"done","teams":[{},{}],"deckSize":1,"turnIndex":1,"cardIdx":9}'::jsonb,10);
  if m.cards_presented<>2 or m.rounds_completed<>2 then raise exception 'Charades metric semantics failed: %',to_jsonb(m); end if;
  select * into m from public.decked_authoritative_gameplay_metrics('icebreaker','{"step":"done","totalCards":2,"cardIndex":2}'::jsonb,2);
  if m.cards_presented<>2 or m.rounds_completed<>0 then raise exception 'Deck metric clamping failed: %',to_jsonb(m); end if;
  if has_function_privilege('anon','public.decked_authoritative_gameplay_metrics(text,jsonb,integer)','EXECUTE') or has_function_privilege('authenticated','public.decked_reconcile_shared_gameplay_metrics()','EXECUTE') then raise exception 'Internal metric functions are browser-accessible'; end if;
end $$;

commit;
