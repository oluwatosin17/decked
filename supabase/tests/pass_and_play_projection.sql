\set ON_ERROR_STOP on
begin;

insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,game_session_id,game_id,play_mode,app_version,properties)
values
('fa100000-0000-4000-8000-000000000001','game_setup_started','browser','development',now()-interval '2 minutes','fa200000-0000-4000-8000-000000000001','fa300000-0000-4000-8000-000000000001','fa400000-0000-4000-8000-000000000001','charades','pass_and_play','projection-test','{"game_id":"charades","play_mode":"pass_and_play","initial_step":"setup"}'),
('fa100000-0000-4000-8000-000000000002','game_started','browser','development',now()-interval '1 minute','fa200000-0000-4000-8000-000000000001','fa300000-0000-4000-8000-000000000001','fa400000-0000-4000-8000-000000000001','charades','pass_and_play','projection-test','{"game_id":"charades","play_mode":"pass_and_play","starting_step":"game","configured_card_count":10,"player_count":2}'),
('fa100000-0000-4000-8000-000000000003','game_completed','browser','development',now(),'fa200000-0000-4000-8000-000000000001','fa300000-0000-4000-8000-000000000001','fa400000-0000-4000-8000-000000000001','charades','pass_and_play','projection-test','{"game_id":"charades","play_mode":"pass_and_play","completion_reason":"deck_finished","cards_presented":10,"cards_skipped":1,"duration_seconds":60}');

do $$ declare fact public.analytics_game_sessions%rowtype;begin
  select * into fact from public.analytics_game_sessions where game_session_id='fa400000-0000-4000-8000-000000000001';
  if fact.status<>'completed' or fact.cards_presented<>10 or fact.cards_skipped<>1 or fact.player_count<>2 or fact.started_at is null or fact.completed_at is null then
    raise exception 'Pass-and-play projection mismatch: %',to_jsonb(fact);
  end if;
  if not exists(select 1 from cron.job where jobname='decked-analytics-aggregate-refresh' and schedule='*/5 * * * *') then
    raise exception 'Analytics aggregate refresh schedule is missing';
  end if;
end $$;

rollback;
