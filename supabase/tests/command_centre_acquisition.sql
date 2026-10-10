\set ON_ERROR_STOP on
begin;

insert into auth.users(id,is_anonymous) values('fb111111-1111-4111-8111-111111111111',false) on conflict(id) do nothing;
insert into public.command_centre_staff(user_id,role) values('fb111111-1111-4111-8111-111111111111','viewer') on conflict(user_id) do update set role='viewer',status='active';
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,game_session_id,game_id,play_mode,app_version,properties) values
('fb222222-2222-4222-8222-222222222222','app_opened','browser','development',now(),'fb333333-3333-4333-8333-333333333333','fb444444-4444-4444-8444-444444444444',null,null,null,'acquisition-test','{"initial_screen_id":"home","entry_path":"/games","is_pwa":false,"device_class":"mobile","referrer_domain":"chatgpt.com"}'),
('fb555555-5555-4555-8555-555555555555','game_selected','browser','development',now(),'fb333333-3333-4333-8333-333333333333','fb444444-4444-4444-8444-444444444444',null,'icebreaker',null,'acquisition-test','{"game_id":"icebreaker","selection_surface":"browse"}'),
('fb666666-6666-4666-8666-666666666666','game_started','browser','development',now(),'fb333333-3333-4333-8333-333333333333','fb444444-4444-4444-8444-444444444444','fb777777-7777-4777-8777-777777777777','icebreaker','pass_and_play','acquisition-test','{"starting_step":"game","configured_card_count":2,"player_count":2}'),
('fb888888-8888-4888-8888-888888888888','game_completed','browser','development',now(),'fb333333-3333-4333-8333-333333333333','fb444444-4444-4444-8444-444444444444','fb777777-7777-4777-8777-777777777777','icebreaker','pass_and_play','acquisition-test','{"completion_reason":"deck_finished","cards_presented":2,"cards_skipped":0,"duration_seconds":30}');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','fb111111-1111-4111-8111-111111111111',true);
do $$ declare result jsonb; begin
  result:=public.decked_command_centre_acquisition('development',current_date-1,current_date,null,'ChatGPT',null,'mobile',null);
  if result#>>'{sources,0,source}'<>'ChatGPT' or (result#>>'{summary,game_starts}')::integer<>1 or (result#>>'{summary,completions}')::integer<>1 then raise exception 'Unexpected acquisition result: %',result; end if;
end $$;

reset role;set local role anon;select set_config('request.jwt.claim.role','anon',true);
do $$ begin begin perform public.decked_command_centre_acquisition('development',current_date-1,current_date,null,null,null,null,null);raise exception 'Anonymous acquisition read succeeded';exception when insufficient_privilege then null;end;end $$;
rollback;
