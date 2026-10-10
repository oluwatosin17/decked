-- Games exports use the same trend window and visible row order as the dashboard.

create function public.decked_export_command_centre_games_csv(
  p_environment text,p_from date,p_to date,p_play_mode text default null,p_trend_days integer default 7,
  p_visible_game_ids text[] default null,p_request_id uuid default gen_random_uuid()
) returns jsonb language plpgsql volatile security definer set search_path='' as $$
declare
  payload jsonb; row_data jsonb; csv text;
  generated timestamptz:=clock_timestamp(); freshness text; row_count integer:=0; actor_role text;
begin
  if not public.decked_is_command_centre_staff('viewer') then
    raise exception 'Command Centre staff access is required.' using errcode='42501';
  end if;
  perform public.decked_validate_command_centre_filters(p_environment,p_from,p_to,null);
  if p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together') then
    raise exception 'Invalid play mode filter.' using errcode='22023';
  end if;
  if p_trend_days not in (7,30) then raise exception 'Trend window must be 7 or 30 days.' using errcode='22023'; end if;
  if p_visible_game_ids is not null and exists(
    select 1 from unnest(p_visible_game_ids) id where id is null or not (id=any(array[
      'truth-or-dare','spicy-starters','never-have-i-ever','late-night-talks','dinner-table','icebreaker','everyday-conversation','reconnect','red-flag-green-flag','charades','strangers','finger-down','take-a-sip','sip-or-spill','you-laugh','do-or-drink','two-truths-bluff','most-likely-to','choose-your-side','who-said-that','we-just-met'
    ]))
  ) then raise exception 'Invalid visible game IDs.' using errcode='22023'; end if;

  payload:=public.decked_command_centre_games_v2(p_environment,p_from,p_to,p_play_mode,p_trend_days);
  freshness:=payload->>'refreshed_at';
  csv:='generated_at,data_freshness,environment,date_from,date_to,game_id,game_views,selections,pass_and_play_starts,multiplayer_starts,unique_players,first_card_rate,completion_rate,median_cards_played,median_duration_seconds,replay_rate,trend_percent';
  for row_data in
    select item.value from jsonb_array_elements(payload->'rows') item(value)
    left join unnest(p_visible_game_ids) with ordinality visible(game_id,position) on visible.game_id=item.value->>'game_id'
    where p_visible_game_ids is null or visible.game_id is not null
    order by case when p_visible_game_ids is null then 0 else visible.position end,item.value->>'game_id'
  loop
    row_count:=row_count+1;
    csv:=csv||E'\n'||array_to_string(array[
      public.decked_csv_cell(generated::text),public.decked_csv_cell(freshness),public.decked_csv_cell(p_environment),
      public.decked_csv_cell(p_from::text),public.decked_csv_cell(p_to::text),public.decked_csv_cell(row_data->>'game_id'),
      public.decked_csv_cell(row_data->>'game_views'),public.decked_csv_cell(row_data->>'selections'),
      public.decked_csv_cell(row_data->>'pass_and_play_starts'),public.decked_csv_cell(row_data->>'multiplayer_starts'),
      public.decked_csv_cell(row_data->>'unique_players'),public.decked_csv_cell(row_data->>'first_card_rate'),
      public.decked_csv_cell(row_data->>'completion_rate'),public.decked_csv_cell(row_data->>'median_cards_played'),
      public.decked_csv_cell(row_data->>'median_duration_seconds'),public.decked_csv_cell(row_data->>'replay_rate'),
      public.decked_csv_cell(row_data->>'trend_percent')
    ],',');
  end loop;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid() and status='active';
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties,request_id)
  values(auth.uid(),actor_role,'report_exported','analytics_report','games',jsonb_build_object(
    'report','games','environment',p_environment,'from',p_from,'to',p_to,'play_mode',p_play_mode,
    'trend_days',p_trend_days,'row_count',row_count
  ),p_request_id) on conflict(request_id) do nothing;
  return jsonb_build_object('filename','decked-games-'||p_from||'-'||p_to||'.csv','csv',csv,'row_count',row_count,'generated_at',generated,'refreshed_at',freshness);
end $$;

revoke all on function public.decked_export_command_centre_games_csv(text,date,date,text,integer,text[],uuid) from public,anon;
grant execute on function public.decked_export_command_centre_games_csv(text,date,date,text,integer,text[],uuid) to authenticated;

comment on function public.decked_export_command_centre_games_csv(text,date,date,text,integer,text[],uuid) is
  'Staff-only Games CSV matching the active date, mode, trend window, visible filter, and visible sort order.';
