-- Run with psql from app/ against disposable Postgres. Every change rolls back.
\set ON_ERROR_STOP on
begin;

-- Fresh checkout: the prior migration already uses the qualified column.
create or replace function public.decked_command_centre_play_patterns(
  p_environment text,p_from date,p_to date,p_game_id text default null,
  p_play_mode text default null,p_device_class text default null,
  p_country text default null,p_timezone text default null
) returns jsonb language plpgsql as $$
declare result jsonb; out_weekday text; out_hour integer;
begin
  select weekday,hours.local_hour as "hour" into out_weekday,out_hour
  from (values('Mon',1)) hours(weekday,local_hour);
  result:=jsonb_build_object('weekday',out_weekday,'hour',out_hour);
  return result;
end $$;
\i supabase/migrations/20261010134000_fix_play_patterns_hour_ambiguity.sql
do $$ begin
  if public.decked_command_centre_play_patterns(null,null,null,null,null,null,null,null)
     <> '{"weekday":"Mon","hour":1}'::jsonb then
    raise exception 'Already-corrected Play Patterns function changed';
  end if;
end $$;

-- Older deployed body: apply the one-time qualification, then replay it.
create or replace function public.decked_command_centre_play_patterns(
  p_environment text,p_from date,p_to date,p_game_id text default null,
  p_play_mode text default null,p_device_class text default null,
  p_country text default null,p_timezone text default null
) returns jsonb language plpgsql as $$
declare result jsonb; out_weekday text; out_hour integer;
begin
  select weekday,local_hour as "hour" into out_weekday,out_hour
  from (values('Mon',1)) hours(weekday,local_hour);
  result:=jsonb_build_object('weekday',out_weekday,'hour',out_hour);
  return result;
end $$;
\i supabase/migrations/20261010134000_fix_play_patterns_hour_ambiguity.sql
do $$
declare definition text;
begin
  select pg_get_functiondef(
    'public.decked_command_centre_play_patterns(text,date,date,text,text,text,text,text)'::regprocedure
  ) into definition;
  if position('weekday,hours.local_hour as "hour"' in definition)=0 then
    raise exception 'Old Play Patterns body was not corrected';
  end if;
end $$;
\i supabase/migrations/20261010134000_fix_play_patterns_hour_ambiguity.sql
rollback;
