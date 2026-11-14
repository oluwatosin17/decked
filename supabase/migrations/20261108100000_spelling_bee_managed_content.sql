-- Connect Spelling Bee to existing Command Centre categories and published releases.
-- Candidate imports remain drafts. Publishing requires editorial approval and audio.
insert into public.content_categories(game_id,category_id,label,target_count,sort_order)
values ('spelling-bee','level-1','Easy',300,0),
       ('spelling-bee','level-2','Medium',300,1),
       ('spelling-bee','level-3','Hard',300,2)
on conflict(game_id,category_id) do update set label=excluded.label,target_count=excluded.target_count,sort_order=excluded.sort_order;

create or replace function public.decked_check_spelling_content_publish()
returns trigger language plpgsql security definer set search_path='' as $$
declare v public.content_item_versions%rowtype; category_count integer; matching_category_count integer;
begin
  if new.game_id<>'spelling-bee' or new.published_version is null or new.published_version is not distinct from old.published_version then return new; end if;
  select * into v from public.content_item_versions where item_id=new.id and version=new.published_version;
  if v.item_id is null or new.item_kind<>'prompt' or v.body !~ '^[A-Za-z-]{3,32}$'
     or jsonb_typeof(v.metadata->'level') is distinct from 'number' or (v.metadata->>'level') not in ('1','2','3')
     or char_length(btrim(coalesce(v.metadata->>'definition',''))) not between 8 and 200
     or char_length(btrim(coalesce(v.metadata->>'sentence',''))) not between 8 and 200
     or v.metadata->>'review_status' is distinct from 'approved'
     or jsonb_typeof(v.metadata->'variants') is distinct from 'array'
     or exists(select 1 from jsonb_array_elements(v.metadata->'variants') variant where jsonb_typeof(variant.value)<>'string' or variant.value#>>'{}' !~ '^[A-Za-z-]{3,32}$')
  then raise exception 'Spelling Bee content needs valid fields and editorial approval before publishing.' using errcode='22023'; end if;
  if v.metadata->>'definition' ~* ('\m'||v.body||'\M') or v.metadata->>'sentence' !~* ('\m'||v.body||'\M') then raise exception 'Spelling Bee clues reveal or omit the answer.' using errcode='22023'; end if;
  select count(*),count(*) filter(where category_id='level-'||(v.metadata->>'level')) into category_count,matching_category_count from public.content_item_categories where item_id=new.id and enabled;
  if category_count<>1 or matching_category_count<>1 then raise exception 'Spelling Bee category must match the word level.' using errcode='22023'; end if;
  if not exists(select 1 from public.decked_spelling_catalog c where lower(c.word)=lower(v.body) and c.audio_id ~ '^[0-9a-f]{16}$') then raise exception 'Spelling Bee pronunciation audio is required before publishing.' using errcode='22023'; end if;
  return new;
end;$$;

drop trigger if exists decked_check_spelling_content_publish on public.content_items;
create trigger decked_check_spelling_content_publish before update of published_version on public.content_items
for each row execute function public.decked_check_spelling_content_publish();

-- The host selects levels, but the server owns the actual words and balances each
-- complete round. A published release is used only when it can supply all rounds;
-- otherwise the existing audio-backed catalog remains the fallback.
create or replace function public.decked_start_spelling_game(p_room_id uuid,p_team_names jsonb,p_team_player_ids jsonb,p_seconds integer,p_rounds integer,p_levels jsonb)
returns void language plpgsql security definer set search_path='' as $$
declare
  teams integer; needed integer; allowed integer[]; level_order integer[]; level_index integer:=1;
  active_release_id uuid; release_item_count integer; pool jsonb; release_pool jsonb; selected_level integer; available integer;
  chosen jsonb:='[]'::jsonb; selected_round jsonb; used_words text[]:='{}'::text[]; round_index integer; candidate integer;
begin
  if jsonb_typeof(p_team_names) is distinct from 'array' or jsonb_typeof(p_levels) is distinct from 'array' or jsonb_array_length(p_levels) not between 1 and 3
     or exists(select 1 from jsonb_array_elements(p_levels) level_value where jsonb_typeof(level_value.value)<>'number' or (level_value.value#>>'{}') not in ('1','2','3'))
  then raise exception 'Choose valid teams and levels.' using errcode='22023'; end if;
  teams:=jsonb_array_length(p_team_names);
  needed:=teams*p_rounds;
  if teams is null or teams not between 2 and 4 or p_rounds is null or p_rounds not between 1 and 30 or needed>36 then raise exception 'Invalid number of turns.' using errcode='22023'; end if;
  select array_agg(value::integer order by value::integer) into allowed from (select distinct value from jsonb_array_elements_text(p_levels)) selected;
  select array_agg(level order by random()) into level_order from unnest(allowed) level;
  select id into active_release_id from public.content_releases where game_id='spelling-bee' and status='published' order by published_at desc limit 1;
  if active_release_id is not null then
    select count(*) into release_item_count from public.content_release_items where release_id=active_release_id;
    select coalesce(jsonb_agg(jsonb_build_object('word',c.word,'definition',v.metadata->>'definition','sentence',v.metadata->>'sentence',
      'hint_sentence',regexp_replace(v.metadata->>'sentence','\m'||c.word||'\M','_____','gi'),
      'level',(v.metadata->>'level')::integer,'variants',v.metadata->'variants','audio_id',c.audio_id)),'[]'::jsonb)
    into release_pool
    from public.content_release_items ri
    join public.content_item_versions v on v.item_id=ri.item_id and v.version=ri.version
    join public.decked_spelling_catalog c on lower(c.word)=lower(v.body)
    where ri.release_id=active_release_id and v.metadata->>'review_status'='approved'
      and v.metadata->>'level' in ('1','2','3')
      and cardinality(ri.category_ids)=1 and ri.category_ids[1]='level-'||(v.metadata->>'level')
      and c.audio_id ~ '^[0-9a-f]{16}$';
    -- Reject the entire managed release if even one published entry was omitted.
    -- Every level must support the maximum four-team setup.
    if release_item_count>0 and jsonb_array_length(release_pool)=release_item_count
      and (select count(distinct lower(entry->>'word')) from jsonb_array_elements(release_pool) entry)=release_item_count
      and not exists(select 1 from generate_series(1,3) level where
        (select count(*) from jsonb_array_elements(release_pool) entry where (entry->>'level')::integer=level)<4)
      and (select coalesce(sum(level_count/teams),0) from (
        select count(*) as level_count from jsonb_array_elements(release_pool) entry
        where (entry->>'level')::integer=any(allowed) group by entry->>'level'
      ) grouped)>=p_rounds
    then pool:=release_pool; end if;
  end if;
  if pool is null then
    select coalesce(jsonb_agg(to_jsonb(c)),'[]'::jsonb) into pool from public.decked_spelling_catalog c where c.level=any(allowed);
  end if;
  if (select coalesce(sum(level_count/teams),0) from (
    select count(*) as level_count from jsonb_array_elements(pool) entry group by entry->>'level'
  ) grouped)<p_rounds then raise exception 'Not enough words for equal team rounds.' using errcode='22023'; end if;
  for round_index in 1..p_rounds loop
    selected_level:=null;
    for candidate in 1..array_length(level_order,1) loop
      select count(*) into available from jsonb_array_elements(pool) entry
      where (entry->>'level')::integer=level_order[level_index] and not (entry->>'word'=any(used_words));
      if available>=teams then selected_level:=level_order[level_index]; exit; end if;
      level_index:=level_index%array_length(level_order,1)+1;
    end loop;
    if selected_level is null then raise exception 'Insufficient words for a fair round.' using errcode='22023'; end if;
    select jsonb_agg(entry.value) into selected_round from (
      select value from jsonb_array_elements(pool) where (value->>'level')::integer=selected_level
      and not (value->>'word'=any(used_words)) order by random() limit teams
    ) entry;
    chosen:=chosen||selected_round;
    used_words:=used_words||array(select value->>'word' from jsonb_array_elements(selected_round));
    level_index:=level_index%array_length(level_order,1)+1;
  end loop;
  if jsonb_array_length(chosen)<>needed then raise exception 'Could not select all words.' using errcode='22023'; end if;
  perform public.decked_start_spelling_game(p_room_id,chosen,p_team_names,p_team_player_ids,p_seconds,p_rounds);
end;$$;

revoke execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,integer,integer,jsonb) from public,anon;
grant execute on function public.decked_start_spelling_game(uuid,jsonb,jsonb,integer,integer,jsonb) to authenticated;

-- Before result reveal, only the active speller receives audio and written clues.
create or replace function public.decked_get_spelling_word(p_room_id uuid)
returns jsonb language plpgsql security definer set search_path='' stable as $$
declare r public.decked_rooms; s jsonb; t integer; n integer; team integer; speller uuid; word jsonb;
begin
  if not public.decked_is_room_member(p_room_id,auth.uid()) then raise exception 'You are not in this room.'; end if;
  select * into r from public.decked_rooms where id=p_room_id;
  if r.game_id<>'spelling-bee' then raise exception 'Wrong game.'; end if;
  s:=coalesce(r.game_state->'session','{}'::jsonb);
  t:=coalesce((s->>'sp_turn')::integer,0);
  n:=coalesce((s->>'sp_team_count')::integer,2);
  team:=t%n;
  speller:=(s->'sp_player_ids'->>(team*2+(t/n)%2))::uuid;
  if s->>'sp_phase' in ('word','result','done') then
    select deck->t into word from public.decked_spelling_secrets where room_id=p_room_id;
  end if;
  if s->>'sp_phase' in ('result','done') then
    return jsonb_build_object('word',word,'audio_id',word->>'audio_id','definition',word->>'definition','hint_sentence',word->>'hint_sentence');
  end if;
  if s->>'sp_phase'='word' and auth.uid()=speller then
    return jsonb_build_object('word',null,'audio_id',word->>'audio_id','definition',word->>'definition','hint_sentence',word->>'hint_sentence');
  end if;
  return jsonb_build_object('word',null,'audio_id',null,'definition',null,'hint_sentence',null);
end;$$;

revoke execute on function public.decked_get_spelling_word(uuid) from public,anon;
grant execute on function public.decked_get_spelling_word(uuid) to authenticated;
