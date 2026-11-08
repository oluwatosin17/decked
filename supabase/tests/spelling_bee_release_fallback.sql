-- A published release with one audio-less entry must not become a partial deck.
-- Run after all repository migrations against an isolated database.
begin;
insert into auth.users(id,is_anonymous) values
  ('f1111111-1111-4111-8111-111111111111',false),
  ('f2222222-2222-4222-8222-222222222222',false),
  ('f3333333-3333-4333-8333-333333333333',false),
  ('f4444444-4444-4444-8444-444444444444',false);
create temp table spelling_release_fixture on commit drop as
  select gen_random_uuid() as id,c.* from public.decked_spelling_catalog c;
insert into public.content_items(id,game_id,item_kind,published_version)
  select id,'spelling-bee','prompt',1 from spelling_release_fixture;
insert into public.content_item_versions(item_id,version,body,normalized_body,metadata)
  select id,1,word,word,jsonb_build_object(
    'level',level,'definition','Managed: '||definition,
    'sentence',sentence,'variants',variants,'review_status','approved')
  from spelling_release_fixture;
insert into public.content_releases(id,game_id,status,item_count,checksum,published_at)
  values('f8888888-8888-4888-8888-888888888888','spelling-bee','published',37,'local-test',now());
insert into public.content_release_items(release_id,item_id,version,category_ids)
  select 'f8888888-8888-4888-8888-888888888888',id,1,array['level-'||level] from spelling_release_fixture;
insert into public.content_items(id,game_id,item_kind,published_version)
  values('f7777777-7777-4777-8777-777777777777','spelling-bee','prompt',1);
insert into public.content_item_versions(item_id,version,body,normalized_body,metadata)
  values('f7777777-7777-4777-8777-777777777777',1,'unrecorded','unrecorded',
    '{"level":1,"definition":"A word with no recorded audio.","sentence":"The unrecorded word needs a voice clip.","variants":[],"review_status":"approved"}');
insert into public.content_release_items(release_id,item_id,version,category_ids)
  values('f8888888-8888-4888-8888-888888888888','f7777777-7777-4777-8777-777777777777',1,array['level-1']);
insert into public.decked_rooms(id,code,game_id,host_user_id) values
  ('f9999999-9999-4999-8999-999999999999','SPQA43','spelling-bee','f1111111-1111-4111-8111-111111111111');
insert into public.decked_room_players(room_id,user_id,display_name,color,position) values
  ('f9999999-9999-4999-8999-999999999999','f1111111-1111-4111-8111-111111111111','A','#dc2827',0),
  ('f9999999-9999-4999-8999-999999999999','f2222222-2222-4222-8222-222222222222','B','#dc2827',1),
  ('f9999999-9999-4999-8999-999999999999','f3333333-3333-4333-8333-333333333333','C','#dc2827',2),
  ('f9999999-9999-4999-8999-999999999999','f4444444-4444-4444-8444-444444444444','D','#dc2827',3);
set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','f1111111-1111-4111-8111-111111111111',true);
select public.decked_start_spelling_game(
  'f9999999-9999-4999-8999-999999999999',
  '["Team A","Team B"]',
  '["f1111111-1111-4111-8111-111111111111","f2222222-2222-4222-8222-222222222222","f3333333-3333-4333-8333-333333333333","f4444444-4444-4444-8444-444444444444"]',
  30,2,'[1,2]');
reset role;
do $$
declare deck jsonb;
begin
  select s.deck into deck from public.decked_spelling_secrets s
    where room_id='f9999999-9999-4999-8999-999999999999';
  if jsonb_array_length(deck)<>4 then raise exception 'Wrong secret deck size'; end if;
  if exists(select 1 from jsonb_array_elements(deck) entry where entry->>'definition' like 'Managed:%')
    then raise exception 'Incomplete managed release was partly used'; end if;
end $$;
-- Once the release is complete, all selected words must come from that release.
delete from public.content_release_items
  where release_id='f8888888-8888-4888-8888-888888888888'
    and item_id='f7777777-7777-4777-8777-777777777777';
update public.content_releases set item_count=36
  where id='f8888888-8888-4888-8888-888888888888';
insert into public.decked_rooms(id,code,game_id,host_user_id) values
  ('f9999999-9999-4999-8999-999999999998','SPQA44','spelling-bee','f1111111-1111-4111-8111-111111111111');
insert into public.decked_room_players(room_id,user_id,display_name,color,position) values
  ('f9999999-9999-4999-8999-999999999998','f1111111-1111-4111-8111-111111111111','A','#dc2827',0),
  ('f9999999-9999-4999-8999-999999999998','f2222222-2222-4222-8222-222222222222','B','#dc2827',1),
  ('f9999999-9999-4999-8999-999999999998','f3333333-3333-4333-8333-333333333333','C','#dc2827',2),
  ('f9999999-9999-4999-8999-999999999998','f4444444-4444-4444-8444-444444444444','D','#dc2827',3);
set local role authenticated;
select set_config('request.jwt.claim.sub','f1111111-1111-4111-8111-111111111111',true);
select public.decked_start_spelling_game(
  'f9999999-9999-4999-8999-999999999998',
  '["Team A","Team B"]',
  '["f1111111-1111-4111-8111-111111111111","f2222222-2222-4222-8222-222222222222","f3333333-3333-4333-8333-333333333333","f4444444-4444-4444-8444-444444444444"]',
  30,2,'[1,2]');
reset role;
do $$
declare deck jsonb;
begin
  select s.deck into deck from public.decked_spelling_secrets s
    where room_id='f9999999-9999-4999-8999-999999999998';
  if jsonb_array_length(deck)<>4 then raise exception 'Wrong managed deck size'; end if;
  if exists(select 1 from jsonb_array_elements(deck) entry where entry->>'definition' not like 'Managed:%')
    then raise exception 'Complete managed release was not used'; end if;
end $$;
rollback;
