-- Staff-only, privacy-safe trend series for the Command Centre Overview.
-- Returns aggregate counts only; analytics identities never leave the database.

create function public.decked_command_centre_overview_trends(
  p_environment text,
  p_from date,
  p_to date,
  p_game_id text default null,
  p_play_mode text default null,
  p_granularity text default 'day'
) returns jsonb
language plpgsql stable security definer set search_path=''
as $$
declare
  bucket_step interval;
  result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then
    raise exception 'Command Centre staff access is required.' using errcode='42501';
  end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then
    raise exception 'Invalid play mode filter.' using errcode='22023';
  end if;
  if p_granularity not in ('day','week','month','year') then
    raise exception 'Invalid trend granularity.' using errcode='22023';
  end if;
  bucket_step:=case p_granularity when 'day' then interval '1 day' when 'week' then interval '1 week' when 'month' then interval '1 month' else interval '1 year' end;

  with buckets as (
    select bucket::date bucket_start,least(p_to,(bucket+bucket_step-interval '1 day')::date) bucket_end
    from generate_series(date_trunc(p_granularity,p_from::timestamp),date_trunc(p_granularity,p_to::timestamp),bucket_step) bucket
  ), series as (
    select b.bucket_start,b.bucket_end,
      (select count(distinct u.analytics_user_id) from public.analytics_daily_active_users u where u.environment=p_environment and u.metric_date between greatest(p_from,b.bucket_start) and b.bucket_end) active_players,
      (select coalesce(sum(a.metric_value) filter(where a.metric_name='game_starts'),0) from public.analytics_daily_aggregates a where a.environment=p_environment and a.metric_date between greatest(p_from,b.bucket_start) and b.bucket_end and (p_game_id is null or a.game_id=p_game_id) and (p_play_mode is null or a.play_mode=p_play_mode)) game_starts,
      (select coalesce(sum(a.metric_value) filter(where a.metric_name='game_completions'),0) from public.analytics_daily_aggregates a where a.environment=p_environment and a.metric_date between greatest(p_from,b.bucket_start) and b.bucket_end and (p_game_id is null or a.game_id=p_game_id) and (p_play_mode is null or a.play_mode=p_play_mode)) completions,
      (select coalesce(sum(a.metric_value) filter(where a.metric_name='cards_presented'),0) from public.analytics_daily_aggregates a where a.environment=p_environment and a.metric_date between greatest(p_from,b.bucket_start) and b.bucket_end and (p_game_id is null or a.game_id=p_game_id) and (p_play_mode is null or a.play_mode=p_play_mode)) cards_played
    from buckets b
  ), durations as (
    select case
      when extract(epoch from completed_at-started_at)<300 then 'Under 5m'
      when extract(epoch from completed_at-started_at)<900 then '5–15m'
      when extract(epoch from completed_at-started_at)<1800 then '15–30m'
      when extract(epoch from completed_at-started_at)<3600 then '30–60m'
      else '60m+'
    end bucket,
    case
      when extract(epoch from completed_at-started_at)<300 then 1
      when extract(epoch from completed_at-started_at)<900 then 2
      when extract(epoch from completed_at-started_at)<1800 then 3
      when extract(epoch from completed_at-started_at)<3600 then 4
      else 5
    end bucket_order,count(*) sessions
    from public.analytics_game_sessions
    where environment=p_environment and status='completed' and started_at is not null and completed_at is not null
      and (setup_started_at at time zone 'UTC')::date between p_from and p_to
      and (p_game_id is null or game_id=p_game_id) and (p_play_mode is null or play_mode=p_play_mode)
    group by 1,2
  )
  select jsonb_build_object(
    'granularity',p_granularity,
    'series',coalesce((select jsonb_agg(to_jsonb(s) order by s.bucket_start) from series s),'[]'::jsonb),
    'duration_histogram',coalesce((select jsonb_agg(jsonb_build_object('bucket',d.bucket,'sessions',d.sessions) order by d.bucket_order) from durations d),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',case when p_game_id is not null or p_play_mode is not null then jsonb_build_array('Active-player trend is not segmented by game or play mode.') else '[]'::jsonb end
  ) into result;
  return result;
end $$;

revoke all on function public.decked_command_centre_overview_trends(text,date,date,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_overview_trends(text,date,date,text,text,text) to authenticated;

comment on function public.decked_command_centre_overview_trends(text,date,date,text,text,text) is
  'Returns staff-authorized aggregate Overview trends and duration buckets without raw analytics identities.';
