-- Run after all repository migrations against an isolated database.
begin;
do $$
declare
  known_id uuid := gen_random_uuid();
  unknown_id uuid := gen_random_uuid();
  rejected boolean;
begin
  insert into public.content_items(id,game_id,item_kind) values
    (known_id,'spelling-bee','prompt'),
    (unknown_id,'spelling-bee','prompt');
  insert into public.content_item_categories(item_id,game_id,category_id) values
    (known_id,'spelling-bee','level-1'),
    (unknown_id,'spelling-bee','level-1');
  insert into public.content_item_versions(item_id,version,body,normalized_body,metadata) values
    (known_id,1,'lantern','lantern','{"level":1,"definition":"A portable light with a protective case.","sentence":"We carried a lantern into the garden.","variants":[],"review_status":"needs_review"}'),
    (unknown_id,1,'unrecorded','unrecorded','{"level":1,"definition":"A word with no recorded audio.","sentence":"The unrecorded word needs a voice clip.","variants":[],"review_status":"approved"}');

  rejected := false;
  begin
    update public.content_items set published_version=1 where id=known_id;
  exception when sqlstate '22023' then rejected := true;
  end;
  if not rejected then raise exception 'Unreviewed word was published'; end if;

  update public.content_item_versions
    set metadata=jsonb_set(metadata,'{review_status}','"approved"')
    where item_id=known_id;
  update public.content_items set published_version=1 where id=known_id;
  if not exists(select 1 from public.content_items where id=known_id and published_version=1)
    then raise exception 'Approved audio-backed word was rejected'; end if;

  rejected := false;
  begin
    update public.content_items set published_version=1 where id=unknown_id;
  exception when sqlstate '22023' then rejected := true;
  end;
  if not rejected then raise exception 'Audio-less word was published'; end if;
end $$;
rollback;
