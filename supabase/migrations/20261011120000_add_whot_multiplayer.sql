-- Add Whot to the Play Together room allowlist. Game moves use the existing
-- authenticated, room-member-only shared session RPC.
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
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks',
    'dinner-table','icebreaker','everyday-conversation','reconnect',
    'red-flag-green-flag','charades','strangers','finger-down','take-a-sip',
    'sip-or-spill','you-laugh','do-or-drink','two-truths-bluff',
    'most-likely-to','choose-your-side','who-said-that','we-just-met','whot'
  ];
begin
  if uid is null then raise exception 'A player session is required.'; end if;
  if char_length(trim(p_display_name)) not between 1 and 24 then
    raise exception 'Enter a name between 1 and 24 characters.';
  end if;
  if not (p_game_id = any(supported)) then
    raise exception 'This game is not available for Play Together.';
  end if;
  insert into public.decked_rooms(code, host_user_id, game_id)
  values (public.decked_generate_room_code(), uid, p_game_id)
  returning * into new_room;
  insert into public.decked_room_players(room_id,user_id,display_name,color,position)
  values(new_room.id,uid,trim(p_display_name),'#dc2827',0);
  return public.decked_room_payload(new_room.id);
end;
$$;

revoke execute on function public.decked_create_room(text, text) from public, anon;
grant execute on function public.decked_create_room(text, text) to authenticated;

-- Keep analytics allowlists aligned so room/game triggers accept Whot.
alter table public.analytics_events drop constraint if exists analytics_events_game_id_check;
alter table public.analytics_events add constraint analytics_events_game_id_check check (game_id is null or game_id in (
  'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker',
  'everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip',
  'sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot'
));
alter table public.analytics_game_sessions drop constraint if exists analytics_game_sessions_game_id_check;
alter table public.analytics_game_sessions add constraint analytics_game_sessions_game_id_check check (game_id in (
  'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker',
  'everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip',
  'sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot'
));
alter table public.analytics_room_facts drop constraint if exists analytics_room_facts_game_id_check;
alter table public.analytics_room_facts add constraint analytics_room_facts_game_id_check check (game_id in (
  'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker',
  'everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip',
  'sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot'
));
