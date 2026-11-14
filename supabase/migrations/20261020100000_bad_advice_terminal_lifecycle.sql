-- Recovered from the linked project's Supabase migration history.

-- Keep Bad Advice Only terminal state stable until the host explicitly starts
-- a secure replay. Private submissions remain in the protected epoch tables.

create or replace function public.decked_set_session_value(p_room_id uuid, p_key text, p_value jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms; current_session jsonb;
begin
  if char_length(p_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
  target := public.decked_assert_secure_room(p_room_id);
  if target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  current_session := case when jsonb_typeof(target.game_state->'session')='object' then target.game_state->'session' else '{}'::jsonb end;
  if target.game_id='bad-advice-only' then
    if target.host_user_id<>auth.uid() then
      raise exception 'Only the host can change Bad Advice lifecycle state.' using errcode='42501';
    end if;
    if coalesce(current_session->>'step','')='done'
       and current_session->p_key is distinct from coalesce(p_value,'null'::jsonb) then
      raise exception 'Completed Bad Advice games must use the replay RPC.' using errcode='55000';
    end if;
  end if;
  if not public.decked_secure_session_value_allowed(target,p_key,p_value) then raise exception 'Private game data must use the protected-state RPC.'; end if;
  if not public.decked_session_write_allowed(target,p_key,auth.uid()) then raise exception 'You cannot change this game state.'; end if;
  update public.decked_rooms set
    game_state=jsonb_set(jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',current_session,true),array['session',p_key],coalesce(p_value,'null'::jsonb),true),
    version=version+1
  where id=p_room_id;
end;
$$;

create or replace function public.decked_set_session_values(p_room_id uuid, p_values jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare target public.decked_rooms; current_session jsonb; session_key text; session_key_count integer;
begin
  if jsonb_typeof(p_values)<>'object' then raise exception 'Invalid state update.'; end if;
  select count(*) into session_key_count from jsonb_object_keys(p_values);
  if session_key_count=0 or session_key_count>32 then raise exception 'Invalid state update.'; end if;
  target := public.decked_assert_secure_room(p_room_id);
  if target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  current_session := case when jsonb_typeof(target.game_state->'session')='object' then target.game_state->'session' else '{}'::jsonb end;
  if target.game_id='bad-advice-only' then
    if target.host_user_id<>auth.uid() then
      raise exception 'Only the host can change Bad Advice lifecycle state.' using errcode='42501';
    end if;
    if coalesce(current_session->>'step','')='done' and not current_session @> p_values then
      raise exception 'Completed Bad Advice games must use the replay RPC.' using errcode='55000';
    end if;
  end if;
  for session_key in select jsonb_object_keys(p_values) loop
    if char_length(session_key) not between 1 and 128 then raise exception 'Invalid state key.'; end if;
    if not public.decked_secure_session_value_allowed(target,session_key,p_values->session_key) then raise exception 'Private game data must use the protected-state RPC.'; end if;
    if not public.decked_session_write_allowed(target,session_key,auth.uid()) then raise exception 'You cannot change this game state.'; end if;
  end loop;
  update public.decked_rooms set
    game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',current_session||p_values,true),
    version=version+1
  where id=p_room_id;
end;
$$;

create or replace function public.decked_restart_bad_advice(p_room_id uuid,p_values jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; current_session jsonb; updated public.decked_rooms; supplied_keys text[];
begin
  select * into target from public.decked_rooms where id=p_room_id for update;
  if target.id is null or target.status not in ('lobby','playing') then raise exception 'This room is not active.'; end if;
  if not public.decked_is_room_member(target.id,auth.uid()) then raise exception 'You are not in this room.' using errcode='42501'; end if;
  if target.multiplayer_schema_version<2 then raise exception 'This room uses an older multiplayer version.'; end if;
  if target.game_id<>'bad-advice-only' then raise exception 'Wrong game.'; end if;
  if target.host_user_id<>auth.uid() then raise exception 'Only the host can replay Bad Advice.' using errcode='42501'; end if;
  current_session := case when jsonb_typeof(target.game_state->'session')='object' then target.game_state->'session' else '{}'::jsonb end;
  if coalesce(current_session->>'step','')<>'done' then raise exception 'Bad Advice is not complete.' using errcode='55000'; end if;
  if jsonb_typeof(p_values)<>'object' then raise exception 'Invalid replay state.'; end if;
  select array_agg(key order by key) into supplied_keys from jsonb_object_keys(p_values) key;
  if supplied_keys<>array['answers','baoSessionId','deck','recentCards','round','roundCount','scores','step','winnerId','writerIndex']::text[] then
    raise exception 'Invalid replay state keys.';
  end if;
  if (p_values->>'step') is distinct from 'answer'
     or coalesce((p_values->>'round')::integer,-1)<>0
     or coalesce((p_values->>'writerIndex')::integer,-1)<>0
     or (p_values->'answers') is distinct from '{}'::jsonb
     or (p_values->'scores') is distinct from '{}'::jsonb
     or (p_values->>'winnerId') is distinct from ''
  then raise exception 'Invalid replay state.'; end if;
  if jsonb_typeof(p_values->'deck')<>'array' or jsonb_typeof(p_values->'recentCards')<>'array'
     or coalesce((p_values->>'roundCount')::integer,0)<3
     or jsonb_array_length(p_values->'deck')<>(p_values->>'roundCount')::integer
     or jsonb_array_length(p_values->'recentCards')<>(p_values->>'roundCount')::integer
     or nullif(p_values->>'baoSessionId','') is null then raise exception 'Invalid replay configuration.'; end if;
  update public.decked_rooms set
    private_state_epoch=private_state_epoch+1,
    rematch_requests='{}'::uuid[],
    game_state=jsonb_set(coalesce(game_state,'{}'::jsonb),'{session}',current_session||p_values,true),
    version=version+1
  where id=target.id returning * into updated;
  return jsonb_build_object('epoch',updated.private_state_epoch,'version',updated.version);
end;
$$;

revoke execute on function public.decked_set_session_value(uuid,text,jsonb) from public,anon;
revoke execute on function public.decked_set_session_values(uuid,jsonb) from public,anon;
revoke all on function public.decked_restart_bad_advice(uuid,jsonb) from public,anon;
grant execute on function public.decked_set_session_value(uuid,text,jsonb) to authenticated;
grant execute on function public.decked_set_session_values(uuid,jsonb) to authenticated;
grant execute on function public.decked_restart_bad_advice(uuid,jsonb) to authenticated;
