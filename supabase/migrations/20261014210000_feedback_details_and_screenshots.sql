-- Structured feedback categories and private screenshot attachments.

alter table public.feedback_submissions
  add column if not exists issue_categories text[] not null default '{}',
  add column if not exists screenshot_path text;

alter table public.feedback_submissions
  add constraint feedback_submissions_issue_categories_check
  check (issue_categories <@ array['bug','confusing','slow','multiplayer','game_content','visual','accessibility','other']::text[]);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('feedback-screenshots','feedback-screenshots',false,5242880,array['image/png','image/jpeg','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy "Players upload their feedback screenshots"
on storage.objects for insert to authenticated
with check(bucket_id='feedback-screenshots' and (storage.foldername(name))[1]=auth.uid()::text);

create policy "Staff read feedback screenshots"
on storage.objects for select to authenticated
using(bucket_id='feedback-screenshots' and public.decked_is_command_centre_staff('viewer'));

drop function if exists public.decked_submit_feedback(text,text,integer,text,text,text,text,text,text,text);
create function public.decked_submit_feedback(
  p_feedback_type text,
  p_issue_categories text[],
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
    or not coalesce(p_issue_categories,'{}') <@ array['bug','confusing','slow','multiplayer','game_content','visual','accessibility','other']::text[]
    or p_source not in ('header','footer','game_menu','game_complete','feedback_page')
    or p_device_class not in ('mobile','tablet','desktop','unknown')
    or (p_play_mode is not null and p_play_mode not in ('pass_and_play','play_together'))
    or (p_rating is not null and p_rating not between 1 and 5)
    or char_length(btrim(coalesce(p_message,''))) not between 3 and 2000
    or char_length(coalesce(p_page_path,'')) not between 1 and 500
    or (p_contact_email is not null and (char_length(p_contact_email)>254 or p_contact_email !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'))
  then raise exception 'Invalid feedback submission.' using errcode='22023'; end if;
  if (select count(*) from public.feedback_submissions where submitter_user_id=auth.uid() and created_at>now()-interval '1 hour') >= 5
  then raise exception 'Please wait before sending more feedback.' using errcode='42900'; end if;
  insert into public.feedback_submissions(submitter_user_id,feedback_type,issue_categories,game_id,rating,message,contact_email,source,page_path,play_mode,device_class)
  values(auth.uid(),p_feedback_type,coalesce(p_issue_categories,'{}'),nullif(btrim(p_game_id),''),p_rating,btrim(p_message),nullif(btrim(p_contact_email),''),p_source,p_page_path,p_play_mode,p_device_class)
  returning id into feedback_id;
  return feedback_id;
end $$;

create function public.decked_attach_feedback_screenshot(p_feedback_id uuid,p_storage_path text)
returns void language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is null or p_storage_path !~ ('^'||auth.uid()::text||'/'||p_feedback_id::text||'/[A-Za-z0-9-]+\.(png|jpg|jpeg|webp)$')
  then raise exception 'Invalid feedback attachment.' using errcode='22023'; end if;
  update public.feedback_submissions set screenshot_path=p_storage_path
  where id=p_feedback_id and submitter_user_id=auth.uid() and screenshot_path is null;
  if not found then raise exception 'Feedback submission not found.' using errcode='P0002'; end if;
end $$;

create or replace function public.decked_command_centre_feedback(p_status text default null,p_type text default null,p_game_id text default null,p_query text default null,p_limit integer default 100,p_offset integer default 0)
returns jsonb language plpgsql stable security definer set search_path='' as $$
declare result jsonb;
begin
  if not public.decked_is_command_centre_staff('viewer') then raise exception 'Command Centre staff access is required.' using errcode='42501'; end if;
  if p_limit not between 1 and 200 or p_offset<0 then raise exception 'Invalid pagination.' using errcode='22023'; end if;
  with rows as (
    select id,created_at,feedback_type,issue_categories,game_id,rating,message,contact_email,source,page_path,play_mode,device_class,screenshot_path,status,priority,internal_notes,reviewed_at,count(*) over() total_count
    from public.feedback_submissions
    where (p_status is null or status=p_status) and (p_type is null or feedback_type=p_type) and (p_game_id is null or game_id=p_game_id)
      and (p_query is null or btrim(p_query)='' or message ilike '%'||replace(replace(btrim(p_query),'%','\%'),'_','\_')||'%' escape '\')
    order by created_at desc limit p_limit offset p_offset
  ) select jsonb_build_object('rows',coalesce(jsonb_agg(to_jsonb(rows)-'total_count' order by created_at desc),'[]'::jsonb),'total',coalesce(max(total_count),0)) into result from rows;
  return result;
end $$;

revoke all on function public.decked_submit_feedback(text,text[],text,integer,text,text,text,text,text,text,text) from public;
revoke all on function public.decked_attach_feedback_screenshot(uuid,text) from public;
grant execute on function public.decked_submit_feedback(text,text[],text,integer,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.decked_attach_feedback_screenshot(uuid,text) to authenticated;

comment on column public.feedback_submissions.issue_categories is 'Optional structured issue categories selected by the player.';
comment on column public.feedback_submissions.screenshot_path is 'Private storage path for an optional feedback screenshot.';
