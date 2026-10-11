-- Keep report exports idempotent and allow the complete canonical game catalogue.
-- PostgreSQL permits multiple NULL values in a UNIQUE constraint, so a regular
-- constraint preserves the original request-id semantics while giving
-- ON CONFLICT (request_id) a valid conflict arbiter.

drop index if exists public.command_centre_audit_log_request_idx;

alter table public.command_centre_audit_log
  drop constraint if exists command_centre_audit_log_request_id_key;

alter table public.command_centre_audit_log
  add constraint command_centre_audit_log_request_id_key unique (request_id);

do $$
declare
  function_name regprocedure;
  function_definition text;
  updated_definition text;
begin
  foreach function_name in array array[
    'public.decked_export_command_centre_csv(text,text,date,date,text,text,text,text,text,text,text[],uuid)'::regprocedure,
    'public.decked_export_command_centre_games_csv(text,date,date,text,integer,text[],uuid)'::regprocedure
  ]
  loop
    function_definition := pg_get_functiondef(function_name);

    if position('''whot''' in function_definition) = 0 then
      updated_definition := replace(
        function_definition,
        '''we-just-met''',
        '''we-just-met'',''whot'''
      );

      if updated_definition = function_definition then
        raise exception 'Could not add Whot to the visible-game allowlist for %', function_name;
      end if;

      execute updated_definition;
    end if;
  end loop;
end
$$;

do $$
declare
  function_name regprocedure;
begin
  foreach function_name in array array[
    'public.decked_export_command_centre_csv(text,text,date,date,text,text,text,text,text,text,text[],uuid)'::regprocedure,
    'public.decked_export_command_centre_games_csv(text,date,date,text,integer,text[],uuid)'::regprocedure
  ]
  loop
    if position('''whot''' in pg_get_functiondef(function_name)) = 0 then
      raise exception 'Whot is missing from the export allowlist for %', function_name;
    end if;
  end loop;
end
$$;
