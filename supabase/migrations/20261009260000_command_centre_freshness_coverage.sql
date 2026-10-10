-- Report freshness only when one successful refresh covered the complete query range.
-- A newer partial refresh must not make an older, wider dashboard range appear fresh.

create or replace function public.decked_aggregate_freshness(p_from date,p_to date)
returns timestamptz language sql stable security definer set search_path='' as $$
  select max(completed_at)
  from public.analytics_aggregate_refreshes
  where status='completed'
    and from_date<=p_from
    and to_date>=p_to;
$$;

revoke all on function public.decked_aggregate_freshness(date,date) from public,anon,authenticated;

comment on function public.decked_aggregate_freshness(date,date) is
  'Latest successful aggregate refresh that fully covers the inclusive requested UTC date range; null means freshness is unknown or incomplete.';
