-- Recovered from the linked project's Supabase migration history.

-- Restore the intended authenticated-only entry point for frictionless
-- anonymous multiplayer sessions. Supabase anonymous users receive the
-- authenticated database role after automatic background sign-in.
begin;

do $$
begin
  if to_regprocedure('public.decked_create_room(text,text)') is null then
    raise exception 'Expected function public.decked_create_room(text,text) does not exist';
  end if;
end;
$$;

revoke execute
  on function public.decked_create_room(text,text)
  from public, anon;

grant execute
  on function public.decked_create_room(text,text)
  to authenticated;

do $$
begin
  if not has_function_privilege(
    'authenticated',
    'public.decked_create_room(text,text)',
    'EXECUTE'
  ) then
    raise exception 'authenticated EXECUTE grant was not applied';
  end if;

  if has_function_privilege(
    'anon',
    'public.decked_create_room(text,text)',
    'EXECUTE'
  ) then
    raise exception 'anon must not be able to execute decked_create_room';
  end if;
end;
$$;

commit;

notify pgrst, 'reload schema';
