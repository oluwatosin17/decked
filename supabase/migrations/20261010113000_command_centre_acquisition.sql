-- Staff-only acquisition attribution and conversion reporting.
-- Stores no additional visitor data: it classifies the existing allowlisted
-- UTM values, referral domains, landing paths, and privacy-safe session IDs.

create function public.decked_acquisition_source(p_utm_source text,p_referrer_domain text)
returns text language sql immutable set search_path=''
as $$
  select case
    when lower(coalesce(p_utm_source,'')) ~ '(chatgpt|openai)' or lower(coalesce(p_referrer_domain,'')) in ('chatgpt.com','chat.openai.com') then 'ChatGPT'
    when lower(coalesce(p_utm_source,'')) ~ 'google' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)google\.' then 'Google'
    when lower(coalesce(p_utm_source,'')) ~ 'bing' or lower(coalesce(p_referrer_domain,'')) in ('bing.com','www.bing.com') then 'Bing'
    when lower(coalesce(p_utm_source,'')) ~ '(perplexity|claude|anthropic|copilot|gemini|you.com)' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)(perplexity\.ai|claude\.ai|anthropic\.com|copilot\.microsoft\.com|gemini\.google\.com|you\.com)$' then 'Other AI'
    when lower(coalesce(p_utm_source,'')) ~ 'instagram' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)instagram\.com$' then 'Instagram'
    when lower(coalesce(p_utm_source,'')) ~ 'tiktok' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)tiktok\.com$' then 'TikTok'
    when lower(coalesce(p_utm_source,'')) ~ 'facebook' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)(facebook|fb)\.com$' then 'Facebook'
    when lower(coalesce(p_utm_source,'')) ~ '(^|[_-])(twitter|x)([_-]|$)' or lower(coalesce(p_referrer_domain,'')) in ('x.com','twitter.com','www.x.com','www.twitter.com') then 'X / Twitter'
    when lower(coalesce(p_utm_source,'')) ~ 'whatsapp' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)whatsapp\.com$' then 'WhatsApp'
    when lower(coalesce(p_utm_source,'')) ~ '(share|shared_link)' then 'Shared link'
    when lower(coalesce(p_utm_source,'')) ~ '(social|linkedin|reddit|snapchat|threads)' or lower(coalesce(p_referrer_domain,'')) ~ '(^|\.)(linkedin\.com|reddit\.com|snapchat\.com|threads\.net)$' then 'Other social'
    when nullif(p_utm_source,'') is not null then initcap(replace(left(lower(p_utm_source),40),'_',' '))
    when nullif(p_referrer_domain,'') is not null then 'Other referral'
    else 'Direct'
  end
$$;

create function public.decked_command_centre_acquisition(
  p_environment text,p_from date,p_to date,p_game_id text default null,
  p_source text default null,p_landing_page text default null,
  p_device_class text default null,p_country text default null
) returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_source is not null and (char_length(p_source)>50 or p_source!~'^[A-Za-z0-9 /._+-]+$') then raise exception 'Invalid acquisition source.' using errcode='22023'; end if;
  if p_landing_page is not null and p_landing_page!~'^/[A-Za-z0-9/_-]*$' then raise exception 'Invalid landing page.' using errcode='22023'; end if;
  if p_device_class is not null and p_device_class not in ('mobile','tablet','desktop','unknown') then raise exception 'Invalid device class.' using errcode='22023'; end if;
  if p_country is not null and p_country!~'^[A-Z]{2}$' then raise exception 'Invalid country.' using errcode='22023'; end if;

  with first_seen as (
    select analytics_user_id,min((occurred_at at time zone 'UTC')::date) first_date
    from public.analytics_events where environment=p_environment and analytics_user_id is not null group by analytics_user_id
  ), opens as (
    select distinct on (e.analytics_session_id)
      e.event_id,e.analytics_session_id,e.analytics_user_id,e.occurred_at,
      coalesce(e.properties->>'entry_path','/') landing_page,
      public.decked_acquisition_source(e.properties->>'utm_source',e.properties->>'referrer_domain') source,
      case when e.properties->>'device_class' in ('mobile','tablet','desktop') then e.properties->>'device_class' else 'unknown' end device_class,
      coalesce(g.country_code,'') country_code,e.app_version
    from public.analytics_events e left join public.analytics_event_geography g on g.environment=e.environment and g.event_id=e.event_id
    where e.environment=p_environment and e.event_name='app_opened' and e.analytics_session_id is not null
      and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
    order by e.analytics_session_id,e.occurred_at,e.event_id
  ), event_facts as (
    select o.analytics_session_id,
      count(distinct e.game_id) filter(where e.event_name='game_selected' and e.game_id is not null) selections,
      count(distinct e.game_session_id) filter(where e.event_name in ('game_started','multiplayer_game_started','rematch_started') and e.game_session_id is not null) game_starts,
      count(distinct e.game_session_id) filter(where e.event_name='card_presented' and e.game_session_id is not null) first_cards,
      count(distinct e.game_session_id) filter(where e.event_name in ('game_completed','multiplayer_game_completed') and e.game_session_id is not null) completions,
      min(e.occurred_at) filter(where e.event_name in ('game_started','multiplayer_game_started','rematch_started')) first_start_at
    from opens o left join public.analytics_events e on e.environment=p_environment and e.analytics_session_id=o.analytics_session_id
      and (e.occurred_at at time zone 'UTC')::date between p_from and p_to
      and (p_game_id is null or e.game_id=p_game_id)
    group by o.analytics_session_id
  ), attributed as (
    select o.*,coalesce(f.selections,0) selections,coalesce(f.game_starts,0) game_starts,coalesce(f.first_cards,0) first_cards,coalesce(f.completions,0) completions,
      extract(epoch from f.first_start_at-o.occurred_at) seconds_to_start,
      coalesce(fs.first_date,(o.occurred_at at time zone 'UTC')::date)>=p_from is_new
    from opens o join event_facts f using(analytics_session_id) left join first_seen fs using(analytics_user_id)
    where (p_game_id is null or f.selections+f.game_starts+f.first_cards+f.completions>0)
      and (p_source is null or o.source=p_source) and (p_landing_page is null or o.landing_page=p_landing_page)
      and (p_device_class is null or o.device_class=p_device_class) and (p_country is null or o.country_code=p_country)
  ), source_rows as (
    select a.source,count(distinct a.analytics_user_id) visitors,
      count(distinct a.analytics_user_id) filter(where a.is_new) new_visitors,count(distinct a.analytics_user_id) filter(where not a.is_new) returning_visitors,
      count(*) sessions,sum(a.selections) game_selections,sum(a.game_starts) game_starts,sum(a.first_cards) first_cards,sum(a.completions) completions,
      round(100.0*count(*) filter(where a.selections>0)/nullif(count(*),0),1) selection_rate,
      round(100.0*count(*) filter(where a.game_starts>0)/nullif(count(*),0),1) start_rate,
      round(100.0*count(*) filter(where a.completions>0)/nullif(count(*),0),1) completion_rate,
      percentile_cont(.5) within group(order by a.seconds_to_start) filter(where a.seconds_to_start>=0) median_seconds_to_start,
      (select x.landing_page from attributed x where x.source=a.source group by x.landing_page order by count(*) desc,x.landing_page limit 1) top_landing_page,
      (select e.game_id from attributed x join public.analytics_events e on e.environment=p_environment and e.analytics_session_id=x.analytics_session_id and e.event_name='game_selected' where x.source=a.source and e.game_id is not null and (p_game_id is null or e.game_id=p_game_id) group by e.game_id order by count(*) desc,e.game_id limit 1) top_game_id
    from attributed a group by a.source
  ), landing_rows as (
    select landing_page,count(distinct analytics_user_id) visitors,count(*) sessions,sum(selections) game_selections,sum(game_starts) game_starts,sum(completions) completions
    from attributed group by landing_page
  ), game_rows as (
    select a.source,e.game_id,
      count(distinct a.analytics_session_id) filter(where e.event_name='game_selected') selections,
      count(distinct e.game_session_id) filter(where e.event_name in ('game_started','multiplayer_game_started','rematch_started')) game_starts,
      count(distinct e.game_session_id) filter(where e.event_name in ('game_completed','multiplayer_game_completed')) completions
    from attributed a join public.analytics_events e on e.environment=p_environment and e.analytics_session_id=a.analytics_session_id
    where e.game_id is not null and (e.occurred_at at time zone 'UTC')::date between p_from and p_to and (p_game_id is null or e.game_id=p_game_id)
    group by a.source,e.game_id
  ), daily_rows as (
    select (occurred_at at time zone 'UTC')::date metric_date,source,count(distinct analytics_user_id) visitors,count(*) sessions,sum(game_starts) game_starts,sum(completions) completions
    from attributed group by 1,2
  )
  select jsonb_build_object(
    'summary',jsonb_build_object(
      'visitors',(select count(distinct analytics_user_id) from attributed),'sessions',(select count(*) from attributed),
      'ai_visitors',(select count(distinct analytics_user_id) from attributed where source in ('ChatGPT','Other AI')),
      'game_selections',(select coalesce(sum(selections),0) from attributed),'game_starts',(select coalesce(sum(game_starts),0) from attributed),'completions',(select coalesce(sum(completions),0) from attributed)
    ),
    'sources',coalesce((select jsonb_agg(to_jsonb(s) order by s.visitors desc,s.source) from source_rows s),'[]'::jsonb),
    'landing_pages',coalesce((select jsonb_agg(to_jsonb(l) order by l.visitors desc,l.landing_page) from landing_rows l),'[]'::jsonb),
    'games',coalesce((select jsonb_agg(to_jsonb(g) order by g.selections desc,g.source,g.game_id) from game_rows g),'[]'::jsonb),
    'daily',coalesce((select jsonb_agg(to_jsonb(d) order by d.metric_date,d.source) from daily_rows d),'[]'::jsonb),
    'refreshed_at',public.decked_aggregate_freshness(p_from,p_to),
    'partial_warnings',jsonb_build_array('Referrer suppression can cause AI, social, or shared-link visits to appear as Direct. Attribution is first-touch within each analytics session.')
  ) into result;
  return result;
end $$;

revoke all on function public.decked_acquisition_source(text,text) from public,anon,authenticated;
revoke all on function public.decked_command_centre_acquisition(text,date,date,text,text,text,text,text) from public,anon;
grant execute on function public.decked_command_centre_acquisition(text,date,date,text,text,text,text,text) to authenticated;

comment on function public.decked_command_centre_acquisition(text,date,date,text,text,text,text,text) is
  'Returns staff-only aggregate acquisition sources, landing pages, selected games, and conversion outcomes without raw identities or full URLs.';
