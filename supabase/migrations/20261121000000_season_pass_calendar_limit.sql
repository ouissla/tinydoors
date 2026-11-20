-- Each Season Pass carries its own premium calendar allowance. Paid passes keep 5;
-- an operator can raise it for one account (for example, marketing calendars).
begin;
alter table public.season_passes add column calendar_limit smallint not null default 5 check (calendar_limit between 1 and 1000);
alter table public.season_pass_calendars drop constraint season_pass_calendars_slot_check;
alter table public.season_pass_calendars add constraint season_pass_calendars_slot_check check (slot between 1 and 1000);

create or replace function public.activate_season_calendar(p_owner uuid,p_calendar text) returns jsonb
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
    if used >= pass.calendar_limit then return jsonb_build_object('ok',false,'error','All your premium calendars are used for this Christmas. You can keep editing those calendars or create a free calendar.','code',409); end if;
    insert into public.season_pass_calendars(owner_id,season_year,slot,calendar_id) values(p_owner,pass.season_year,used+1,p_calendar);
  end if;
  insert into public.calendar_entitlements(calendar_id,stripe_checkout_session_id,status,expires_at,pass_owner_id,season_year)
    values(p_calendar,pass.stripe_checkout_session_id,'active',pass.expires_at,p_owner,pass.season_year)
    on conflict(calendar_id) do update set stripe_checkout_session_id=excluded.stripe_checkout_session_id,status='active',expires_at=excluded.expires_at,pass_owner_id=excluded.pass_owner_id,season_year=excluded.season_year;
  return jsonb_build_object('ok',true,'calendarId',p_calendar,'year',pass.season_year);
end $$;
revoke all on function public.activate_season_calendar(uuid,text) from public,anon,authenticated;
grant execute on function public.activate_season_calendar(uuid,text) to service_role;
commit;
