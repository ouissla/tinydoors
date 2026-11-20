-- Run with an administrative database connection. Every fixture is rolled back.
begin;
do $$
declare
  creator uuid := gen_random_uuid(); outsider uuid := gen_random_uuid();
  prefix text := replace(gen_random_uuid()::text,'-','');
  doc jsonb := jsonb_build_object('year',2090,'theme','cyber','days',(select jsonb_agg('{}'::jsonb) from generate_series(1,24)));
  outcome jsonb;
begin
  insert into auth.users(id,email) values(creator,prefix||'@example.invalid'),(outsider,prefix||'other@example.invalid');
  for n in 1..7 loop
    insert into public.calendars(id,owner_id,document) values(prefix||n,creator,doc);
  end loop;
  outcome := public.activate_season_calendar(creator,prefix||1);
  if (outcome->>'code')::int <> 402 then raise exception 'unpaid calendar activated'; end if;
  perform public.fulfill_season_pass('evt_'||prefix,creator,2090,'cs_'||prefix,'pi_'||prefix,false);
  perform public.fulfill_season_pass('evt_'||prefix,creator,2090,'cs_'||prefix,'pi_'||prefix,false);
  if (select count(*) from public.stripe_webhook_events where id='evt_'||prefix)<>1 then raise exception 'duplicate webhook'; end if;
  outcome := public.activate_season_calendar(outsider,prefix||1);
  if (outcome->>'code')::int <> 404 then raise exception 'foreign activation'; end if;
  for n in 1..5 loop
    outcome := public.activate_season_calendar(creator,prefix||n);
    if outcome->>'ok'<>'true' then raise exception 'valid activation rejected %',outcome; end if;
  end loop;
  outcome := public.activate_season_calendar(creator,prefix||1);
  if outcome->>'ok'<>'true' then raise exception 'repeat activation used extra slot'; end if;
  outcome := public.activate_season_calendar(creator,prefix||6);
  if (outcome->>'code')::int<>409 then raise exception 'sixth calendar activated'; end if;
  if (select count(*) from public.calendar_entitlements where pass_owner_id=creator)<>5 then raise exception 'wrong entitlements'; end if;
  delete from public.calendars where id=prefix||5;
  outcome := public.activate_season_calendar(creator,prefix||6);
  if (outcome->>'code')::int<>409 then raise exception 'delete bypassed five calendar limit'; end if;
  -- An operator can raise one account's allowance.
  update public.season_passes set calendar_limit=6 where owner_id=creator and season_year=2090;
  outcome := public.activate_season_calendar(creator,prefix||6);
  if outcome->>'ok'<>'true' then raise exception 'raised limit not honoured %',outcome; end if;
  begin
    update public.calendars set document=jsonb_set(document,'{year}','2091') where id=prefix||1;
    raise exception 'year changed';
  exception when raise_exception then if sqlerrm='year changed' then raise; end if; end;
  -- Unallocated drafts can still be edited and do not use an allowance.
  update public.calendars set document=jsonb_set(document,'{year}','2091') where id=prefix||7;
  outcome := public.activate_season_calendar(creator,prefix||7);
  if (outcome->>'code')::int<>402 then raise exception 'pass crossed seasons'; end if;
  perform public.fulfill_season_pass('refund_'||prefix,creator,2090,'cs_'||prefix,'pi_'||prefix,true);
  if exists(select 1 from public.calendar_entitlements where pass_owner_id=creator and status='active') then raise exception 'refund left calendars active'; end if;
  perform public.fulfill_season_pass('late_'||prefix,creator,2090,'cs_'||prefix,'pi_'||prefix,false);
  if exists(select 1 from public.season_passes where owner_id=creator and status='active') then raise exception 'late event restored refunded pass'; end if;
  if has_function_privilege('authenticated','public.activate_season_calendar(uuid,text)','execute')
    or has_function_privilege('anon','public.fulfill_season_pass(text,uuid,integer,text,text,boolean)','execute')
    or has_table_privilege('authenticated','public.season_passes','insert')
    or has_table_privilege('authenticated','public.season_pass_calendars','update') then raise exception 'browser can forge a pass'; end if;
end $$;
select 'PASS: ownership, five slots, repeat activation, deletion, year changes, refunds, retries, and browser grants' as verification;
rollback;
