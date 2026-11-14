-- Recovered from the linked project's Supabase migration history.

-- Observe receiver-side realtime delivery and recognize Whot winners in the
-- authoritative multiplayer lifecycle. This does not change gameplay rules.

create or replace function public.decked_multiplayer_session_is_terminal(p_session jsonb)
returns boolean language sql immutable set search_path = '' as $$
  select coalesce(p_session->>'step', '') in ('done', 'winner')
    or nullif(coalesce(p_session->'whotState'->>'winnerId', ''), '') is not null
    or (
      coalesce(p_session->>'step', '') in ('game', 'gameplay')
      and coalesce((p_session->>'totalCards')::integer, 0) > 0
      and coalesce(
        (p_session->>'cardIndex')::integer,
        (p_session->>'cardIdx')::integer,
        (p_session->>'gameCardIndex')::integer,
        (p_session->>'challengeIdx')::integer,
        (p_session->>'idx')::integer,
        0
      ) >= coalesce((p_session->>'totalCards')::integer, 0)
    );
$$;

revoke all on function public.decked_multiplayer_session_is_terminal(jsonb) from public, anon, authenticated;

grant execute on function public.decked_multiplayer_session_is_terminal(jsonb) to service_role;

create or replace function public.decked_command_centre_performance(p_environment text,p_from date,p_to date,p_game_id text default null,p_device_class text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_device_class is not null and p_device_class not in ('mobile','tablet','desktop','unknown') then raise exception 'Invalid device class filter.' using errcode='22023'; end if;
  with meta as (
    select distinct on (analytics_session_id) analytics_session_id,coalesce(properties->>'device_class','unknown') device_class
    from public.analytics_events where environment=p_environment and event_name='app_opened' and analytics_session_id is not null and (occurred_at at time zone 'UTC')::date between p_from-1 and p_to order by analytics_session_id,occurred_at,received_at,id
  ), samples as (
    select e.properties->>'metric_name' metric_name,(e.properties->>'duration_ms')::numeric duration_ms,e.properties->>'rating' rating
    from public.analytics_events e left join meta m using(analytics_session_id)
    where e.environment=p_environment and e.event_name='performance_measured' and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
      and (p_game_id is null or e.game_id=p_game_id) and (p_device_class is null or coalesce(m.device_class,'unknown')=p_device_class)
      and e.properties->>'metric_name' = any(array['ttfb','dom_content_loaded','load_complete','first_contentful_paint','largest_contentful_paint','interaction_to_next_paint','multiplayer_sync','multiplayer_remote_update'])
      and jsonb_typeof(e.properties->'duration_ms')='number'
  ), aggregated as (
    select metric_name,count(*) sample_count,round((percentile_cont(.5) within group(order by duration_ms))::numeric,1) p50_ms,round((percentile_cont(.75) within group(order by duration_ms))::numeric,1) p75_ms,round((percentile_cont(.95) within group(order by duration_ms))::numeric,1) p95_ms,round(100.0*count(*) filter(where rating='good')/count(*),1) good_rate
    from samples group by metric_name
  ) select jsonb_build_object('metrics',coalesce(jsonb_agg(to_jsonb(aggregated) order by metric_name),'[]'::jsonb),'refreshed_at',now()) into result from aggregated;
  return result;
end $$;

revoke all on function public.decked_command_centre_performance(text,date,date,text,text) from public,anon;

grant execute on function public.decked_command_centre_performance(text,date,date,text,text) to authenticated;
