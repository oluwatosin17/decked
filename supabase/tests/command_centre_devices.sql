\set ON_ERROR_STOP on
begin;

insert into auth.users(id,is_anonymous) values('fa111111-1111-4111-8111-111111111111',false) on conflict(id) do nothing;
insert into public.command_centre_staff(user_id,role) values('fa111111-1111-4111-8111-111111111111','viewer') on conflict(user_id) do update set role='viewer',status='active';
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,game_session_id,game_id,play_mode,app_version,properties) values
('fa222222-2222-4222-8222-222222222222','app_opened','browser','development',now(),'fa333333-3333-4333-8333-333333333333','fa444444-4444-4444-8444-444444444444',null,null,null,'device-test','{"initial_screen_id":"home","entry_path":"/","is_pwa":false,"device_class":"mobile"}'),
('fa555555-5555-4555-8555-555555555555','game_started','browser','development',now(),'fa333333-3333-4333-8333-333333333333','fa444444-4444-4444-8444-444444444444','fa666666-6666-4666-8666-666666666666','icebreaker','pass_and_play','device-test','{"starting_step":"game","configured_card_count":5,"player_count":2}');

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','fa111111-1111-4111-8111-111111111111',true);
do $$ declare result jsonb; begin
  result:=public.decked_command_centre_devices('development',current_date-1,current_date,'icebreaker','pass_and_play');
  if result#>>'{devices,0,device_class}'<>'mobile' or (result#>>'{devices,0,game_starts}')::integer<>1 then raise exception 'Unexpected device result: %',result; end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.role','anon',true);
do $$ begin
  begin perform public.decked_command_centre_devices('development',current_date-1,current_date,null,null);raise exception 'Anonymous device read succeeded';exception when insufficient_privilege then null;end;
end $$;

rollback;
