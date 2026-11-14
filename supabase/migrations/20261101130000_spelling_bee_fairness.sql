-- Server-owned word selection and delayed answer reveal for fair Spelling Bee turns.
alter table public.decked_spelling_secrets drop constraint decked_spelling_secrets_deck_check;
alter table public.decked_spelling_secrets add constraint decked_spelling_secrets_deck_check
  check(jsonb_typeof(deck)='array' and jsonb_array_length(deck) between 2 and 36);
create table if not exists public.decked_spelling_catalog (
 word text primary key,
 definition text not null,
 sentence text not null,
 hint_sentence text not null,
 level integer not null check (level between 1 and 3),
 variants jsonb not null default '[]'::jsonb check (jsonb_typeof(variants)='array'),
 audio_id text not null unique check (audio_id ~ '^[0-9a-f]{16}$')
);
alter table public.decked_spelling_catalog enable row level security;
revoke all on public.decked_spelling_catalog from public, anon, authenticated;
insert into public.decked_spelling_catalog(word,definition,sentence,hint_sentence,level,audio_id)
select word,definition,sentence,hint_sentence,level,audio_id
from jsonb_to_recordset('[{"word": "lantern", "definition": "A portable light with a protective case.", "sentence": "We carried a lantern into the garden.", "hint_sentence": "We carried a _____ into the garden.", "level": 1, "audio_id": "616724102448eb2b"}, {"word": "puzzle", "definition": "A problem or game solved by thinking.", "sentence": "The final puzzle took us ten minutes.", "hint_sentence": "The final _____ took us ten minutes.", "level": 1, "audio_id": "f651f48c63523060"}, {"word": "blanket", "definition": "A warm covering used on a bed.", "sentence": "She brought a blanket to the picnic.", "hint_sentence": "She brought a _____ to the picnic.", "level": 1, "audio_id": "1ec1d81b45eafcbe"}, {"word": "basket", "definition": "A container woven from strips of material.", "sentence": "The basket was full of fruit.", "hint_sentence": "The _____ was full of fruit.", "level": 1, "audio_id": "6981c9531f0e09a7"}, {"word": "festival", "definition": "A celebration with events or performances.", "sentence": "Our town hosts a music festival.", "hint_sentence": "Our town hosts a music _____.", "level": 1, "audio_id": "4d12e321aad4982c"}, {"word": "journey", "definition": "An act of travelling from one place to another.", "sentence": "Their journey began at sunrise.", "hint_sentence": "Their _____ began at sunrise.", "level": 1, "audio_id": "0ada982c35ec4edf"}, {"word": "thunder", "definition": "The sound made by a lightning storm.", "sentence": "We heard thunder after the flash.", "hint_sentence": "We heard _____ after the flash.", "level": 1, "audio_id": "53b6ba416107954b"}, {"word": "whisper", "definition": "To speak very softly.", "sentence": "Please whisper while the baby sleeps.", "hint_sentence": "Please _____ while the baby sleeps.", "level": 1, "audio_id": "960e380700bd5ed2"}, {"word": "diamond", "definition": "A very hard clear gemstone.", "sentence": "The ring held a small diamond.", "hint_sentence": "The ring held a small _____.", "level": 1, "audio_id": "dc0bb21935482970"}, {"word": "cinnamon", "definition": "A sweet, warm spice from tree bark.", "sentence": "She added cinnamon to the tea.", "hint_sentence": "She added _____ to the tea.", "level": 1, "audio_id": "3eff3cceb8ad1e3e"}, {"word": "treasure", "definition": "Something valuable that is kept or found.", "sentence": "The children searched for treasure.", "hint_sentence": "The children searched for _____.", "level": 1, "audio_id": "20937ea7d81d1e60"}, {"word": "calendar", "definition": "A chart showing days, weeks and months.", "sentence": "Mark the date on the calendar.", "hint_sentence": "Mark the date on the _____.", "level": 1, "audio_id": "518b7df2c8ffcbde"}, {"word": "adventure", "definition": "An exciting or unusual experience.", "sentence": "The trip became an adventure.", "hint_sentence": "The trip became an _____.", "level": 2, "audio_id": "3b8ee248078331ad"}, {"word": "silhouette", "definition": "A dark outline of a person or object.", "sentence": "Her silhouette appeared in the doorway.", "hint_sentence": "Her _____ appeared in the doorway.", "level": 2, "audio_id": "a368f3a673690d5b"}, {"word": "occasion", "definition": "A particular event or time.", "sentence": "We dressed up for the occasion.", "hint_sentence": "We dressed up for the _____.", "level": 2, "audio_id": "5d169afa35413ec5"}, {"word": "rhythm", "definition": "A repeated pattern of sounds or movements.", "sentence": "The drummer kept a steady rhythm.", "hint_sentence": "The drummer kept a steady _____.", "level": 2, "audio_id": "212b35790d7028ec"}, {"word": "mischief", "definition": "Playful troublemaking.", "sentence": "The puppy was full of mischief.", "hint_sentence": "The puppy was full of _____.", "level": 2, "audio_id": "7d1eddf991634415"}, {"word": "restaurant", "definition": "A place where meals are served to customers.", "sentence": "They met at a new restaurant.", "hint_sentence": "They met at a new _____.", "level": 2, "audio_id": "47801ebd759980d8"}, {"word": "boulevard", "definition": "A broad street, often lined with trees.", "sentence": "The parade moved down the boulevard.", "hint_sentence": "The parade moved down the _____.", "level": 2, "audio_id": "a976096e56540017"}, {"word": "exaggerate", "definition": "To describe something as bigger or greater than it is.", "sentence": "Do not exaggerate the size of the fish.", "hint_sentence": "Do not _____ the size of the fish.", "level": 2, "audio_id": "0a65e312b06fa2cb"}, {"word": "conscience", "definition": "A sense of what is right and wrong.", "sentence": "His conscience told him to apologise.", "hint_sentence": "His _____ told him to apologise.", "level": 2, "audio_id": "68cb471850b81a53"}, {"word": "courteous", "definition": "Polite and considerate.", "sentence": "The host was courteous to every guest.", "hint_sentence": "The host was _____ to every guest.", "level": 2, "audio_id": "76c86f11afaea193"}, {"word": "persuade", "definition": "To convince someone to do or believe something.", "sentence": "She tried to persuade us to stay.", "hint_sentence": "She tried to _____ us to stay.", "level": 2, "audio_id": "c549be9d9dc84750"}, {"word": "necessary", "definition": "Needed for a purpose.", "sentence": "A ticket is necessary for entry.", "hint_sentence": "A ticket is _____ for entry.", "level": 2, "audio_id": "c07ef67cb86002db"}, {"word": "accommodate", "definition": "To make room for someone or something.", "sentence": "The hall can accommodate fifty guests.", "hint_sentence": "The hall can _____ fifty guests.", "level": 3, "audio_id": "718604d056198ed1"}, {"word": "entrepreneur", "definition": "A person who starts and runs a business.", "sentence": "The entrepreneur opened a bakery.", "hint_sentence": "The _____ opened a bakery.", "level": 3, "audio_id": "714de8a0c16e1cc8"}, {"word": "bureaucracy", "definition": "A system of administration with many rules and offices.", "sentence": "The paperwork took longer because of bureaucracy.", "hint_sentence": "The paperwork took longer because of _____.", "level": 3, "audio_id": "98cdbff287787997"}, {"word": "conscientious", "definition": "Careful to do things thoroughly and well.", "sentence": "She is a conscientious organiser.", "hint_sentence": "She is a _____ organiser.", "level": 3, "audio_id": "c9a11086431fb0c4"}, {"word": "resilience", "definition": "The ability to recover from difficulty.", "sentence": "Their resilience impressed the whole team.", "hint_sentence": "Their _____ impressed the whole team.", "level": 3, "audio_id": "2f83a6a1671f8cac"}, {"word": "onomatopoeia", "definition": "A word that imitates a sound.", "sentence": "Buzz is an example of onomatopoeia.", "hint_sentence": "Buzz is an example of _____.", "level": 3, "audio_id": "9807227326f30faf"}, {"word": "idiosyncrasy", "definition": "An unusual habit or feature of a person.", "sentence": "That little dance is his idiosyncrasy.", "hint_sentence": "That little dance is his _____.", "level": 3, "audio_id": "21bf2beb7a7e2fe2"}, {"word": "chrysanthemum", "definition": "A flowering plant with many narrow petals.", "sentence": "A yellow chrysanthemum grew by the gate.", "hint_sentence": "A yellow _____ grew by the gate.", "level": 3, "audio_id": "ef82b72b119ac570"}, {"word": "miscellaneous", "definition": "Made up of different kinds of things.", "sentence": "The box held miscellaneous supplies.", "hint_sentence": "The box held _____ supplies.", "level": 3, "audio_id": "8629f155e61bb326"}, {"word": "quintessential", "definition": "The most typical example of something.", "sentence": "That song is quintessential party music.", "hint_sentence": "That song is _____ party music.", "level": 3, "audio_id": "24ca445ba048bd4b"}, {"word": "indispensable", "definition": "So useful that it cannot be done without.", "sentence": "Her help was indispensable.", "hint_sentence": "Her help was _____.", "level": 3, "audio_id": "d1645528f9a92953"}, {"word": "fluorescent", "definition": "Giving off light after absorbing radiation.", "sentence": "The fluorescent sign glowed above the door.", "hint_sentence": "The _____ sign glowed above the door.", "level": 3, "audio_id": "28d3d97ee647ee30"}]'::jsonb) as item(word text,definition text,sentence text,hint_sentence text,level integer,audio_id text)
on conflict(word) do update set definition=excluded.definition,sentence=excluded.sentence,hint_sentence=excluded.hint_sentence,level=excluded.level,audio_id=excluded.audio_id;

create or replace function public.decked_start_spelling_game(p_room_id uuid,p_team_names jsonb,p_team_player_ids jsonb,p_seconds integer,p_rounds integer,p_levels jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare chosen jsonb; needed integer; allowed integer[];
begin
 if jsonb_typeof(p_team_names)<>'array' then raise exception 'Invalid teams.'; end if;
 if jsonb_typeof(p_levels)<>'array' or jsonb_array_length(p_levels) not between 1 and 3
    or exists(select 1 from jsonb_array_elements(p_levels) e where jsonb_typeof(e.value)<>'number' or (e.value#>>'{}') not in ('1','2','3'))
 then raise exception 'Choose at least one valid level.'; end if;
 select array_agg(distinct value::integer) into allowed from jsonb_array_elements_text(p_levels);
 needed:=jsonb_array_length(p_team_names)*p_rounds;
 if needed<2 or needed>36 then raise exception 'Invalid number of turns.'; end if;
 select coalesce(jsonb_agg(to_jsonb(chosen_word)), '[]'::jsonb) into chosen
 from (select word,definition,sentence,hint_sentence,level,audio_id,variants from public.decked_spelling_catalog
       where level=any(allowed) order by random() limit needed) as chosen_word;
 if jsonb_array_length(chosen)<>needed then raise exception 'Not enough words for the selected levels.'; end if;
 perform public.decked_start_spelling_game(p_room_id,chosen,p_team_names,p_team_player_ids,p_seconds,p_rounds);
end;$$;
revoke execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,jsonb,integer,integer) from authenticated;
revoke execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,integer,integer,jsonb) from public,anon;
grant execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,integer,integer,jsonb) to authenticated;

create or replace function public.decked_get_spelling_word(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare r public.decked_rooms; s jsonb; t integer; word jsonb;
begin
 if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
 select * into r from public.decked_rooms where id=p_room_id;
 if r.game_id<>'spelling-bee' then raise exception 'Wrong game.'; end if;
 s:=r.game_state->'session'; t:=coalesce((s->>'sp_turn')::integer,0);
 if s->>'sp_phase' in ('word','result','done') then
  select deck->t into word from public.decked_spelling_secrets where room_id=p_room_id;
 end if;
 if s->>'sp_phase' in ('result','done') then
  return jsonb_build_object('word',word,'audio_id',word->>'audio_id','definition',word->>'definition','hint_sentence',word->>'hint_sentence');
 end if;
 return jsonb_build_object('word',null,'audio_id',word->>'audio_id','definition',word->>'definition','hint_sentence',word->>'hint_sentence');
end;$$;

create or replace function public.decked_spelling_action(p_room_id uuid,p_action text,p_expected_turn integer)
returns void language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms; s jsonb; t integer; n integer; team integer; speller uuid; phase text; finished boolean:=false;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'spelling-bee' or r.status<>'playing' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room action.'; end if;
 s:=r.game_state->'session'; t:=(s->>'sp_turn')::integer; n:=(s->>'sp_team_count')::integer; team:=t%n; phase:=s->>'sp_phase';
 if t<>p_expected_turn then raise exception 'Turn moved forward; refresh.'; end if;
 speller:=(s->'sp_player_ids'->>(team*2+(t/n)%2))::uuid;
 if p_action='begin' then
  if phase<>'ready' or auth.uid()<>speller then raise exception 'Only the speller can begin.'; end if;
  s:=s||jsonb_build_object('sp_phase','word','sp_deadline',now()+make_interval(secs=>(s->>'sp_seconds')::integer));
 elsif p_action='timeout' then
  if phase<>'word' or (s->>'sp_deadline')::timestamptz>now() then raise exception 'Time has not run out.'; end if;
  s:=s||jsonb_build_object('sp_phase','result','sp_deadline',null,'sp_correct',false);
 elsif p_action='next' then
  if phase<>'result' or (auth.uid()<>speller and auth.uid()<>r.host_user_id) then raise exception 'Only the speller or host can continue.'; end if;
  if t+1>=n*(s->>'sp_rounds')::integer then s:=s||jsonb_build_object('step','done','sp_phase','done'); finished:=true;
  else s:=s||jsonb_build_object('sp_phase','ready','sp_turn',t+1,'cardIndex',t+1,'sp_correct',null); end if;
 else raise exception 'Unknown action.'; end if;
 update public.decked_rooms set status=case when finished then 'finished' else status end,game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
end;$$;

create or replace function public.decked_submit_spelling(p_room_id uuid,p_expected_turn integer,p_spelling text)
returns boolean language plpgsql security definer set search_path='' as $$
declare r public.decked_rooms; s jsonb; t integer; n integer; team integer; speller uuid; answer jsonb; correct boolean; scores jsonb;
begin
 select * into r from public.decked_rooms where id=p_room_id for update;
 if r.id is null or r.game_id<>'spelling-bee' or r.status<>'playing' or not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'Invalid room action.'; end if;
 s:=r.game_state->'session'; t:=(s->>'sp_turn')::integer; n:=(s->>'sp_team_count')::integer; team:=t%n;
 speller:=(s->'sp_player_ids'->>(team*2+(t/n)%2))::uuid;
 if t<>p_expected_turn or s->>'sp_phase'<>'word' or auth.uid()<>speller or (s->>'sp_deadline')::timestamptz<=now() then raise exception 'Only the active speller can submit before time runs out.'; end if;
 if p_spelling is null or char_length(btrim(p_spelling)) not between 1 and 40 then raise exception 'Enter a spelling.'; end if;
 select deck->t into answer from public.decked_spelling_secrets where room_id=p_room_id;
 correct:=lower(btrim(p_spelling))=lower(answer->>'word')
   or exists(select 1 from jsonb_array_elements_text(coalesce(answer->'variants','[]'::jsonb)) variant where lower(btrim(p_spelling))=lower(variant));
 if correct then scores:=jsonb_set(s->'sp_scores',array[team::text],to_jsonb((s->'sp_scores'->>team)::integer+1)); s:=jsonb_set(s,'{sp_scores}',scores); end if;
 s:=s||jsonb_build_object('sp_phase','result','sp_deadline',null,'sp_correct',correct);
 update public.decked_rooms set game_state=jsonb_set(game_state,'{session}',s,true),version=version+1 where id=p_room_id;
 return correct;
end;$$;
revoke execute on function public.decked_submit_spelling(uuid,integer,text) from public,anon;
grant execute on function public.decked_submit_spelling(uuid,integer,text) to authenticated;
