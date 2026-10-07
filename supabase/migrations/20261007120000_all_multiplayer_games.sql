-- Keep Supabase room creation aligned with src/multiplayer/types.ts.
-- This supersedes the incremental allowlists from individual game migrations.
create or replace function public.decked_create_room(
  p_display_name text,
  p_game_id text default 'truth-or-dare'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_room public.decked_rooms;
  supported constant text[] := array[
    'truth-or-dare',
    'spicy-starters',
    'never-have-i-ever',
    'late-night-talks',
    'dinner-table',
    'icebreaker',
    'everyday-conversation',
    'reconnect',
    'red-flag-green-flag',
    'charades',
    'strangers',
    'finger-down',
    'take-a-sip',
    'sip-or-spill',
    'you-laugh',
    'do-or-drink',
    'two-truths-bluff',
    'most-likely-to',
    'choose-your-side',
    'who-said-that'
  ];
begin
  if uid is null then
    raise exception 'A player session is required.';
  end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then
    raise exception 'Enter a name between 1 and 24 characters.';
  end if;
  if not (p_game_id = any(supported)) then
    raise exception 'This game is not available for Play Together.';
  end if;

  insert into public.decked_rooms(code, host_user_id, game_id)
  values (public.decked_generate_room_code(), uid, p_game_id)
  returning * into new_room;

  insert into public.decked_room_players(room_id, user_id, display_name, color, position)
  values (new_room.id, uid, trim(p_display_name), '#dc2827', 0);

  return public.decked_room_payload(new_room.id);
end;
$$;

revoke execute on function public.decked_create_room(text, text) from public, anon;
grant execute on function public.decked_create_room(text, text) to authenticated;

