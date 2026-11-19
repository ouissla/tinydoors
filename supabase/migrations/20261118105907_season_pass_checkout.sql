begin;
create table public.season_passes (
  owner_id uuid not null references auth.users(id) on delete cascade,
  season_year integer not null check (season_year between 2020 and 2100),
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text not null unique,
  status text not null check (status in ('active', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  primary key (owner_id, season_year)
);
alter table public.season_passes enable row level security;
revoke all on public.season_passes from public, anon, authenticated;
grant select on public.season_passes to authenticated;
create policy "Creators read their Season Pass" on public.season_passes for select to authenticated using (owner_id = (select auth.uid()));

-- Allocation ledger intentionally survives calendar deletion: the pass covers five calendars,
-- not five concurrently existing calendars that can be deleted and replaced indefinitely.
create table public.season_pass_calendars (
  owner_id uuid not null,
  season_year integer not null,
  slot smallint not null check (slot between 1 and 5),
  calendar_id text not null unique,
  activated_at timestamptz not null default now(),
  primary key (owner_id, season_year, slot),
  foreign key (owner_id, season_year) references public.season_passes(owner_id, season_year) on delete cascade
);
alter table public.season_pass_calendars enable row level security;
revoke all on public.season_pass_calendars from public, anon, authenticated;
grant select on public.season_pass_calendars to authenticated;
create policy "Creators read their used calendar slots" on public.season_pass_calendars for select to authenticated using (owner_id = (select auth.uid()));

create table public.season_checkouts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  season_year integer not null check (season_year between 2020 and 2100),
  request_key uuid not null default gen_random_uuid(),
  stripe_session_id text,
  calendar_id text not null,
  lang text not null check (lang in ('en', 'fr')),
  primary key (owner_id, season_year)
);
alter table public.season_checkouts enable row level security;
revoke all on public.season_checkouts from public, anon, authenticated;

alter table public.calendar_entitlements drop constraint calendar_entitlements_stripe_checkout_session_id_key;
create index calendar_entitlements_session_idx on public.calendar_entitlements(stripe_checkout_session_id);
alter table public.calendar_entitlements add column pass_owner_id uuid, add column season_year integer;
alter table public.calendar_entitlements add constraint calendar_entitlement_pass_fkey foreign key (pass_owner_id, season_year) references public.season_passes(owner_id, season_year);
create index calendar_entitlements_pass_idx on public.calendar_entitlements(pass_owner_id, season_year);

create function public.reserve_season_checkout(p_owner uuid, p_year integer, p_calendar text, p_lang text, p_expired_session text default null) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare attempt public.season_checkouts;
begin
  insert into public.season_checkouts(owner_id, season_year, calendar_id, lang) values(p_owner, p_year, p_calendar, p_lang) on conflict do nothing;
  select * into attempt from public.season_checkouts where owner_id=p_owner and season_year=p_year for update;
  if p_expired_session is not null and attempt.stripe_session_id = p_expired_session then
    update public.season_checkouts set request_key=gen_random_uuid(),stripe_session_id=null,calendar_id=p_calendar,lang=p_lang
      where owner_id=p_owner and season_year=p_year returning * into attempt;
  end if;
  return to_jsonb(attempt);
end $$;
revoke all on function public.reserve_season_checkout(uuid,integer,text,text,text) from public,anon,authenticated;
grant execute on function public.reserve_season_checkout(uuid,integer,text,text,text) to service_role;

create function public.fulfill_season_pass(p_event text,p_owner uuid,p_year integer,p_session text,p_payment_intent text,p_revoked boolean) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare current_pass public.season_passes;
begin
  -- Serialize refunds and fulfillment for the account/season, including the initial insert.
  perform pg_advisory_xact_lock(hashtextextended(p_owner::text || ':' || p_year::text, 0));
  select * into current_pass from public.season_passes where owner_id=p_owner and season_year=p_year for update;
  if found and current_pass.stripe_checkout_session_id <> p_session then
    raise exception 'A different checkout already owns this season; review the duplicate payment';
  end if;
  -- Never restore a revoked purchase from a late success event or browser confirmation.
  insert into public.season_passes(owner_id,season_year,stripe_checkout_session_id,stripe_payment_intent_id,status,expires_at)
    values(p_owner,p_year,p_session,p_payment_intent,case when p_revoked then 'revoked' else 'active' end,make_timestamptz(p_year+1,2,1,0,0,0,'UTC'))
    on conflict(owner_id,season_year) do update set status=case when public.season_passes.status='revoked' or p_revoked then 'revoked' else 'active' end;
  update public.calendar_entitlements e set status=p.status,expires_at=p.expires_at
    from public.season_passes p where p.owner_id=p_owner and p.season_year=p_year and e.pass_owner_id=p.owner_id and e.season_year=p.season_year;
  insert into public.stripe_webhook_events(id) values(p_event) on conflict do nothing;
  return jsonb_build_object('ok',true,'year',p_year,'active',(select status='active' and expires_at>now() from public.season_passes where owner_id=p_owner and season_year=p_year));
end $$;
revoke all on function public.fulfill_season_pass(text,uuid,integer,text,text,boolean) from public,anon,authenticated;
grant execute on function public.fulfill_season_pass(text,uuid,integer,text,text,boolean) to service_role;

create function public.activate_season_calendar(p_owner uuid,p_calendar text) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare cal public.calendars; pass public.season_passes; used integer; allocation public.season_pass_calendars;
begin
  select * into cal from public.calendars where id=p_calendar and owner_id=p_owner for update;
  if not found then return jsonb_build_object('ok',false,'error','Calendar not found.','code',404); end if;
  if (cal.document->>'year') !~ '^[0-9]{4}$' then return jsonb_build_object('ok',false,'error','Check the calendar year.','code',400); end if;
  select * into pass from public.season_passes where owner_id=p_owner and season_year=(cal.document->>'year')::integer for update;
  if not found or pass.status <> 'active' or pass.expires_at <= now() then
    return jsonb_build_object('ok',false,'error','Unlock the Season Pass for this Christmas first.','code',402);
  end if;
  select * into allocation from public.season_pass_calendars where calendar_id=p_calendar;
  if found and (allocation.owner_id<>p_owner or allocation.season_year<>pass.season_year) then
    return jsonb_build_object('ok',false,'error','This calendar already belongs to another season.','code',409);
  end if;
  if not found then
    select count(*) into used from public.season_pass_calendars where owner_id=p_owner and season_year=pass.season_year;
    if used >= 5 then return jsonb_build_object('ok',false,'error','All 5 premium calendars are used for this Christmas. You can keep editing those calendars or create a free calendar.','code',409); end if;
    insert into public.season_pass_calendars(owner_id,season_year,slot,calendar_id) values(p_owner,pass.season_year,used+1,p_calendar);
  end if;
  insert into public.calendar_entitlements(calendar_id,stripe_checkout_session_id,status,expires_at,pass_owner_id,season_year)
    values(p_calendar,pass.stripe_checkout_session_id,'active',pass.expires_at,p_owner,pass.season_year)
    on conflict(calendar_id) do update set stripe_checkout_session_id=excluded.stripe_checkout_session_id,status='active',expires_at=excluded.expires_at,pass_owner_id=excluded.pass_owner_id,season_year=excluded.season_year;
  return jsonb_build_object('ok',true,'calendarId',p_calendar,'year',pass.season_year);
end $$;
revoke all on function public.activate_season_calendar(uuid,text) from public,anon,authenticated;
grant execute on function public.activate_season_calendar(uuid,text) to service_role;

-- A client cannot carry an allocated calendar into another Christmas or another account.
create function public.protect_calendar_season() returns trigger language plpgsql security invoker set search_path='' as $$
begin
  if (new.owner_id is distinct from old.owner_id or new.document->>'year' is distinct from old.document->>'year')
     and exists(select 1 from public.calendar_entitlements where calendar_id=old.id and pass_owner_id is not null) then
    raise exception 'A premium calendar stays with its original creator and Christmas season';
  end if;
  return new;
end $$;
create trigger protect_calendar_season before update on public.calendars for each row execute function public.protect_calendar_season();
revoke all on function public.protect_calendar_season() from public,anon,authenticated;
grant all on public.season_passes,public.season_pass_calendars,public.season_checkouts to service_role;
commit;
