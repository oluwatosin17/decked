-- Privacy-safe device and access-mode aggregates for Command Centre staff.
-- Device information is inferred from app_opened and never exposes analytics identities.

create function public.decked_command_centre_devices(
  p_environment text,
  p_from date,
  p_to date,
  p_game_id text default null,
  p_play_mode text default null
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then
    raise exception 'Command Centre staff access is required.' using errcode='42501';
  end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then
    raise exception 'Invalid play mode filter.' using errcode='22023';
  end if;

  with relevant_events as (
    select e.analytics_session_id,e.analytics_user_id,e.event_name
    from public.analytics_events e
    where e.environment=p_environment
      and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
      and e.analytics_session_id is not null
      and (p_game_id is null or e.game_id=p_game_id)
      and (p_play_mode is null or e.play_mode=p_play_mode)
  ), sessions as (
    select analytics_session_id,
      (min(analytics_user_id::text) filter(where analytics_user_id is not null))::uuid analytics_user_id,
      count(*) filter(where event_name in ('game_started','multiplayer_game_started','rematch_started')) game_starts,
      count(*) filter(where event_name in ('game_completed','multiplayer_game_completed')) completions
    from relevant_events group by analytics_session_id
  ), attributed as (
    select s.*,
      case when opening.properties->>'device_class' in ('mobile','tablet','desktop') then opening.properties->>'device_class' else 'unknown' end device_class,
      case when opening.event_id is null then 'unknown' when coalesce((opening.properties->>'is_pwa')::boolean,false) then 'pwa' else 'browser' end access_mode
    from sessions s
    left join lateral (
      select a.event_id,a.properties from public.analytics_events a
      where a.environment=p_environment and a.analytics_session_id=s.analytics_session_id and a.event_name='app_opened'
      order by a.occurred_at limit 1
    ) opening on true
  ), device_rows as (
    select device_class,count(distinct analytics_user_id) active_players,count(*) sessions,
      coalesce(sum(game_starts),0) game_starts,coalesce(sum(completions),0) completions
    from attributed group by device_class
  ), access_rows as (
    select access_mode,count(distinct analytics_user_id) active_players,count(*) sessions,
      coalesce(sum(game_starts),0) game_starts,coalesce(sum(completions),0) completions
    from attributed group by access_mode
  )
  select jsonb_build_object(
    'devices',coalesce((select jsonb_agg(to_jsonb(d) order by d.device_class) from device_rows d),'[]'::jsonb),
    'access_modes',coalesce((select jsonb_agg(to_jsonb(a) order by a.access_mode) from access_rows a),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',case when exists(select 1 from attributed where device_class='unknown') then jsonb_build_array('Some sessions predate device capture or did not include an app-open marker and are shown as Unknown.') else '[]'::jsonb end
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_devices(text,date,date,text,text) from public,anon;
grant execute on function public.decked_command_centre_devices(text,date,date,text,text) to authenticated;

comment on function public.decked_command_centre_devices(text,date,date,text,text) is
  'Returns staff-authorized device and browser/PWA aggregates without raw analytics identities.';
