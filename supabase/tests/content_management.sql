\set ON_ERROR_STOP on
begin;

insert into auth.users(id,is_anonymous) values
 ('d1111111-1111-4111-8111-111111111111',false),
 ('d2222222-2222-4222-8222-222222222222',false),
 ('d3333333-3333-4333-8333-333333333333',true)
on conflict(id) do update set is_anonymous=excluded.is_anonymous;
insert into public.command_centre_staff(user_id,role,status) values
 ('d1111111-1111-4111-8111-111111111111','viewer','active'),
 ('d2222222-2222-4222-8222-222222222222','editor','active')
on conflict(user_id) do update set role=excluded.role,status='active';

set local role authenticated;
select set_config('request.jwt.claim.role','authenticated',true);
select set_config('request.jwt.claim.sub','d1111111-1111-4111-8111-111111111111',true);
do $$ begin
  perform public.decked_command_centre_content_counts();
  begin
    perform public.decked_command_centre_save_content_item(null,'never-have-i-ever','prompt','Viewer must not write','{}',array['main'],null,null);
    raise exception 'Viewer content mutation unexpectedly succeeded';
  exception when insufficient_privilege then null; end;
  begin perform count(*) from public.content_items; raise exception 'Viewer direct table read unexpectedly succeeded'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','d3333333-3333-4333-8333-333333333333',true);
do $$ begin
  begin perform public.decked_command_centre_content_counts(); raise exception 'Anonymous-auth staff read unexpectedly succeeded'; exception when insufficient_privilege then null; end;
end $$;

select set_config('request.jwt.claim.sub','d2222222-2222-4222-8222-222222222222',true);
do $$ declare saved jsonb; item_id uuid; begin
  saved:=public.decked_command_centre_save_content_item(null,'never-have-i-ever','prompt','Never have I ever tested the content workflow.','{}',array['main'],null,'SQL acceptance test');
  item_id:=(saved->>'id')::uuid;
  if saved->>'status'<>'draft' then raise exception 'New item was not a draft'; end if;
  perform public.decked_command_centre_set_content_archived(item_id,true,1);
  perform public.decked_command_centre_set_content_archived(item_id,false,1);
  if not exists(select 1 from public.command_centre_audit_log where target_ref=item_id::text and action='content_item_restored') then raise exception 'Content audit history missing'; end if;
end $$;

reset role;
set local role anon;
select set_config('request.jwt.claim.role','anon',true);
do $$ declare payload jsonb; begin
  payload:=public.decked_get_published_content('never-have-i-ever',array['main']);
  if payload->>'game_id'<>'never-have-i-ever' or payload->'items' is null then raise exception 'Published runtime shape invalid'; end if;
  begin perform count(*) from public.content_item_versions; raise exception 'Anonymous direct content read unexpectedly succeeded'; exception when insufficient_privilege then null; end;
end $$;

reset role;
rollback;
