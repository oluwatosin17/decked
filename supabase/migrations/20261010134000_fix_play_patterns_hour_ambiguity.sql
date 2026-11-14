-- Correct the already-deployed Play Patterns routine without changing its
-- signature, grants, staff authorization, filters, or privacy boundaries.
do $$
declare
  definition text;
  corrected text;
begin
  select pg_catalog.pg_get_functiondef(
    'public.decked_command_centre_play_patterns(text,date,date,text,text,text,text,text)'::regprocedure
  ) into definition;

  -- The preceding migration already contains this qualification in a fresh
  -- checkout. Keep replay safe while still correcting older deployed bodies.
  if position('weekday,hours.local_hour as "hour"' in definition)>0 then
    return;
  end if;

  corrected:=replace(definition,'weekday,local_hour as "hour"','weekday,hours.local_hour as "hour"');
  if corrected=definition then
    raise exception 'Play Patterns correction did not match the deployed function body.';
  end if;
  execute corrected;
end $$;
