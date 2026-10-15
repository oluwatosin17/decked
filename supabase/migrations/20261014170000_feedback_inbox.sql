-- Public feedback intake and staff-only Command Centre inbox.

create table public.feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  submitter_user_id uuid references auth.users(id) on delete set null,
  feedback_type text not null check (feedback_type in ('idea','problem','content','design','other')),
  game_id text,
  rating smallint check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 10 and 2000),
  contact_email text check (contact_email is null or char_length(contact_email) <= 254),
  source text not null default 'feedback_page' check (source in ('header','footer','game_menu','game_complete','feedback_page')),
  page_path text not null check (char_length(page_path) between 1 and 500),
  play_mode text check (play_mode is null or play_mode in ('pass_and_play','play_together')),
  device_class text not null check (device_class in ('mobile','tablet','desktop','unknown')),
  status text not null default 'new' check (status in ('new','reviewed','planned','resolved','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  internal_notes text check (internal_notes is null or char_length(internal_notes) <= 4000),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null
);

create index feedback_submissions_created_idx on public.feedback_submissions(created_at desc);
create index feedback_submissions_status_idx on public.feedback_submissions(status,created_at desc);
create index feedback_submissions_game_idx on public.feedback_submissions(game_id,created_at desc);
alter table public.feedback_submissions enable row level security;
revoke all on table public.feedback_submissions from public,anon,authenticated;
grant select,insert,update,delete on table public.feedback_submissions to service_role;

create function public.decked_submit_feedback(
  p_feedback_type text,
  p_game_id text,
  p_rating integer,
  p_message text,
  p_contact_email text,
  p_source text,
  p_page_path text,
  p_play_mode text,
  p_device_class text,
  p_website text default null
) returns uuid language plpgsql security definer set search_path='' as $$
declare feedback_id uuid;
begin
  if auth.uid() is null then raise exception 'A valid Decked session is required.' using errcode='42501'; end if;
  if nullif(btrim(coalesce(p_website,'')),'') is not null then raise exception 'Submission rejected.' using errcode='22023'; end if;
  if p_feedback_type not in ('idea','problem','content','design','other')
    or p_source not in ('header','footer','game_menu','game_complete','feedback_page')
    or p_device_class not in ('mobile','tablet','desktop','unknown')
    or (p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together'))
    or (p_rating is not null and p_rating not between 1 and 5)
    or char_length(btrim(coalesce(p_message,''))) not between 10 and 2000
    or char_length(coalesce(p_page_path,'')) not between 1 and 500
    or (p_contact_email is not null and (char_length(p_contact_email)>254 or p_contact_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'))
  then raise exception 'Invalid feedback submission.' using errcode='22023'; end if;
  if (select count(*) from public.feedback_submissions where submitter_user_id=auth.uid() and created_at>now()-interval '1 hour') >= 5
  then raise exception 'Please wait before sending more feedback.' using errcode='42900'; end if;
  insert into public.feedback_submissions(submitter_user_id,feedback_type,game_id,rating,message,contact_email,source,page_path,play_mode,device_class)
  values(auth.uid(),p_feedback_type,nullif(btrim(p_game_id),''),p_rating,btrim(p_message),nullif(btrim(p_contact_email),''),p_source,p_page_path,p_play_mode,p_device_class)
  returning id into feedback_id;
  return feedback_id;
end $$;

create function public.decked_command_centre_feedback(p_status text default null,p_type text default null,p_game_id text default null,p_query text default null,p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  if p_limit not between 1 and 200 or p_offset<0 then raise exception 'Invalid pagination.' using errcode='22023'; end if;
  with rows as (
    select id,created_at,feedback_type,game_id,rating,message,contact_email,source,page_path,play_mode,device_class,status,priority,internal_notes,reviewed_at,count(*) over() total_count
    from public.feedback_submissions
    where (p_status is null or status=p_status) and (p_type is null or feedback_type=p_type) and (p_game_id is null or game_id=p_game_id)
      and (p_query is null or btrim(p_query)='' or message ilike '%'||replace(replace(btrim(p_query),'%','\%'),'_','\_')||'%' escape '\')
    order by created_at desc limit p_limit offset p_offset
  ) select jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(rows)-'total_count' order by created_at desc),'[]'::jsonb),'total',coalesce(max(total_count),0)) into result from rows;
  return result;
end $$;

create function public.decked_update_feedback(p_id uuid,p_status text,p_priority text,p_internal_notes text default null)
returns void language plpgsql security definer set search_path='' as $$
declare actor_role text;
begin
  if not public.decked_is_command_centre_staff('editor') then raise exception 'Feedback editor access is required.' using errcode='42501'; end if;
  if p_status not in ('new','reviewed','planned','resolved','archived') or p_priority not in ('low','normal','high','urgent') or char_length(coalesce(p_internal_notes,''))>4000
  then raise exception 'Invalid feedback update.' using errcode='22023'; end if;
  select role into actor_role from public.command_centre_staff where user_id=auth.uid();
  update public.feedback_submissions set status=p_status,priority=p_priority,internal_notes=nullif(btrim(p_internal_notes),''),reviewed_at=now(),reviewed_by=auth.uid() where id=p_id;
  if not found then raise exception 'Feedback not found.' using errcode='P0002'; end if;
  insert into public.command_centre_audit_log(actor_user_id,actor_role,action,target_type,target_ref,properties)
  values(auth.uid(),actor_role,'feedback_updated','feedback',p_id::text,jsonb_build_object('status',p_status,'priority',p_priority));
end $$;

revoke all on function public.decked_submit_feedback(text,text,integer,text,text,text,text,text,text,text) from public;
revoke all on function public.decked_command_centre_feedback(text,text,text,text,integer,integer) from public,anon;
revoke all on function public.decked_update_feedback(uuid,text,text,text) from public,anon;
grant execute on function public.decked_submit_feedback(text,text,integer,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.decked_command_centre_feedback(text,text,text,text,integer,integer) to authenticated;
grant execute on function public.decked_update_feedback(uuid,text,text,text) to authenticated;

comment on table public.feedback_submissions is 'Player-submitted product feedback. Contact email is optional and visible only to authorized staff.';
