-- Trusted CSV exports and append-only staff accountability.

create function public.decked_csv_cell(p_value text)
returns text language sql immutable set search_path='' as $$
  select '"'||replace(case when coalesce(p_value,'') ~ '^[=+@\t\r]' or coalesce(p_value,'') ~ '^-[^0-9]' then ''''||coalesce(p_value,'') else coalesce(p_value,'') end,'"','""')||'"';
$$;

create function public.decked_export_command_centre_csv(
  p_report text,p_environment text,p_from date,p_to date,p_game_id text default null,p_play_mode text default null,
  p_device_class text default null,p_acquisition_source text default null,p_browser text default null,p_app_version text default null,
  p_visible_game_ids text[] default null,p_request_id uuid default gen_random_uuid()
) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare payload jsonb; row_data jsonb; csv text; header text; generated timestamptz:=clock_timestamp(); freshness text; row_count integer:=0; actor_role text;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,p_game_id);
  if p_report not in ('overview','games','funnels','multiplayer','reliability') then raise exception 'Invalid export report.' using errcode='22023'; end if;
  if p_visible_game_ids is not null and exists(select 1 from unnest(p_visible_game_ids) id where id is null or not (id=any(array['truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met']))) then raise exception 'Invalid visible game IDs.' using errcode='22023'; end if;

  if p_report='overview' then payload:=public.decked_command_centre_overview_v2(p_environment,p_from,p_to,p_game_id,p_play_mode);
    header:='generated_at,data_freshness,environment,date_from,date_to,game_id,starts,completions,completion_rate'; freshness:=payload->>'refreshed_at'; csv:=header;
    for row_data in select value from jsonb_array_elements(payload->'top_games') loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(generated::text),public.decked_csv_cell(freshness),public.decked_csv_cell(p_environment),public.decked_csv_cell(p_from::text),public.decked_csv_cell(p_to::text),public.decked_csv_cell(row_data->>'game_id'),public.decked_csv_cell(row_data->>'starts'),public.decked_csv_cell(row_data->>'completions'),public.decked_csv_cell(row_data->>'completion_rate')],',');end loop;
  elsif p_report='games' then payload:=public.decked_command_centre_games_v2(p_environment,p_from,p_to,p_play_mode,7);
    header:='generated_at,data_freshness,environment,date_from,date_to,game_id,game_views,selections,pass_and_play_starts,multiplayer_starts,unique_players,first_card_rate,completion_rate,median_cards_played,median_duration_seconds,replay_rate,trend_percent'; freshness:=payload->>'refreshed_at';csv:=header;
    for row_data in select item.value from jsonb_array_elements(payload->'rows') item(value) left join unnest(p_visible_game_ids) with ordinality visible(game_id,position) on visible.game_id=item.value->>'game_id' where p_visible_game_ids is null or visible.game_id is not null order by case when p_visible_game_ids is null then 0 else visible.position end,item.value->>'game_id' loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(generated::text),public.decked_csv_cell(freshness),public.decked_csv_cell(p_environment),public.decked_csv_cell(p_from::text),public.decked_csv_cell(p_to::text),public.decked_csv_cell(row_data->>'game_id'),public.decked_csv_cell(row_data->>'game_views'),public.decked_csv_cell(row_data->>'selections'),public.decked_csv_cell(row_data->>'pass_and_play_starts'),public.decked_csv_cell(row_data->>'multiplayer_starts'),public.decked_csv_cell(row_data->>'unique_players'),public.decked_csv_cell(row_data->>'first_card_rate'),public.decked_csv_cell(row_data->>'completion_rate'),public.decked_csv_cell(row_data->>'median_cards_played'),public.decked_csv_cell(row_data->>'median_duration_seconds'),public.decked_csv_cell(row_data->>'replay_rate'),public.decked_csv_cell(row_data->>'trend_percent')],',');end loop;
  elsif p_report='funnels' then payload:=public.decked_command_centre_funnels_v2(p_environment,p_from,p_to,p_game_id,p_play_mode,p_device_class,null,p_acquisition_source,p_app_version);
    header:='generated_at,data_freshness,environment,date_from,date_to,funnel_id,funnel_name,step_order,step_name,entrants,conversion_from_previous,conversion_from_first,median_seconds_from_previous';freshness:=payload->>'refreshed_at';csv:=header;
    for row_data in select jsonb_build_object('funnel_id',funnel->>'funnel_id','funnel_name',funnel->>'name')||step from jsonb_array_elements(payload->'funnels') funnel cross join lateral jsonb_array_elements(funnel->'steps') step loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(generated::text),public.decked_csv_cell(freshness),public.decked_csv_cell(p_environment),public.decked_csv_cell(p_from::text),public.decked_csv_cell(p_to::text),public.decked_csv_cell(row_data->>'funnel_id'),public.decked_csv_cell(row_data->>'funnel_name'),public.decked_csv_cell(row_data->>'step_order'),public.decked_csv_cell(row_data->>'step_name'),public.decked_csv_cell(row_data->>'entrants'),public.decked_csv_cell(row_data->>'conversion_from_previous'),public.decked_csv_cell(row_data->>'conversion_from_first'),public.decked_csv_cell(row_data->>'median_seconds_from_previous')],',');end loop;
  elsif p_report='multiplayer' then payload:=public.decked_command_centre_multiplayer_v2(p_environment,p_from,p_to,p_game_id);
    header:='generated_at,data_freshness,environment,date_from,date_to,record_type,label,metric_date,value_1,value_2,value_3';freshness:=payload->>'refreshed_at';csv:=header;
    for row_data in select jsonb_build_object('record_type','join_failure','label',value->>'reason','value_1',value->>'occurrences') from jsonb_array_elements(payload->'join_failures') union all select jsonb_build_object('record_type','room_size','label',value->>'room_size','value_1',value->>'rooms') from jsonb_array_elements(payload->'room_sizes') union all select jsonb_build_object('record_type','daily_trend','metric_date',value->>'metric_date','value_1',value->>'rooms_created','value_2',value->>'rooms_started','value_3',value->>'games_completed') from jsonb_array_elements(payload->'trend') loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(generated::text),public.decked_csv_cell(freshness),public.decked_csv_cell(p_environment),public.decked_csv_cell(p_from::text),public.decked_csv_cell(p_to::text),public.decked_csv_cell(row_data->>'record_type'),public.decked_csv_cell(row_data->>'label'),public.decked_csv_cell(row_data->>'metric_date'),public.decked_csv_cell(row_data->>'value_1'),public.decked_csv_cell(row_data->>'value_2'),public.decked_csv_cell(row_data->>'value_3')],',');end loop;
  else payload:=public.decked_command_centre_reliability_v2(p_environment,p_from,p_to,p_game_id,p_device_class,p_browser,p_app_version);
    header:='generated_at,data_freshness,environment,date_from,date_to,error_type,fingerprint,error_class,occurrences,affected_sessions,first_seen,last_seen';freshness:=payload->>'refreshed_at';csv:=header;
    for row_data in select value from jsonb_array_elements(payload->'groups') loop row_count:=row_count+1;csv:=csv||E'\n'||array_to_string(array[public.decked_csv_cell(generated::text),public.decked_csv_cell(freshness),public.decked_csv_cell(p_environment),public.decked_csv_cell(p_from::text),public.decked_csv_cell(p_to::text),public.decked_csv_cell(row_data->>'error_type'),public.decked_csv_cell(row_data->>'fingerprint'),public.decked_csv_cell(row_data->>'error_class'),public.decked_csv_cell(row_data->>'occurrences'),public.decked_csv_cell(row_data->>'affected_sessions'),public.decked_csv_cell(row_data->>'first_seen'),public.decked_csv_cell(row_data->>'last_seen')],',');end loop;
  end if;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid() and status='active';
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id) values(auth.uid(),actor_role,'report_exported','analytics_report',p_report,jsonb_build_object('report',p_report,'environment',p_environment,'from',p_from,'to',p_to,'game_id',p_game_id,'play_mode',p_play_mode,'device_class',p_device_class,'row_count',row_count),p_request_id) on conflict(request_id) do nothing;
  return jsonb_build_object('filename','decked-'||p_report||'-'||p_from||'-'||p_to||'.csv','csv',csv,'row_count',row_count,'generated_at',generated,'refreshed_at',freshness);
end $$;

create function public.decked_command_centre_audit_log(p_from date,p_to date,p_action text default null)
returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
  if not public.decked_is_command_centre_staff('admin') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  if p_from is null or p_to is null or p_from>p_to or p_to-p_from>366 then raise exception 'Invalid audit range.' using errcode='22023'; end if;
  return jsonb_build_object('rows',coalesce((select jsonb_agg(jsonb_build_object('occurred_at',occurred_at,'actor','staff-'||substr(md5(actor_user_id::text),1,10),'actor_role',actor_role,'action',action,'target_type',target_type,'metadata_summary',concat_ws(' · ',properties->>'report',properties->>'environment',(properties->>'from')||' → '||(properties->>'to'),case when properties ? 'row_count' then (properties->>'row_count')||' rows' end)) order by occurred_at desc) from (select * from public.command_centre_audit_log where occurred_at>=p_from::timestamptz and occurred_at<(p_to+1)::timestamptz and (p_action is null or action=p_action) order by occurred_at desc limit 500) audit_rows),'[]'::jsonb),'truncated',(select count(*)>500 from public.command_centre_audit_log where occurred_at>=p_from::timestamptz and occurred_at<(p_to+1)::timestamptz and (p_action is null or action=p_action)));
end $$;

create function public.decked_set_command_centre_staff_role(p_user_id uuid,p_role text,p_status text,p_request_id uuid default gen_random_uuid())
returns void language plpgsql security definer set search_path='' as $$
declare old_role text;old_status text;
begin
  if not public.decked_is_command_centre_staff('admin') then raise exception 'Command Centre administrator access is required.' using errcode='42501'; end if;
  if p_role not in ('admin','viewer') or p_status not in ('active','disabled') then raise exception 'Invalid staff role.' using errcode='22023'; end if;
  if exists(select 1 from public.command_centre_audit_log where request_id=p_request_id) then return; end if;
  select role,status into old_role,old_status from public.command_centre_staff where user_id=p_user_id for update;
  if old_role is null then raise exception 'Staff record not found.' using errcode='P0002'; end if;
  if old_role='admin' and old_status='active' and (p_role<>'admin' or p_status<>'active') and (select count(*) from public.command_centre_staff where role='admin' and status='active')<=1 then raise exception 'The final active administrator cannot be removed or disabled.' using errcode='23514'; end if;
  update public.command_centre_staff set role=p_role,status=p_status,updated_at=now() where user_id=p_user_id;
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id) values(auth.uid(),'admin','staff_role_changed','staff_account','staff-'||substr(md5(p_user_id::text),1,10),jsonb_build_object('old_role',old_role,'new_role',p_role,'old_status',old_status,'new_status',p_status),p_request_id);
end $$;

revoke all on function public.decked_csv_cell(text) from public,anon,authenticated;
revoke all on function public.decked_export_command_centre_csv(text,text,date,date,text,text,text,text,text,text,text[],uuid) from public,anon;
revoke all on function public.decked_command_centre_audit_log(date,date,text) from public,anon;
revoke all on function public.decked_set_command_centre_staff_role(uuid,text,text,uuid) from public,anon;
grant execute on function public.decked_export_command_centre_csv(text,text,date,date,text,text,text,text,text,text,text[],uuid) to authenticated;
grant execute on function public.decked_command_centre_audit_log(date,date,text) to authenticated;
grant execute on function public.decked_set_command_centre_staff_role(uuid,text,text,uuid) to authenticated;
