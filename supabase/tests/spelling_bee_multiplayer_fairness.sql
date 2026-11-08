-- Four authenticated identities, server-selected words and pre-result privacy.
-- Run after all repository migrations against an isolated database.
begin;
insert into auth.users(id,is_anonymous) values
  ('e1111111-1111-4111-8111-111111111111',false),
  ('e2222222-2222-4222-8222-222222222222',false),
  ('e3333333-3333-4333-8333-333333333333',false),
  ('e4444444-4444-4444-8444-444444444444',false);
insert into public.decked_rooms(id,code,game_id,host_user_id) values
  ('e9999999-9999-4999-8999-999999999999','SPQA42','spelling-bee','e1111111-1111-4111-8111-111111111111');
insert into public.decked_room_players(room_id,user_id,display_name,color,position) values
  ('e9999999-9999-4999-8999-999999999999','e1111111-1111-4111-8111-111111111111','A','#dc2827',0),
  ('e9999999-9999-4999-8999-999999999999','e2222222-2222-4222-8222-222222222222','B','#dc2827',1),
  ('e9999999-9999-4999-8999-999999999999','e3333333-3333-4333-8333-333333333333','C','#dc2827',2),
  ('e9999999-9999-4999-8999-999999999999','e4444444-4444-4444-8444-444444444444','D','#dc2827',3);
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
select public.decked_start_spelling_game(
  'e9999999-9999-4999-8999-999999999999',
  '["Team A","Team B"]',
  '["e1111111-1111-4111-8111-111111111111","e2222222-2222-4222-8222-222222222222","e3333333-3333-4333-8333-333333333333","e4444444-4444-4444-8444-444444444444"]',
  30,2,'[1,2]');
reset role;
do $$
declare deck jsonb;
begin
  select s.deck into deck from public.decked_spelling_secrets s
    where room_id='e9999999-9999-4999-8999-999999999999';
  if jsonb_array_length(deck)<>4 then raise exception 'Wrong secret deck size'; end if;
  if deck->0->>'level'<>deck->1->>'level' or deck->2->>'level'<>deck->3->>'level'
    then raise exception 'Teams did not receive equal difficulty per round'; end if;
  if (select count(distinct value->>'word') from jsonb_array_elements(deck))<>4
    then raise exception 'Word repeated in a game'; end if;
end $$;
set local role authenticated;
do $$
declare response jsonb;
begin
  perform set_config('request.jwt.claim.sub','e1111111-1111-4111-8111-111111111111',true);
  response:=public.decked_get_spelling_word('e9999999-9999-4999-8999-999999999999');
  if response->>'audio_id' is not null then raise exception 'Audio leaked before turn start'; end if;
  perform public.decked_spelling_action('e9999999-9999-4999-8999-999999999999','begin',0);
  response:=public.decked_get_spelling_word('e9999999-9999-4999-8999-999999999999');
  if response->>'audio_id' is null or response->>'definition' is null or response->'word'<>'null'::jsonb
    then raise exception 'Active speller did not get private clues'; end if;
  perform set_config('request.jwt.claim.sub','e2222222-2222-4222-8222-222222222222',true);
  response:=public.decked_get_spelling_word('e9999999-9999-4999-8999-999999999999');
  if response->>'audio_id' is not null or response->>'definition' is not null
    then raise exception 'Teammate received private clues'; end if;
  perform set_config('request.jwt.claim.sub','e3333333-3333-4333-8333-333333333333',true);
  response:=public.decked_get_spelling_word('e9999999-9999-4999-8999-999999999999');
  if response->>'audio_id' is not null then raise exception 'Other team received private audio'; end if;
  perform set_config('request.jwt.claim.sub','e4444444-4444-4444-8444-444444444444',true);
  response:=public.decked_get_spelling_word('e9999999-9999-4999-8999-999999999999');
  if response->>'audio_id' is not null then raise exception 'Fourth player received private audio'; end if;
end $$;
reset role;
rollback;
