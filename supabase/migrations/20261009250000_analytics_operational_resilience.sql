-- Bound browser ingestion during retry storms without exposing quota state.

alter function public.decked_ingest_analytics_events(jsonb)
  rename to decked_ingest_analytics_events_unthrottled;

revoke all on function public.decked_ingest_analytics_events_unthrottled(jsonb)
  from public, anon, authenticated;

create table public.analytics_ingest_rate_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  event_count integer not null check (event_count >= 0),
  updated_at timestamptz not null default now()
);

alter table public.analytics_ingest_rate_limits enable row level security;
revoke all on public.analytics_ingest_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.analytics_ingest_rate_limits to service_role;
comment on table public.analytics_ingest_rate_limits is
  'Private rolling-minute browser-ingestion counters. One row per Supabase user; delete inactive rows during routine retention maintenance.';

create function public.decked_consume_analytics_quota(p_event_count integer)
returns void language plpgsql security definer set search_path='' as $$
declare caller uuid:=auth.uid(); current_count integer; minute_start timestamptz:=date_trunc('minute',clock_timestamp());
begin
  if caller is null or auth.role()<>'authenticated' then raise exception 'An authenticated player session is required.' using errcode='42501'; end if;
  if p_event_count not between 1 and 25 then raise exception 'Invalid analytics quota request.' using errcode='22023'; end if;
  insert into public.analytics_ingest_rate_limits(user_id,window_started_at,event_count,updated_at)
  values(caller,minute_start,p_event_count,clock_timestamp())
  on conflict(user_id) do update set
    window_started_at=case when analytics_ingest_rate_limits.window_started_at<minute_start then minute_start else analytics_ingest_rate_limits.window_started_at end,
    event_count=case when analytics_ingest_rate_limits.window_started_at<minute_start then excluded.event_count else analytics_ingest_rate_limits.event_count+excluded.event_count end,
    updated_at=clock_timestamp()
  returning event_count into current_count;
  if current_count>300 then raise exception 'Analytics ingestion rate limit exceeded.' using errcode='54000'; end if;
end $$;

create function public.decked_ingest_analytics_events(p_events jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
begin
  if p_events is null or jsonb_typeof(p_events)<>'array' or jsonb_array_length(p_events) not between 1 and 25 then
    raise exception 'Analytics batches must contain between 1 and 25 events.' using errcode='22023';
  end if;
  if octet_length(p_events::text)>65536 then raise exception 'Analytics payload exceeds 64 KiB.' using errcode='22023'; end if;
  perform public.decked_consume_analytics_quota(jsonb_array_length(p_events));
  return public.decked_ingest_analytics_events_unthrottled(p_events);
end $$;

revoke all on function public.decked_consume_analytics_quota(integer) from public,anon,authenticated;
revoke all on function public.decked_ingest_analytics_events(jsonb) from public,anon;
grant execute on function public.decked_ingest_analytics_events(jsonb) to authenticated;
