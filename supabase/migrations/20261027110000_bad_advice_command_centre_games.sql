-- Allow every registered game in Command Centre detail filters.
create or replace function public.decked_validate_command_centre_filters(p_environment text,p_from date,p_to date,p_game_id text)
returns void language plpgsql stable set search_path='' as $$ begin
  if p_environment not in ('development','preview','production') or p_from is null or p_to is null or p_from>p_to or p_to-p_from>366 then raise exception 'Invalid Command Centre filters.' using errcode='22023'; end if;
  if p_game_id is not null and not (p_game_id = any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery','do-you-know-me','think-fast','not-me-your-honour','bad-advice-only'])) then raise exception 'Invalid game filter.' using errcode='22023'; end if;
end $$;
