-- Whot was originally added to raw analytics facts but omitted from the
-- rebuildable aggregate allowlist. Keep the final reporting layer aligned,
-- then make repaired recent sessions visible immediately. The existing
-- five-minute cron keeps these aggregates current afterward.
alter table public.analytics_daily_aggregates
  drop constraint if exists analytics_daily_aggregates_game_id_check;
alter table public.analytics_daily_aggregates
  add constraint analytics_daily_aggregates_game_id_check check (game_id is null or game_id in (
    'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker',
    'everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip',
    'sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met','whot','imposter','mini-mystery'
  ));

select public.decked_refresh_analytics_aggregates(current_date - 2, current_date);
