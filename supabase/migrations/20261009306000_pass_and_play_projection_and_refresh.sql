-- Project trusted, validated pass-and-play browser events into the shared game
-- session facts used by Command Centre, then refresh recent aggregates every
-- five minutes. Analytics failures remain isolated from gameplay.

create function public.decked_project_pass_and_play_session()
returns trigger language plpgsql security definer set search_path='' as $$
declare
  event_play_mode text:=coalesce(new.play_mode,new.properties->>'play_mode');
  card_count integer:=coalesce((new.properties->>'configured_card_count')::integer,0);
  presented integer:=coalesce((new.properties->>'cards_presented')::integer,(new.properties->>'card_number')::integer,0);
  skipped integer:=coalesce((new.properties->>'cards_skipped')::integer,0);
  duration_seconds integer:=coalesce((new.properties->>'duration_seconds')::integer,0);
  started_time timestamptz;
begin
  if new.source<>'browser' or event_play_mode<>'pass_and_play' or new.game_session_id is null or new.game_id is null
    or new.event_name not in ('game_setup_started','game_setup_resumed','game_started','card_presented','card_advanced','game_completed','game_session_abandoned') then
    return new;
  end if;

  started_time:=case when new.event_name='game_completed' then new.occurred_at-(duration_seconds*interval '1 second')
    when new.event_name in ('game_started','card_presented','card_advanced') then new.occurred_at else null end;

  insert into public.analytics_game_sessions(
    game_session_id,environment,analytics_user_id,multiplayer_room_ref,game_id,play_mode,status,
    setup_started_at,started_at,completed_at,last_activity_at,abandoned_at,configured_card_count,
    cards_presented,cards_skipped,rounds_completed,player_count,completion_reason,app_version_started,updated_at
  ) values(
    new.game_session_id,new.environment,new.analytics_user_id,null,new.game_id,'pass_and_play',
    case new.event_name when 'game_completed' then 'completed' when 'game_session_abandoned' then 'abandoned'
      when 'game_started' then 'started' when 'card_presented' then 'started' when 'card_advanced' then 'started' else 'setup' end,
    coalesce(started_time,new.occurred_at),started_time,
    case when new.event_name='game_completed' then new.occurred_at end,new.occurred_at,
    case when new.event_name='game_session_abandoned' then new.occurred_at end,
    nullif(card_count,0),presented,skipped,coalesce((new.properties->>'rounds_completed')::integer,0),
    nullif((new.properties->>'player_count')::integer,0),new.properties->>'completion_reason',new.app_version,now()
  ) on conflict(game_session_id) do update set
    status=case
      when excluded.status='completed' then 'completed'
      when analytics_game_sessions.status='completed' then analytics_game_sessions.status
      when excluded.status='abandoned' then 'abandoned'
      when excluded.status='started' and analytics_game_sessions.status='setup' then 'started'
      else analytics_game_sessions.status end,
    started_at=coalesce(analytics_game_sessions.started_at,excluded.started_at),
    completed_at=coalesce(excluded.completed_at,analytics_game_sessions.completed_at),
    abandoned_at=coalesce(excluded.abandoned_at,analytics_game_sessions.abandoned_at),
    last_activity_at=greatest(analytics_game_sessions.last_activity_at,excluded.last_activity_at),
    configured_card_count=coalesce(excluded.configured_card_count,analytics_game_sessions.configured_card_count),
    cards_presented=greatest(analytics_game_sessions.cards_presented,excluded.cards_presented),
    cards_skipped=greatest(analytics_game_sessions.cards_skipped,excluded.cards_skipped),
    rounds_completed=greatest(analytics_game_sessions.rounds_completed,excluded.rounds_completed),
    player_count=coalesce(excluded.player_count,analytics_game_sessions.player_count),
    completion_reason=coalesce(excluded.completion_reason,analytics_game_sessions.completion_reason),
    updated_at=now();
  return new;
end $$;

revoke all on function public.decked_project_pass_and_play_session() from public,anon,authenticated;
create trigger analytics_events_project_pass_and_play
after insert on public.analytics_events for each row
execute function public.decked_project_pass_and_play_session();

-- Reconcile any events that arrived between analytics enablement and this migration.
insert into public.analytics_game_sessions(
  game_session_id,environment,analytics_user_id,game_id,play_mode,status,setup_started_at,started_at,
  completed_at,last_activity_at,abandoned_at,configured_card_count,cards_presented,cards_skipped,
  rounds_completed,player_count,completion_reason,app_version_started,updated_at
)
select game_session_id,min(environment),(array_agg(analytics_user_id order by occurred_at) filter(where analytics_user_id is not null))[1],min(game_id),'pass_and_play',
  case when bool_or(event_name='game_completed') then 'completed'
    when bool_or(event_name='game_session_abandoned') then 'abandoned'
    when bool_or(event_name in ('game_started','card_presented','card_advanced')) then 'started' else 'setup' end,
  min(occurred_at),min(occurred_at) filter(where event_name in ('game_started','card_presented','card_advanced')),
  max(occurred_at) filter(where event_name='game_completed'),max(occurred_at),
  max(occurred_at) filter(where event_name='game_session_abandoned'),
  max((properties->>'configured_card_count')::integer),
  greatest(coalesce(max((properties->>'cards_presented')::integer),0),coalesce(max((properties->>'card_number')::integer),0)),
  coalesce(max((properties->>'cards_skipped')::integer),0),coalesce(max((properties->>'rounds_completed')::integer),0),
  max((properties->>'player_count')::integer),max(properties->>'completion_reason'),min(app_version),now()
from public.analytics_events
where source='browser' and play_mode='pass_and_play' and game_session_id is not null and game_id is not null
  and event_name in ('game_setup_started','game_setup_resumed','game_started','card_presented','card_advanced','game_completed','game_session_abandoned')
group by game_session_id
on conflict(game_session_id) do nothing;

create extension if not exists pg_cron with schema pg_catalog;
do $$ declare existing_job bigint;begin
  select jobid into existing_job from cron.job where jobname='decked-analytics-aggregate-refresh' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job);end if;
  perform cron.schedule(
    'decked-analytics-aggregate-refresh',
    '*/5 * * * *',
    'select public.decked_refresh_analytics_aggregates(current_date - 2, current_date);'
  );
end $$;

select public.decked_refresh_analytics_aggregates(current_date - 2,current_date);

comment on function public.decked_project_pass_and_play_session() is
  'Projects validated pass-and-play lifecycle events into durable session facts; stores no prompt text, answers, names, or room codes.';
