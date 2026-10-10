-- Privacy-safe retention cohorts. Only aggregate counts and rates leave the database.
create function public.decked_command_centre_retention(p_environment text,p_from date,p_to date)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501';end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  with daily as(
    select f.first_seen_date cohort_date,count(*) cohort_size,
      case when f.first_seen_date+1<=p_to then count(*) filter(where exists(select 1 from public.analytics_daily_active_users a where a.environment=f.environment and a.analytics_user_id=f.analytics_user_id and a.metric_date=f.first_seen_date+1)) end d1_retained,
      case when f.first_seen_date+7<=p_to then count(*) filter(where exists(select 1 from public.analytics_daily_active_users a where a.environment=f.environment and a.analytics_user_id=f.analytics_user_id and a.metric_date=f.first_seen_date+7)) end d7_retained,
      case when f.first_seen_date+30<=p_to then count(*) filter(where exists(select 1 from public.analytics_daily_active_users a where a.environment=f.environment and a.analytics_user_id=f.analytics_user_id and a.metric_date=f.first_seen_date+30)) end d30_retained
    from public.analytics_user_first_seen f where f.environment=p_environment and f.first_seen_date between p_from and p_to group by 1
  ), daily_rows as(
    select cohort_date,cohort_size,d1_retained,d7_retained,d30_retained,
      case when d1_retained is null then null else round(100.0*d1_retained/cohort_size,1) end d1_rate,
      case when d7_retained is null then null else round(100.0*d7_retained/cohort_size,1) end d7_rate,
      case when d30_retained is null then null else round(100.0*d30_retained/cohort_size,1) end d30_rate from daily
  ), weekly as(
    select date_trunc('week',f.first_seen_date)::date cohort_start,count(*) cohort_size,
      count(*) filter(where exists(select 1 from public.analytics_daily_active_users a where a.environment=f.environment and a.analytics_user_id=f.analytics_user_id and a.metric_date between date_trunc('week',f.first_seen_date)::date+7 and date_trunc('week',f.first_seen_date)::date+13)) retained
    from public.analytics_user_first_seen f where f.environment=p_environment and f.first_seen_date between p_from and p_to group by 1
  ), monthly as(
    select date_trunc('month',f.first_seen_date)::date cohort_start,count(*) cohort_size,
      count(*) filter(where exists(select 1 from public.analytics_daily_active_users a where a.environment=f.environment and a.analytics_user_id=f.analytics_user_id and a.metric_date>=date_trunc('month',f.first_seen_date)+interval '1 month' and a.metric_date<date_trunc('month',f.first_seen_date)+interval '2 months')) retained
    from public.analytics_user_first_seen f where f.environment=p_environment and f.first_seen_date between p_from and p_to group by 1
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'd1_rate',(select round(100.0*sum(d1_retained)/nullif(sum(cohort_size),0),1) from daily where d1_retained is not null),
      'd7_rate',(select round(100.0*sum(d7_retained)/nullif(sum(cohort_size),0),1) from daily where d7_retained is not null),
      'd30_rate',(select round(100.0*sum(d30_retained)/nullif(sum(cohort_size),0),1) from daily where d30_retained is not null)),
    'daily',coalesce((select jsonb_agg(to_jsonb(d) order by cohort_date) from daily_rows d),'[]'::jsonb),
    'weekly',coalesce((select jsonb_agg(jsonb_build_object('cohort_start',cohort_start,'cohort_size',cohort_size,'retained',retained,'retention_rate',round(100.0*retained/nullif(cohort_size,0),1)) order by cohort_start) from weekly),'[]'::jsonb),
    'monthly',coalesce((select jsonb_agg(jsonb_build_object('cohort_start',cohort_start,'cohort_size',cohort_size,'retained',retained,'retention_rate',round(100.0*retained/nullif(cohort_size,0),1)) order by cohort_start) from monthly),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to)
  ) into result;return result;
end $$;
revoke all on function public.decked_command_centre_retention(text,date,date) from public,anon;
grant execute on function public.decked_command_centre_retention(text,date,date) to authenticated;
comment on function public.decked_command_centre_retention(text,date,date) is 'Aggregate D1/D7/D30 and weekly/monthly retention cohorts; never returns analytics identities.';
