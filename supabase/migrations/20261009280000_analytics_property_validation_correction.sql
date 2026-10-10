-- Preserve the approved custom-card count while continuing to reject content-bearing keys.
-- This correction is separate because the preceding privacy migration may already be deployed.

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
    if not(property_key=any(allowed_keys))
       or property_key~*'^(display_?name|room_?code|prompt(_?text)?|question(_?text)?|answer(_?text)?|custom_?card(_?text)?|statement(_?text)?|truth(_?text)?|bluff(_?text)?|email|phone|.*token.*|password|secret|credential)$'
    then return false; end if;
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

revoke all on function public.decked_analytics_properties_are_safe(jsonb) from public,anon,authenticated;

comment on function public.decked_analytics_properties_are_safe(jsonb) is
  'Strict allowlist for content-free analytics dimensions. Aggregate custom_card_count is allowed; custom-card content remains forbidden.';
