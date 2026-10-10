-- Protected Command Centre access and the first bounded read model.

create function public.decked_is_command_centre_staff(p_required_role text default 'viewer')
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null
    and exists (select 1 from auth.users where id = auth.uid() and not coalesce(is_anonymous, false))
    and exists (
      select 1 from public.command_centre_staff staff
      where staff.user_id = auth.uid() and staff.status = 'active'
        and (p_required_role = 'viewer' or staff.role = 'admin')
    );
$$;

create function public.decked_get_command_centre_access()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare staff_role text;
begin
  if auth.uid() is null or not exists (
    select 1 from auth.users where id = auth.uid() and not coalesce(is_anonymous, false)
  ) then
    return jsonb_build_object('authorized', false, 'reason', 'staff_session_required');
  end if;
  select role into staff_role from public.command_centre_staff
  where user_id = auth.uid() and status = 'active';
  if staff_role is null then
    return jsonb_build_object('authorized', false, 'reason', 'staff_access_required');
  end if;
  insert into public.command_centre_audit_log(actor_user_id, actor_role, action)
  values (auth.uid(), staff_role, 'command_centre_accessed');
  return jsonb_build_object('authorized', true, 'role', staff_role);
end;
$$;

create function public.decked_get_command_centre_overview(
  p_environment text,
  p_from date,
  p_to date,
  p_game_id text default null
) returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then
    raise exception 'Command Centre staff access is required.' using errcode = '42501';
  end if;
  if p_environment not in ('development', 'preview', 'production')
     or p_from is null or p_to is null or p_from > p_to or p_to - p_from > 366 then
    raise exception 'Invalid Command Centre filters.' using errcode = '22023';
  end if;
  if p_game_id is not null and not (p_game_id = any(array[
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table',
    'icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades',
    'strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink',
    'two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met'
  ]::text[])) then raise exception 'Invalid game filter.' using errcode = '22023'; end if;

  select jsonb_build_object(
    'kpis', jsonb_build_object(
      'game_sessions', count(*),
      'completed_sessions', count(*) filter (where status = 'completed'),
      'completion_rate', case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where status = 'completed') / count(*), 1) end,
      'multiplayer_sessions', count(*) filter (where play_mode = 'play_together')
    ),
    'games', coalesce((
      select jsonb_agg(to_jsonb(game_row) order by game_row.sessions desc, game_row.game_id)
      from (
        select game_id, count(*) as sessions,
          count(*) filter (where status = 'completed') as completed,
          case when count(*) = 0 then 0 else round(100.0 * count(*) filter (where status = 'completed') / count(*), 1) end as completion_rate
        from public.analytics_game_sessions
        where environment = p_environment
          and setup_started_at >= p_from::timestamptz and setup_started_at < (p_to + 1)::timestamptz
          and (p_game_id is null or game_id = p_game_id)
        group by game_id
      ) game_row
    ), '[]'::jsonb)
  ) into result
  from public.analytics_game_sessions
  where environment = p_environment
    and setup_started_at >= p_from::timestamptz and setup_started_at < (p_to + 1)::timestamptz
    and (p_game_id is null or game_id = p_game_id);
  return result;
end;
$$;

revoke all on function public.decked_is_command_centre_staff(text) from public, anon;
revoke all on function public.decked_get_command_centre_access() from public, anon;
revoke all on function public.decked_get_command_centre_overview(text, date, date, text) from public, anon;
grant execute on function public.decked_is_command_centre_staff(text) to authenticated;
grant execute on function public.decked_get_command_centre_access() to authenticated;
grant execute on function public.decked_get_command_centre_overview(text, date, date, text) to authenticated;

comment on function public.decked_get_command_centre_overview(text, date, date, text) is
  'Staff-only, bounded dashboard read model. Returns aggregate facts and never raw events or user identifiers.';
