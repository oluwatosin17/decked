-- Country codes are aggregate, privacy-safe dimensions. Keep small countries
-- individually visible so launch operators can tell which country was reached.
create or replace function public.decked_command_centre_geography(p_environment text,p_from date,p_to date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501';end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  with located as (
    select e.*,g.country_code from public.analytics_events e join public.analytics_event_geography g on g.environment=e.environment and g.event_id=e.event_id
    where e.environment=p_environment and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
  ), first_seen as (
    select analytics_user_id,min((occurred_at at time zone 'UTC')::date) first_date from public.analytics_events where environment=p_environment and analytics_user_id is not null group by 1
  ), countries as (
    select l.country_code,
      count(distinct l.analytics_user_id) filter(where l.analytics_user_id is not null) active_players,
      count(distinct l.analytics_user_id) filter(where f.first_date between p_from and p_to) new_players,
      count(distinct l.analytics_user_id) filter(where f.first_date<p_from) returning_players,
      count(distinct l.analytics_session_id) filter(where l.analytics_session_id is not null) sessions,
      count(*) filter(where l.event_name in ('game_started','multiplayer_game_started')) game_starts,
      count(*) filter(where l.event_name in ('game_completed','multiplayer_game_completed')) completions,
      count(*) filter(where l.event_name='room_created') rooms_created
    from located l left join first_seen f using(analytics_user_id) group by l.country_code
  ), daily as (
    select (occurred_at at time zone 'UTC')::date metric_date,country_code,count(distinct analytics_user_id) filter(where analytics_user_id is not null) active_players
    from located group by 1,2
  ), coverage as (
    select count(distinct analytics_user_id) filter(where analytics_user_id is not null) total_players,
      count(distinct analytics_user_id) filter(where analytics_user_id is not null and exists(select 1 from public.analytics_event_geography gx where gx.environment=e.environment and gx.event_id=e.event_id)) located_players
    from public.analytics_events e where environment=p_environment and (occurred_at at time zone 'UTC')::date between p_from and p_to
  )
  select jsonb_build_object(
    'summary',jsonb_build_object('countries_reached',(select count(*) from countries),'located_players',coalesce((select located_players from coverage),0),'total_players',coalesce((select total_players from coverage),0),'international_players',coalesce((select sum(active_players) from countries where country_code<>'NG'),0)),
    'countries',coalesce((select jsonb_agg(jsonb_build_object('country_code',country_code,'active_players',active_players,'new_players',new_players,'returning_players',returning_players,'sessions',sessions,'game_starts',game_starts,'completions',completions,'completion_rate',case when game_starts>0 then round(100.0*completions/game_starts,1) else 0 end,'rooms_created',rooms_created) order by active_players desc,country_code) from countries),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(jsonb_build_object('metric_date',metric_date,'country_code',country_code,'active_players',active_players) order by metric_date,country_code) from daily),'[]'::jsonb),
    'refreshed_at',(select max(attributed_at) from public.analytics_event_geography where environment=p_environment)
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_geography(text,date,date) from public,anon;
grant execute on function public.decked_command_centre_geography(text,date,date) to authenticated;
