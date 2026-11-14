-- Recovered from the linked project's Supabase migration history.

-- Server-authoritative Whot. Card locations never enter decked_rooms/game_state.
create table public.decked_whot_games(
  room_id uuid not null references public.decked_rooms(id) on delete cascade,
  epoch integer not null,
  state jsonb not null,
  primary key(room_id,epoch)
);
create table public.decked_whot_mutations(
  room_id uuid not null,
  epoch integer not null,
  mutation_id uuid not null,
  actor_user_id uuid not null references auth.users(id),
  action text not null,
  primary key(room_id,epoch,mutation_id),
  foreign key(room_id,epoch) references public.decked_whot_games(room_id,epoch) on delete cascade
);
alter table public.decked_whot_games enable row level security;
alter table public.decked_whot_mutations enable row level security;
revoke all on public.decked_whot_games,public.decked_whot_mutations from public,anon,authenticated;

create or replace function public.decked_whot_shape(card text) returns text language sql immutable set search_path='' as $$
 select case when card like 'whot-%' then 'whot' else split_part(card,'-',1) end
$$;
create or replace function public.decked_whot_number(card text) returns integer language sql immutable set search_path='' as $$
 select case when card like 'whot-%' then 20 else split_part(card,'-',2)::integer end
$$;
create or replace function public.decked_whot_next(s jsonb,steps integer default 1) returns integer language plpgsql immutable set search_path='' as $$
declare n integer:=jsonb_array_length(s->'players'); i integer:=(s->>'currentPlayerIndex')::integer; moved integer:=0; checked integer:=0; d integer:=coalesce((s->>'direction')::integer,1); uid text;
begin while moved<steps and checked<n*greatest(steps,1)*2 loop i:=(i+d+n)%n; uid:=s->'players'->i->>'id'; if not (s->'finishOrder' ? uid) then moved:=moved+1; end if; checked:=checked+1; end loop; return i; end$$;
create or replace function public.decked_whot_can_play(s jsonb,card text) returns boolean language plpgsql immutable set search_path='' as $$
declare shape text:=public.decked_whot_shape(card); num integer:=public.decked_whot_number(card); top text:=s->'discardPile'->>-1; pending integer:=coalesce((s->>'pendingDraw')::integer,0); stacking text:=s->'rules'->>'stacking';
begin
 if coalesce(s->>'winnerId','')<>'' or coalesce((s->>'awaitingShape')::boolean,false) then return false; end if;
 if pending>0 then
   if shape='whot' then return coalesce((s->'rules'->>'whotCancelsPenalty')::boolean,false); end if;
   if stacking='off' then return false; end if;
   if stacking='same' then return num=coalesce((s->>'pendingKind')::integer,0); end if;
   return num in(2,5);
 end if;
 if shape='whot' then return true; end if;
 if nullif(s->>'requestedShape','') is not null then return shape=s->>'requestedShape'; end if;
 return shape=public.decked_whot_shape(top) or num=public.decked_whot_number(top);
end$$;
create or replace function public.decked_whot_draw_cards(s jsonb,uid text,amount integer) returns jsonb language plpgsql volatile set search_path='' as $$
declare i integer; card text; pile jsonb; discarded jsonb; top text;
begin
 for i in 1..amount loop
  pile:=coalesce(s->'drawPile','[]'::jsonb);
  if jsonb_array_length(pile)=0 then
   discarded:=s->'discardPile'; top:=discarded->>-1;
   select coalesce(jsonb_agg(value order by random()),'[]'::jsonb) into pile from jsonb_array_elements(discarded) with ordinality x(value,pos) where pos<jsonb_array_length(discarded);
   s:=jsonb_set(jsonb_set(s,'{drawPile}',pile),'{discardPile}',jsonb_build_array(top));
  end if;
  pile:=s->'drawPile'; exit when jsonb_array_length(pile)=0; card:=pile->>-1;
  s:=jsonb_set(s,'{drawPile}',pile-(-1));
  s:=jsonb_set(s,array['hands',uid],coalesce(s->'hands'->uid,'[]'::jsonb)||to_jsonb(card),true);
 end loop; return s;
end$$;
create or replace function public.decked_whot_advance(s jsonb,steps integer default 1,msg text default null) returns jsonb language plpgsql immutable set search_path='' as $$
declare idx integer:=public.decked_whot_next(s,steps); name text:=s->'players'->idx->>'name';
begin s:=jsonb_set(s,'{currentPlayerIndex}',to_jsonb(idx)); s:=jsonb_set(s,'{turn}',to_jsonb((s->>'turn')::integer+1)); return jsonb_set(s,'{message}',to_jsonb(coalesce(msg,name||'''s turn'))); end$$;
create or replace function public.decked_whot_finish(s jsonb,uid text) returns jsonb language plpgsql immutable set search_path='' as $$
declare finish jsonb:=coalesce(s->'finishOrder','[]'::jsonb)||to_jsonb(uid); remaining text[]; idx integer;
begin
 if s->'rules'->>'finishMode'='first-out' then return jsonb_set(jsonb_set(s,'{winnerId}',to_jsonb(uid)),'{finishOrder}',jsonb_build_array(uid)); end if;
 s:=jsonb_set(s,'{finishOrder}',finish);
 select array_agg(p->>'id') into remaining from jsonb_array_elements(s->'players') p where not (finish ? (p->>'id'));
 if coalesce(array_length(remaining,1),0)<=1 then s:=jsonb_set(s,'{winnerId}',to_jsonb(finish->>0)); if array_length(remaining,1)=1 then s:=jsonb_set(s,'{finishOrder}',finish||to_jsonb(remaining[1])); end if; return s; end if;
 return public.decked_whot_advance(s,1,'Player finished');
end$$;

create or replace function public.decked_start_whot(p_room_id uuid,p_rules jsonb) returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; players jsonb; hands jsonb:='{}'; deck jsonb; discard jsonb:='[]'; card text; uid text; count integer; i integer; action boolean;
begin
 target:=public.decked_assert_secure_room(p_room_id); if target.game_id<>'whot' or target.host_user_id<>auth.uid() then raise exception 'Only the Whot host can deal.'; end if;
 count:=coalesce((p_rules->>'startingCards')::integer,6); if count < (case when coalesce((p_rules->>'lastCardCall')::boolean,true) then 2 else 1 end) then raise exception 'Invalid starting-card count.'; end if;
 select jsonb_agg(jsonb_build_object('id',user_id,'name',display_name,'color',color) order by position),jsonb_object_agg(user_id::text,'[]'::jsonb) into players,hands from public.decked_room_players where room_id=target.id;
 if jsonb_array_length(players)<2 or count*jsonb_array_length(players)>=54 then raise exception 'Invalid Whot player or card count.'; end if;
 with cards(card_id) as (select unnest(array['circle-1','circle-2','circle-3','circle-4','circle-5','circle-7','circle-8','circle-10','circle-11','circle-12','circle-13','circle-14','triangle-1','triangle-2','triangle-3','triangle-4','triangle-5','triangle-7','triangle-8','triangle-10','triangle-11','triangle-12','triangle-13','triangle-14','cross-1','cross-2','cross-3','cross-5','cross-7','cross-10','cross-11','cross-13','cross-14','square-1','square-2','square-3','square-5','square-7','square-10','square-11','square-13','square-14','star-1','star-2','star-3','star-4','star-5','star-7','star-8','whot-20-1','whot-20-2','whot-20-3','whot-20-4','whot-20-5'])) select jsonb_agg(card_id order by random()) into deck from cards;
 for i in 1..count loop for uid in select p->>'id' from jsonb_array_elements(players) p loop card:=deck->>-1; deck:=deck-(-1); hands:=jsonb_set(hands,array[uid],hands->uid||to_jsonb(card)); end loop; end loop;
 loop card:=deck->>-1; deck:=deck-(-1); action:=public.decked_whot_shape(card)='whot' or (public.decked_whot_number(card)=1 and coalesce((p_rules->>'holdOn')::boolean,true)) or (public.decked_whot_number(card)=2 and coalesce((p_rules->>'pickTwo')::boolean,true)) or (public.decked_whot_number(card)=5 and coalesce((p_rules->>'pickThree')::boolean,true)) or (public.decked_whot_number(card)=8 and coalesce((p_rules->>'suspension')::boolean,true)) or (public.decked_whot_number(card)=14 and coalesce((p_rules->>'generalMarket')::boolean,true)); exit when not action; deck:=to_jsonb(card)||deck; end loop;
 discard:=jsonb_build_array(card);
 insert into public.decked_whot_games values(target.id,target.private_state_epoch,jsonb_build_object('players',players,'hands',hands,'drawPile',deck,'discardPile',discard,'currentPlayerIndex',0,'direction',1,'requestedShape',null,'pendingDraw',0,'pendingKind',null,'awaitingShape',false,'lastCardDeclared','{}'::jsonb,'winnerId',null,'finishOrder','[]'::jsonb,'turn',1,'message',(players->0->>'name')||' starts','rules',p_rules)) on conflict(room_id,epoch) do update set state=excluded.state;
 update public.decked_rooms set game_state=jsonb_set(game_state,'{session,step}','"game"'::jsonb,true),version=version+1 where id=target.id;
end$$;

create or replace function public.decked_get_whot_state(p_room_id uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare target public.decked_rooms; s jsonb; uid text:=auth.uid()::text; counts jsonb;
begin target:=public.decked_assert_secure_room(p_room_id); if target.game_id<>'whot' then raise exception 'Wrong game.'; end if; select state into s from public.decked_whot_games where room_id=target.id and epoch=target.private_state_epoch; if s is null then return null; end if;
 select jsonb_object_agg(key,jsonb_array_length(value)) into counts from jsonb_each(s->'hands');
 return (s-'hands'-'drawPile')||jsonb_build_object('hand',coalesce(s->'hands'->uid,'[]'::jsonb),'handCounts',counts,'drawCount',jsonb_array_length(s->'drawPile'));
end$$;

create or replace function public.decked_whot_action(p_room_id uuid,p_action text,p_card_id text default null,p_shape text default null,p_mutation_id uuid default gen_random_uuid()) returns void language plpgsql security definer set search_path='' as $$
declare target public.decked_rooms; g public.decked_whot_games; s jsonb; uid text:=auth.uid()::text; active text; hand jsonb; remaining jsonb; card text; num integer; shape text; called boolean; count integer; idx integer; other text; canfinish boolean; had_pending boolean; drawn text; has_playable boolean;
begin
 target:=public.decked_assert_secure_room(p_room_id); if target.game_id<>'whot' then raise exception 'Wrong game.'; end if;
 select * into g from public.decked_whot_games where room_id=target.id and epoch=target.private_state_epoch for update; if g.room_id is null then raise exception 'Whot game not found.'; end if; s:=g.state;
 insert into public.decked_whot_mutations values(target.id,target.private_state_epoch,p_mutation_id,auth.uid(),p_action) on conflict do nothing;
 if not found then return; end if;
 if nullif(s->>'winnerId','') is not null then raise exception 'Game is complete.'; end if; active:=s->'players'->((s->>'currentPlayerIndex')::integer)->>'id'; if active<>uid then raise exception 'Not your turn.'; end if; hand:=s->'hands'->uid;
 if p_action='declare' then if jsonb_array_length(hand) not between 1 and 2 then raise exception 'Last card cannot be declared now.'; end if; s:=jsonb_set(s,array['lastCardDeclared',uid],'true'::jsonb,true);
 elsif p_action='shape' then if not coalesce((s->>'awaitingShape')::boolean,false) or p_shape not in('circle','triangle','cross','square','star') then raise exception 'Shape cannot be chosen now.'; end if; s:=jsonb_set(jsonb_set(s,'{awaitingShape}','false'),'{requestedShape}',to_jsonb(p_shape));
   canfinish:=jsonb_array_length(hand)=0 and (not coalesce((s->'rules'->>'lastCardCall')::boolean,true) or coalesce((s->'lastCardDeclared'->>uid)::boolean,false)); if canfinish then s:=public.decked_whot_finish(s,uid); else s:=public.decked_whot_advance(s,1,upper(p_shape)||' was called'); end if;
 elsif p_action='draw' then
   if coalesce((s->>'awaitingShape')::boolean,false) then raise exception 'Choose a shape first.'; end if;
   had_pending:=coalesce((s->>'pendingDraw')::integer,0)>0;
   count:=greatest(coalesce((s->>'pendingDraw')::integer,0),1);
   s:=public.decked_whot_draw_cards(s,uid,count);
   s:=jsonb_set(jsonb_set(s,'{pendingDraw}','0'),'{pendingKind}','null');
   if not had_pending and s->'rules'->>'drawMode'='until-playable' then
     loop
       select coalesce(bool_or(public.decked_whot_can_play(s,value#>>'{}')),false) into has_playable
       from jsonb_array_elements(s->'hands'->uid) cards(value);
       exit when has_playable or jsonb_array_length(s->'drawPile')=0;
       s:=public.decked_whot_draw_cards(s,uid,1); count:=count+1;
     end loop;
   end if;
   if not had_pending and coalesce((s->'rules'->>'playDrawnCard')::boolean,false) then
     drawn:=s->'hands'->uid->>-1;
     if drawn is not null and public.decked_whot_can_play(s,drawn) then
       s:=jsonb_set(s,'{message}',to_jsonb('Player may play the drawn card'));
     else s:=public.decked_whot_advance(s,1,'Player picked '||count); end if;
   else s:=public.decked_whot_advance(s,1,'Player picked '||count); end if;
 elsif p_action='play' then
   if coalesce((s->>'awaitingShape')::boolean,false) or not (hand ? p_card_id) or not public.decked_whot_can_play(s,p_card_id) then raise exception 'Card cannot be played.'; end if;
   card:=p_card_id; shape:=public.decked_whot_shape(card); num:=public.decked_whot_number(card); select coalesce(jsonb_agg(value),'[]'::jsonb) into remaining from jsonb_array_elements(hand) value where value<>to_jsonb(card); called:=coalesce((s->'lastCardDeclared'->>uid)::boolean,false);
   s:=jsonb_set(s,array['hands',uid],remaining); s:=jsonb_set(s,'{discardPile}',s->'discardPile'||to_jsonb(card)); s:=jsonb_set(s,'{requestedShape}','null'); s:=jsonb_set(s,array['lastCardDeclared',uid],to_jsonb(case when jsonb_array_length(remaining)<=1 then called else false end),true);
   if coalesce((s->'rules'->>'lastCardCall')::boolean,true) and jsonb_array_length(remaining)<=1 and not called then count:=coalesce((s->'rules'->>'missedCallPenalty')::integer,2); s:=public.decked_whot_draw_cards(s,uid,count); end if;
   canfinish:=jsonb_array_length(remaining)=0 and (not coalesce((s->'rules'->>'lastCardCall')::boolean,true) or called);
   if canfinish and shape<>'whot' then s:=public.decked_whot_finish(s,uid);
   elsif shape='whot' then s:=jsonb_set(s,'{awaitingShape}','true'); if coalesce((g.state->>'pendingDraw')::integer,0)>0 and coalesce((s->'rules'->>'whotCancelsPenalty')::boolean,false) then s:=jsonb_set(jsonb_set(s,'{pendingDraw}','0'),'{pendingKind}','null'); end if;
   elsif num=2 and coalesce((s->'rules'->>'pickTwo')::boolean,true) then count:=coalesce((g.state->>'pendingDraw')::integer,0)+2; s:=jsonb_set(jsonb_set(s,'{pendingDraw}',to_jsonb(count)),'{pendingKind}','2'); s:=public.decked_whot_advance(s,1,'Pick '||count||' or defend with a 2');
   elsif num=5 and coalesce((s->'rules'->>'pickThree')::boolean,true) then count:=coalesce((g.state->>'pendingDraw')::integer,0)+3; s:=jsonb_set(jsonb_set(s,'{pendingDraw}',to_jsonb(count)),'{pendingKind}','5'); s:=public.decked_whot_advance(s,1,'Pick '||count||' or defend with a 5');
   elsif num=1 and coalesce((s->'rules'->>'holdOn')::boolean,true) then s:=jsonb_set(s,'{turn}',to_jsonb((s->>'turn')::integer+1));
   elsif num=8 and coalesce((s->'rules'->>'suspension')::boolean,true) then s:=jsonb_set(s,'{turn}',to_jsonb((s->>'turn')::integer+1));
   elsif num=14 and coalesce((s->'rules'->>'generalMarket')::boolean,true) then for other in select p->>'id' from jsonb_array_elements(s->'players') p where p->>'id'<>uid loop s:=public.decked_whot_draw_cards(s,other,1); end loop; s:=jsonb_set(s,'{turn}',to_jsonb((s->>'turn')::integer+1));
   else s:=public.decked_whot_advance(s,1,null); end if;
 else raise exception 'Unknown Whot action.'; end if;
 update public.decked_whot_games set state=s where room_id=target.id and epoch=target.private_state_epoch; update public.decked_rooms set version=version+1 where id=target.id;
end$$;

revoke all on function public.decked_whot_shape(text),public.decked_whot_number(text),public.decked_whot_next(jsonb,integer),public.decked_whot_can_play(jsonb,text),public.decked_whot_draw_cards(jsonb,text,integer),public.decked_whot_advance(jsonb,integer,text),public.decked_whot_finish(jsonb,text),public.decked_start_whot(uuid,jsonb),public.decked_get_whot_state(uuid),public.decked_whot_action(uuid,text,text,text,uuid) from public,anon;
grant execute on function public.decked_start_whot(uuid,jsonb),public.decked_get_whot_state(uuid),public.decked_whot_action(uuid,text,text,text,uuid) to authenticated;
