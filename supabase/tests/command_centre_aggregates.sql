\set ON_ERROR_STOP on
begin;

insert into auth.users(id) values
 ('d1111111-1111-4111-8111-111111111111'),
 ('d2222222-2222-4222-8222-222222222222'),
 ('d3333333-3333-4333-8333-333333333333') on conflict(id) do nothing;
insert into public.command_centre_staff(user_id,role) values
 ('d1111111-1111-4111-8111-111111111111','admin'),
 ('d3333333-3333-4333-8333-333333333333','viewer') on conflict(user_id) do update set role=excluded.role,status='active';

do $$ begin
 if public.decked_csv_cell('=SUM(A1:A2)') <> '"''=SUM(A1:A2)"' then raise exception 'Formula injection value was not neutralized'; end if;
 if public.decked_csv_cell('-42') <> '"-42"' then raise exception 'Negative number was unexpectedly changed'; end if;
 if public.decked_export_safe_label('decked_join_room:PGRST202') <> 'decked_join_room:PGRST202' then raise exception 'Stable export label was incorrectly redacted'; end if;
 if public.decked_export_safe_label(null) is not null then raise exception 'Missing optional export label was incorrectly materialized'; end if;
 if public.decked_export_safe_label('Bearer secret token') <> 'redacted' or public.decked_export_safe_label(repeat('x',161)) <> 'redacted' then raise exception 'Unsafe export label was not redacted'; end if;
end $$;

insert into public.analytics_game_sessions(
 game_session_id,environment,game_id,play_mode,status,setup_started_at,started_at,completed_at,last_activity_at,cards_presented,app_version_started
) values
 ('d3000000-0000-4000-8000-000000000001','production','charades','pass_and_play','completed','2026-10-01 23:55+00','2026-10-01 23:56+00','2026-10-02 00:10+00','2026-10-02 00:10+00',8,'test'),
 ('d3000000-0000-4000-8000-000000000002','production','charades','pass_and_play','started','2026-10-01 12:00+00','2026-10-01 12:01+00',null,'2026-10-01 12:05+00',2,'test'),
 ('d3000000-0000-4000-8000-000000000003','production','icebreaker','play_together','completed','2026-10-02 10:00+00','2026-10-02 10:01+00','2026-10-02 10:20+00','2026-10-02 10:20+00',5,'test'),
 ('d3000000-0000-4000-8000-000000000004','development','charades','pass_and_play','completed','2026-10-01 10:00+00','2026-10-01 10:01+00','2026-10-01 10:02+00','2026-10-01 10:02+00',1,'test');

insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,game_id,play_mode,app_version,properties,idempotency_key) values
 ('d4000000-0000-4000-8000-000000000001','app_opened','browser','production','2026-10-01 09:00+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',null,null,'test','{}','fixture-open-1'),
 ('d4000000-0000-4000-8000-000000000002','game_selected','browser','production','2026-10-01 09:01+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001','charades',null,'test','{"game_id":"charades","selection_surface":"browse"}','fixture-select-1'),
 ('d4000000-0000-4000-8000-000000000003','room_join_attempted','browser','production','2026-10-02 09:01+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002',null,null,'test','{}','fixture-join-1'),
 ('d4000000-0000-4000-8000-000000000004','room_join_failed','browser','production','2026-10-02 09:02+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002',null,null,'test','{"failure_reason":"not_found_or_expired"}','fixture-join-fail-1'),
 ('d4000000-0000-4000-8000-000000000006','frontend_error','browser','production','2026-10-02 09:03+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002',null,null,'test','{"error_fingerprint":"render-loop","error_class":"render","screen_id":"play-together","browser_name":"Chrome"}','fixture-error-1'),
 ('d4000000-0000-4000-8000-000000000007','screen_viewed','browser','production','2026-10-01 09:00+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001','charades',null,'test','{"screen_id":"charades","game_id":"charades"}','fixture-view-1'),
 ('d4000000-0000-4000-8000-000000000008','game_replay_selected','browser','production','2026-10-02 00:11+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001','charades','pass_and_play','test','{"game_id":"charades","play_mode":"pass_and_play","completed_game_session_id":"d3000000-0000-4000-8000-000000000001"}','fixture-replay-1'),
 ('d4000000-0000-4000-8000-000000000005','app_opened','browser','development','2026-10-01 09:00+00','d5000000-0000-4000-8000-000000000003','d6000000-0000-4000-8000-000000000003',null,null,'test','{}','fixture-dev-open-1')
on conflict do nothing;
-- Ordered discovery and multiplayer funnel fixtures. The discovery completion crosses UTC midnight.
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,multiplayer_room_ref,game_session_id,game_id,play_mode,app_version,properties,idempotency_key) values
 ('d4000000-0000-4000-8000-000000000010','screen_viewed','browser','production','2026-10-01 09:00:30+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',null,null,null,null,'test','{"screen_id":"browse"}','fixture-funnel-browse'),
 ('d4000000-0000-4000-8000-000000000011','play_mode_selected','browser','production','2026-10-01 09:02+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',null,null,'charades','pass_and_play','test','{"game_id":"charades","play_mode":"pass_and_play"}','fixture-funnel-mode'),
 ('d4000000-0000-4000-8000-000000000012','game_started','browser','production','2026-10-01 09:03+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',null,'d3000000-0000-4000-8000-000000000001','charades','pass_and_play','test','{"game_id":"charades","play_mode":"pass_and_play"}','fixture-funnel-start'),
 ('d4000000-0000-4000-8000-000000000013','card_presented','browser','production','2026-10-01 09:04+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',null,'d3000000-0000-4000-8000-000000000001','charades','pass_and_play','test','{"game_id":"charades","card_number":1,"configured_card_count":8,"content_source":"built_in"}','fixture-funnel-card'),
 ('d4000000-0000-4000-8000-000000000014','game_completed','browser','production','2026-10-02 00:05+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001',null,'d3000000-0000-4000-8000-000000000001','charades','pass_and_play','test','{"game_id":"charades","play_mode":"pass_and_play"}','fixture-funnel-complete'),
 ('d4000000-0000-4000-8000-000000000020','app_opened','browser','production','2026-10-01 11:00+00','d5000000-0000-4000-8000-000000000004','d6000000-0000-4000-8000-000000000004',null,null,null,null,'test','{"initial_screen_id":"play-together","entry_path":"/play-together","is_pwa":false,"device_class":"mobile","utm_source":"invite"}','fixture-guest-open'),
 ('d4000000-0000-4000-8000-000000000021','screen_viewed','browser','production','2026-10-01 11:00:01+00','d5000000-0000-4000-8000-000000000004','d6000000-0000-4000-8000-000000000004',null,null,null,null,'test','{"screen_id":"play-together"}','fixture-guest-view'),
 ('d4000000-0000-4000-8000-000000000022','room_join_attempted','browser','production','2026-10-01 11:01+00','d5000000-0000-4000-8000-000000000004','d6000000-0000-4000-8000-000000000004',null,null,null,null,'test','{}','fixture-guest-submit'),
 ('d4000000-0000-4000-8000-000000000023','room_joined','browser','production','2026-10-01 11:02+00','d5000000-0000-4000-8000-000000000004','d6000000-0000-4000-8000-000000000004','d7000000-0000-4000-8000-000000000001',null,'charades','play_together','test','{"game_id":"charades","is_first_guest":true}','fixture-guest-joined'),
 ('d4000000-0000-4000-8000-000000000024','multiplayer_game_started','database','production','2026-10-01 11:03+00',null,null,'d7000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000005','charades','play_together','database','{"game_id":"charades"}','fixture-guest-start'),
 ('d4000000-0000-4000-8000-000000000025','multiplayer_game_completed','database','production','2026-10-01 11:20+00',null,null,'d7000000-0000-4000-8000-000000000001','d3000000-0000-4000-8000-000000000005','charades','play_together','database','{"game_id":"charades"}','fixture-guest-complete')
on conflict do nothing;
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,multiplayer_room_ref,game_session_id,game_id,play_mode,app_version,properties,idempotency_key) values
 ('d4000000-0000-4000-8000-000000000029','app_opened','browser','production','2026-10-02 08:59+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002',null,null,null,null,'test','{"initial_screen_id":"play-together","entry_path":"/play-together","is_pwa":false,"device_class":"desktop"}','fixture-host-open'),
 ('d4000000-0000-4000-8000-000000000030','play_mode_selected','browser','production','2026-10-02 12:00+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002',null,null,'charades','play_together','test','{"game_id":"charades","play_mode":"play_together"}','fixture-host-selected'),
 ('d4000000-0000-4000-8000-000000000031','room_created','browser','production','2026-10-02 12:01+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002','d7000000-0000-4000-8000-000000000002',null,'charades','play_together','test','{"game_id":"charades"}','fixture-host-created'),
 ('d4000000-0000-4000-8000-000000000032','room_joined','database','production','2026-10-02 12:02+00',null,null,'d7000000-0000-4000-8000-000000000002',null,'charades','play_together','database','{"game_id":"charades","is_first_guest":true}','fixture-host-guest'),
 ('d4000000-0000-4000-8000-000000000033','multiplayer_game_started','database','production','2026-10-02 12:03+00',null,null,'d7000000-0000-4000-8000-000000000002','d3000000-0000-4000-8000-000000000006','charades','play_together','database','{"game_id":"charades"}','fixture-host-start'),
 ('d4000000-0000-4000-8000-000000000034','multiplayer_game_completed','database','production','2026-10-02 12:20+00',null,null,'d7000000-0000-4000-8000-000000000002','d3000000-0000-4000-8000-000000000006','charades','play_together','database','{"game_id":"charades"}','fixture-host-complete')
on conflict do nothing;
insert into public.analytics_room_facts(multiplayer_room_ref,environment,game_id,created_at,first_guest_joined_at,first_game_started_at,last_game_completed_at,peak_player_count,successful_join_count,rematch_request_count,rematch_start_count,host_disconnect_count,host_handoff_count,last_activity_at) values
 ('d7000000-0000-4000-8000-000000000001','production','charades','2026-10-01 11:00+00','2026-10-01 11:02+00','2026-10-01 11:03+00','2026-10-01 11:20+00',3,2,1,1,1,1,'2026-10-01 11:20+00'),
 ('d7000000-0000-4000-8000-000000000002','production','charades','2026-10-02 12:00+00','2026-10-02 12:02+00','2026-10-02 12:03+00','2026-10-02 12:20+00',2,1,0,0,0,0,'2026-10-02 12:20+00')
on conflict do nothing;
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,game_id,play_mode,app_version,properties,idempotency_key) values
 ('d4000000-0000-4000-8000-000000000040','rpc_failed','browser','production','2026-10-02 09:04+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002','charades','play_together','test','{"rpc_name":"decked_join_room","error_code":"PGRST202","failure_class":"transport"}','fixture-rpc-failure'),
 ('d4000000-0000-4000-8000-000000000041','realtime_status_changed','browser','production','2026-10-02 09:05+00','d5000000-0000-4000-8000-000000000002','d6000000-0000-4000-8000-000000000002','charades','play_together','test','{"channel_type":"room","status":"timed_out"}','fixture-realtime-failure')
on conflict do nothing;
-- Duplicate retry must remain one source event and one aggregate contribution.
insert into public.analytics_events(event_id,event_name,source,environment,occurred_at,analytics_user_id,analytics_session_id,app_version,properties,idempotency_key)
values ('d4000000-0000-4000-8000-000000000099','app_opened','browser','production','2026-10-01 09:00+00','d5000000-0000-4000-8000-000000000001','d6000000-0000-4000-8000-000000000001','test','{}','fixture-open-1') on conflict do nothing;

select public.decked_refresh_analytics_aggregates('2026-10-01','2026-10-03');
select public.decked_refresh_analytics_aggregates('2026-10-01','2026-10-03');

-- A newer one-day refresh must not claim freshness for the complete three-day range.
select public.decked_refresh_analytics_aggregates('2026-10-02','2026-10-02');
update public.analytics_aggregate_refreshes
set completed_at=completed_at+interval '1 hour'
where id=(select max(id) from public.analytics_aggregate_refreshes);

do $$ declare starts bigint; completions bigint; dev_starts bigint; reconciliation jsonb; full_freshness timestamptz; partial_freshness timestamptz; begin
 select sum(metric_value) into starts from public.analytics_daily_aggregates where environment='production' and metric_name='game_starts' and metric_date between '2026-10-01' and '2026-10-03';
 select sum(metric_value) into completions from public.analytics_daily_aggregates where environment='production' and metric_name='game_completions' and metric_date between '2026-10-01' and '2026-10-03';
 select sum(metric_value) into dev_starts from public.analytics_daily_aggregates where environment='development' and metric_name='game_starts' and metric_date between '2026-10-01' and '2026-10-03';
 if starts<>3 or completions<>2 or dev_starts<>1 then raise exception 'Aggregate fixture mismatch: %, %, %',starts,completions,dev_starts; end if;
 select public.decked_reconcile_analytics_day('production','2026-10-01') into reconciliation;
 if not (reconciliation->>'matches')::boolean then raise exception 'Reconciliation failed: %',reconciliation; end if;
 select public.decked_aggregate_freshness('2026-10-01','2026-10-03') into full_freshness;
 select max(completed_at) into partial_freshness from public.analytics_aggregate_refreshes where from_date='2026-10-02' and to_date='2026-10-02';
 if full_freshness is null or full_freshness>=partial_freshness then raise exception 'Partial refresh incorrectly reported as full-range freshness: %, %',full_freshness,partial_freshness; end if;
 if (select count(*) from public.analytics_aggregate_refreshes where from_date='2026-10-01' and status='completed')<>2 then raise exception 'Idempotent rebuild history missing'; end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','d2222222-2222-4222-8222-222222222222',true);
do $$ begin
 begin perform public.decked_command_centre_metrics('overview','production','2026-10-01','2026-10-03',null); raise exception 'Unauthorized aggregate read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_command_centre_games_v2('production','2026-10-01','2026-10-03',null,7); raise exception 'Unauthorized games read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_command_centre_game_detail('production','2026-10-01','2026-10-03','charades',7); raise exception 'Unauthorized game detail read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_command_centre_funnels_v2('production','2026-10-01','2026-10-03',null,null,null,null,null,null); raise exception 'Unauthorized funnel read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_command_centre_multiplayer_v2('production','2026-10-01','2026-10-03',null); raise exception 'Unauthorized multiplayer read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_command_centre_reliability_v2('production','2026-10-01','2026-10-03',null,null,null,null); raise exception 'Unauthorized reliability read succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_export_command_centre_csv('games','production','2026-10-01','2026-10-03',null,null,null,null,null,null,null,'e1000000-0000-4000-8000-000000000001'); raise exception 'Unauthorized export succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_export_command_centre_games_csv('production','2026-10-01','2026-10-03',null,30,null,'e1000000-0000-4000-8000-000000000002'); raise exception 'Unauthorized Games export succeeded'; exception when insufficient_privilege then null; end;
 begin perform public.decked_command_centre_audit_log('2026-10-01','2026-10-03',null); raise exception 'Unauthorized audit read succeeded'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','d1111111-1111-4111-8111-111111111111',true);
do $$ declare overview jsonb; overview_v2 jsonb; filtered_v2 jsonb; zero_v2 jsonb; games jsonb; games_v2 jsonb; games_filtered jsonb; game_detail jsonb; funnels jsonb; funnels_v2 jsonb; funnels_filtered jsonb; multiplayer_v2 jsonb; reliability_v2 jsonb; reliability_filtered jsonb; empty_result jsonb; begin
 overview:=public.decked_command_centre_metrics('overview','production','2026-10-01','2026-10-03',null);
 games:=public.decked_command_centre_games('production','2026-10-01','2026-10-03','charades');
 funnels:=public.decked_command_centre_funnels('production','2026-10-01','2026-10-03',null);
 empty_result:=public.decked_command_centre_games('production','2025-01-01','2025-01-02',null);
 overview_v2:=public.decked_command_centre_overview_v2('production','2026-10-01','2026-10-02',null,null);
 filtered_v2:=public.decked_command_centre_overview_v2('production','2026-10-01','2026-10-02','charades','pass_and_play');
 zero_v2:=public.decked_command_centre_overview_v2('production','2025-01-01','2025-01-02',null,null);
 games_v2:=public.decked_command_centre_games_v2('production','2026-10-01','2026-10-02',null,7);
 games_filtered:=public.decked_command_centre_games_v2('production','2026-10-01','2026-10-02','pass_and_play',30);
 game_detail:=public.decked_command_centre_game_detail('production','2026-10-01','2026-10-02','charades',7);
 funnels_v2:=public.decked_command_centre_funnels_v2('production','2026-10-01','2026-10-02',null,null,null,null,null,null);
 funnels_filtered:=public.decked_command_centre_funnels_v2('production','2026-10-01','2026-10-02','charades','play_together','mobile',null,'invite','test');
 multiplayer_v2:=public.decked_command_centre_multiplayer_v2('production','2026-10-01','2026-10-02','charades');
 reliability_v2:=public.decked_command_centre_reliability_v2('production','2026-10-01','2026-10-02','charades',null,null,'test');
 reliability_filtered:=public.decked_command_centre_reliability_v2('production','2026-10-01','2026-10-02','charades','desktop','Chrome','test');
 if (overview->>'game_sessions')::int<>3 or jsonb_array_length(games->'rows')<>1 then raise exception 'Filtered result mismatch'; end if;
 if jsonb_array_length(funnels->'rows')=0 then raise exception 'Partial funnels missing'; end if;
 if jsonb_array_length(empty_result->'rows')<>0 then raise exception 'Zero-data response is not empty'; end if;
 if overview->>'refreshed_at' is null then raise exception 'Freshness timestamp missing'; end if;
 if (overview_v2#>>'{current,game_starts}')::int<>3 or (overview_v2#>>'{current,weekly_active}')::int<>2 then raise exception 'Overview v2 core metrics mismatch: %',overview_v2; end if;
 if (overview_v2#>>'{current,error_sessions}')::int<>1 or (overview_v2#>>'{current,sessions}')::int<>2 then raise exception 'Overview v2 reliability mismatch: %',overview_v2; end if;
 if (filtered_v2#>>'{current,game_starts}')::int<>2 or jsonb_array_length(filtered_v2->'partial_warnings')<>1 then raise exception 'Overview v2 filtered result mismatch: %',filtered_v2; end if;
 if (zero_v2#>>'{current,game_starts}')::int<>0 or jsonb_array_length(zero_v2->'trend')<>0 then raise exception 'Overview v2 zero-data result mismatch: %',zero_v2; end if;
 if jsonb_array_length(games_v2->'rows')<>21 then raise exception 'Canonical games list does not contain 21 rows: %',games_v2; end if;
 if (select (value->>'game_views')::int from jsonb_array_elements(games_v2->'rows') where value->>'game_id'='charades')<>1 then raise exception 'Game views mismatch: %',games_v2; end if;
 if jsonb_array_length(games_filtered->'partial_warnings')<>1 then raise exception 'Filtered games warning missing: %',games_filtered; end if;
 if jsonb_array_length(game_detail->'trend')<>2 or (game_detail#>>'{replay_behavior,replays}')::int<>1 then raise exception 'Game detail fixture mismatch: %',game_detail; end if;
 if jsonb_array_length(funnels_v2->'funnels')<>3 then raise exception 'Expected three ordered funnels: %',funnels_v2; end if;
 if (select (step->>'entrants')::int from jsonb_array_elements(funnels_v2->'funnels') funnel cross join lateral jsonb_array_elements(funnel->'steps') step where funnel->>'funnel_id'='discovery' and step->>'step_name'='Completion')<>1 then raise exception 'Cross-day discovery completion missing: %',funnels_v2; end if;
 if (select (step->>'entrants')::int from jsonb_array_elements(funnels_filtered->'funnels') funnel cross join lateral jsonb_array_elements(funnel->'steps') step where funnel->>'funnel_id'='multiplayer_guest' and step->>'step_name'='Completion')<>1 then raise exception 'Filtered guest funnel mismatch: %',funnels_filtered; end if;
 if (multiplayer_v2#>>'{metrics,rooms_created}')::int<>2 or (multiplayer_v2#>>'{metrics,successful_joins}')::int<>3 then raise exception 'Multiplayer metrics mismatch: %',multiplayer_v2; end if;
 if multiplayer_v2::text like '%d7000000-0000-4000-8000-000000000001%' or multiplayer_v2::text like '%room_code%' or multiplayer_v2::text like '%display_name%' then raise exception 'Multiplayer response leaked a room reference or sensitive field: %',multiplayer_v2; end if;
 if multiplayer_v2#>>'{timeline_redacted}'<>'true' or jsonb_array_length(multiplayer_v2->'partial_warnings')=0 then raise exception 'Multiplayer redaction or partial-data state missing: %',multiplayer_v2; end if;
 if (reliability_v2#>>'{metrics,frontend_errors}')::int<>1 or (reliability_v2#>>'{metrics,rpc_failures}')::int<>1 or jsonb_array_length(reliability_v2->'groups')<>3 then raise exception 'Reliability grouping mismatch: %',reliability_v2; end if;
 if reliability_v2::text like '%d6000000-0000-4000-8000-000000000002%' or reliability_v2::text like '%access_token%' or reliability_v2::text like '%stack%' then raise exception 'Reliability response leaked a session identifier or sensitive diagnostic: %',reliability_v2; end if;
 if exists (select 1 from jsonb_array_elements(reliability_v2->'groups') value where not (value ? 'occurrences' and value ? 'affected_sessions' and value ? 'first_seen' and value ? 'last_seen')) then raise exception 'Grouped error evidence is incomplete: %',reliability_v2; end if;
 if reliability_filtered#>'{metrics,error_free_session_rate}' <> 'null'::jsonb then raise exception 'Browser-filtered error-free rate must be redacted: %',reliability_filtered; end if;
end $$;

do $$ declare exported jsonb; ordered_export jsonb; filtered_export jsonb; audit_view jsonb; begin
 exported:=public.decked_export_command_centre_csv('games','production','2026-10-01','2026-10-02',null,null,null,null,null,null,array['charades'],'e2000000-0000-4000-8000-000000000001');
 if (exported->>'row_count')::int<>1 or position('"charades"' in exported->>'csv')=0 or position('"icebreaker"' in exported->>'csv')>0 then raise exception 'Filtered export does not match visible rows: %',exported; end if;
 if position('generated_at' in exported->>'csv')=0 or position('data_freshness' in exported->>'csv')=0 then raise exception 'Export metadata columns missing'; end if;
 if (select properties ? 'csv' from public.command_centre_audit_log where request_id='e2000000-0000-4000-8000-000000000001') then raise exception 'Audit entry contains exported data'; end if;
 perform public.decked_export_command_centre_csv('games','production','2026-10-01','2026-10-02',null,null,null,null,null,null,array['charades'],'e2000000-0000-4000-8000-000000000001');
 if (select count(*) from public.command_centre_audit_log where request_id='e2000000-0000-4000-8000-000000000001')<>1 then raise exception 'Duplicate export audit entry created'; end if;
 ordered_export:=public.decked_export_command_centre_games_csv('production','2026-10-01','2026-10-02',null,30,array['icebreaker','charades'],'e2000000-0000-4000-8000-000000000004');
 if (ordered_export->>'row_count')::int<>2 or position('"icebreaker"' in ordered_export->>'csv')>=position('"charades"' in ordered_export->>'csv') then raise exception 'Games export order does not match visible rows: %',ordered_export; end if;
 if (select properties->>'trend_days' from public.command_centre_audit_log where request_id='e2000000-0000-4000-8000-000000000004')<>'30' then raise exception 'Games export did not audit its trend window'; end if;
 filtered_export:=public.decked_export_command_centre_csv('reliability','production','2026-10-01','2026-10-02','charades',null,'desktop',null,'Chrome','test',null,'e2000000-0000-4000-8000-000000000005');
 if (filtered_export->>'row_count')::int<>3 then raise exception 'Filtered Reliability export mismatch: %',filtered_export; end if;
 if not exists(select 1 from public.command_centre_audit_log where request_id='e2000000-0000-4000-8000-000000000005' and properties->>'browser'='Chrome' and properties->>'app_version'='test' and not (properties ? 'csv')) then raise exception 'Filtered export audit metadata missing or contains export data'; end if;
 perform public.decked_set_command_centre_staff_role('d3333333-3333-4333-8333-333333333333','viewer','disabled','e2000000-0000-4000-8000-000000000002');
 if (select count(*) from public.command_centre_audit_log where request_id='e2000000-0000-4000-8000-000000000002' and action='staff_role_changed')<>1 then raise exception 'Role change audit missing'; end if;
 begin perform public.decked_set_command_centre_staff_role('d1111111-1111-4111-8111-111111111111','viewer','active','e2000000-0000-4000-8000-000000000003'); raise exception 'Final admin could remove itself'; exception when check_violation then null; end;
 audit_view:=public.decked_command_centre_audit_log(current_date-30,current_date,null);
 if audit_view::text like '%d1111111-1111-4111-8111-111111111111%' or audit_view::text like '%"csv"%' then raise exception 'Audit viewer leaked sensitive fields: %',audit_view; end if;
 if not exists(select 1 from jsonb_array_elements(audit_view->'rows') row where row->>'action'='staff_role_changed' and row->>'metadata_summary' like '%status active → disabled%') then raise exception 'Role-change audit summary is missing: %',audit_view; end if;
end $$;

reset role;
rollback;
