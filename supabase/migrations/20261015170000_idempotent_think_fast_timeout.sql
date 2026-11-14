-- Recovered from the linked project's Supabase migration history.

-- Both the buzzer and the host may submit the timeout transition so a
-- backgrounded answerer cannot stall the room. Treat the duplicate as success.
create or replace function public.decked_think_fast_judge(p_room_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare g public.decked_think_fast_games;
begin
  select * into g from public.decked_think_fast_games where room_id=p_room_id for update;
  if g.phase='judging' then return; end if;
  if g.phase<>'answering' then raise exception 'This answer is not ready to judge.'; end if;
  if auth.uid()<>g.buzzer_user_id and not exists(select 1 from public.decked_rooms where id=p_room_id and host_user_id=auth.uid()) then raise exception 'Only the answerer or host can submit the answer.'; end if;
  update public.decked_think_fast_games set phase='judging',updated_at=now() where room_id=p_room_id;
  update public.decked_rooms set version=version+1 where id=p_room_id;
end;$$;

revoke execute on function public.decked_think_fast_judge(uuid) from public,anon;

grant execute on function public.decked_think_fast_judge(uuid) to authenticated;
