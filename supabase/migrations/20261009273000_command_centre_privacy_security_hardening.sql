-- Align database event validation with the typed client and add an audited,
-- dry-run-first analytics identity deletion procedure.

create or replace function public.decked_analytics_properties_are_safe(p_properties jsonb)
returns boolean language plpgsql immutable set search_path='' as $$
declare property_key text; property_value jsonb; array_value jsonb; string_value text;
  allowed_keys constant text[]:=array[
    'initial_screen_id','entry_path','is_pwa','device_class','utm_source','utm_medium','utm_campaign','utm_content','utm_term','referrer_domain',
    'screen_id','previous_screen_id','destination_screen_id','game_id','game_session_id','lifecycle_stage','category_id','previous_category_id',
    'visible_game_count','recommendation_set_id','recommended_game_ids','shuffle_number','selection_surface','browse_category_id','recommendation_position',
    'play_mode','initial_step','resumed','restored_step','option_type','option_ids','selected_count','requested_card_count','actual_card_count',
    'built_in_card_count','custom_card_count','category_ids','mode_ids','player_count','starting_step','configured_card_count','card_number',
    'content_source','from_card_number','to_card_number','advance_reason','completion_reason','cards_presented','cards_skipped','duration_seconds',
    'rounds_completed','completed_game_session_id','last_lifecycle_stage','last_step','multiplayer_room_ref','error_code','failure_stage',
    'room_player_count','is_rejoin','is_first_guest','failure_reason','room_status_at_exit','remaining_player_count','room_age_seconds',
    'request_count','previous_game_session_id','new_game_session_id','room_status','handoff_reason','offline_threshold_seconds','channel_type',
    'status','retry_count','rpc_name','failure_class','error_fingerprint','error_class','browser_name','browser_major_version','stack_fingerprint'
  ];
begin
  if p_properties is null or jsonb_typeof(p_properties)<>'object' or octet_length(p_properties::text)>16384
     or (select count(*) from pg_catalog.jsonb_object_keys(p_properties))>32 then return false; end if;
  for property_key,property_value in select key,value from pg_catalog.jsonb_each(p_properties) loop
    if not(property_key=any(allowed_keys)) or property_key~*'(display.?name|room.?code|prompt|question|answer|custom.?card|statement|truth|bluff|email|phone|token|password|secret)' then return false; end if;
    if jsonb_typeof(property_value) in ('object','null') then return false;
    elsif jsonb_typeof(property_value)='array' then
      if jsonb_array_length(property_value)>50 then return false; end if;
      for array_value in select value from jsonb_array_elements(property_value) loop
        if jsonb_typeof(array_value) not in ('string','number','boolean') then return false; end if;
        if jsonb_typeof(array_value)='string' then
          string_value:=array_value#>>'{}';
          if char_length(string_value)>128 or string_value!~'^[A-Za-z0-9][A-Za-z0-9._:/+-]{0,127}$' or string_value~'^[A-Z2-9]{6}$' or string_value~*'(bearer|password|secret|token)' then return false; end if;
        end if;
      end loop;
    elsif jsonb_typeof(property_value)='string' then
      string_value:=property_value#>>'{}';
      if char_length(string_value)>256 or string_value~'^[A-Z2-9]{6}$' or string_value~*'(bearer|password|secret|token)' then return false; end if;
      if property_key='entry_path' then
        if string_value!~'^/[A-Za-z0-9/_-]*$' then return false; end if;
      elsif property_key='referrer_domain' then
        if string_value!~*'^(?:[a-z0-9](?:[a-z0-9-]{0,62})\.)+[a-z]{2,63}$' then return false; end if;
      elsif string_value!~'^[A-Za-z0-9][A-Za-z0-9._:/+-]{0,255}$' then return false;
      end if;
    elsif jsonb_typeof(property_value) not in ('number','boolean') then return false;
    end if;
  end loop;
  return true;
end $$;

create function public.decked_validate_analytics_event_insert()
returns trigger language plpgsql set search_path='' as $$
begin
  if new.event_name<>all(array[
    'app_opened','screen_viewed','navigation_back_selected','browse_category_selected','quick_play_viewed','quick_play_shuffled','game_selected',
    'play_mode_selected','game_setup_started','game_setup_resumed','game_option_selected','deck_configured','player_setup_completed','game_started',
    'card_presented','card_revealed','card_advanced','game_completed','game_replay_selected','game_session_abandoned','room_create_attempted',
    'room_created','room_create_failed','room_join_attempted','room_joined','room_join_failed','multiplayer_setup_started','multiplayer_game_started',
    'player_left_room','room_ended','rematch_requested','rematch_started','host_handoff_completed','host_disconnected','multiplayer_game_completed',
    'realtime_status_changed','rpc_failed','frontend_error'
  ]) or not public.decked_analytics_properties_are_safe(new.properties) then
    raise exception 'Invalid analytics event.' using errcode='22023';
  end if;
  return new;
end $$;

create trigger analytics_events_validate_insert
before insert on public.analytics_events
for each row execute function public.decked_validate_analytics_event_insert();

create function public.decked_delete_analytics_identity(
  p_analytics_user_id uuid,p_dry_run boolean default true,p_request_id uuid default gen_random_uuid()
) returns jsonb language plpgsql security definer set search_path='' as $$
declare actor_role text; event_count bigint; game_session_count bigint; active_day_count bigint; first_seen_count bigint; health_count bigint;
  session_ids uuid[]; affected_from date; affected_to date;
begin
  if not public.decked_is_command_centre_staff('admin') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  if p_analytics_user_id is null then raise exception 'Analytics identity is required.' using errcode='22023'; end if;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid() and status='active';
  select count(*),array_remove(array_agg(distinct analytics_session_id),null),min((occurred_at at time zone 'UTC')::date),max((occurred_at at time zone 'UTC')::date)
    into event_count,session_ids,affected_from,affected_to from public.analytics_events where analytics_user_id=p_analytics_user_id;
  select count(*) into game_session_count from public.analytics_game_sessions where analytics_user_id=p_analytics_user_id;
  select count(*) into active_day_count from public.analytics_daily_active_users where analytics_user_id=p_analytics_user_id;
  select count(*) into first_seen_count from public.analytics_user_first_seen where analytics_user_id=p_analytics_user_id;
  select count(*) into health_count from public.analytics_daily_session_health where analytics_session_id=any(coalesce(session_ids,'{}'::uuid[]));
  if not p_dry_run then
    if exists(select 1 from public.command_centre_audit_log where request_id=p_request_id and action='analytics_identity_deleted') then
      return jsonb_build_object('status','already_completed','request_id',p_request_id);
    end if;
    delete from public.analytics_daily_session_health where analytics_session_id=any(coalesce(session_ids,'{}'::uuid[]));
    delete from public.analytics_daily_active_users where analytics_user_id=p_analytics_user_id;
    delete from public.analytics_user_first_seen where analytics_user_id=p_analytics_user_id;
    delete from public.analytics_game_sessions where analytics_user_id=p_analytics_user_id;
    delete from public.analytics_events where analytics_user_id=p_analytics_user_id;
    insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id)
    values(auth.uid(),actor_role,'analytics_identity_deleted','analytics_identity','identity-'||substr(md5(p_analytics_user_id::text),1,12),
      jsonb_build_object('events_deleted',event_count,'game_sessions_deleted',game_session_count,'active_days_deleted',active_day_count,'first_seen_deleted',first_seen_count,'session_health_deleted',health_count,'affected_from',affected_from,'affected_to',affected_to,'aggregate_rebuild_required',affected_from is not null),p_request_id);
  end if;
  return jsonb_build_object('status',case when p_dry_run then 'preview' else 'deleted' end,'events',event_count,'game_sessions',game_session_count,
    'active_days',active_day_count,'first_seen',first_seen_count,'session_health',health_count,'affected_from',affected_from,'affected_to',affected_to,
    'aggregate_rebuild_required',affected_from is not null);
end $$;

revoke all on function public.decked_validate_analytics_event_insert() from public,anon,authenticated;
revoke all on function public.decked_delete_analytics_identity(uuid,boolean,uuid) from public,anon;
grant execute on function public.decked_delete_analytics_identity(uuid,boolean,uuid) to authenticated;

comment on function public.decked_delete_analytics_identity(uuid,boolean,uuid) is
  'Admin-only, dry-run-first deletion of a browser analytics identity and directly linked session facts. Content-free aggregates require reconciliation/rebuild for the returned affected range.';
