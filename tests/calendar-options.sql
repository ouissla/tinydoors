-- Run against a disposable database after the calendar_schedules_and_video migration.
begin;
do $$
declare d12 jsonb := (select jsonb_agg('{}'::jsonb) from generate_series(1,12));
        d13 jsonb := (select jsonb_agg('{}'::jsonb) from generate_series(1,13));
begin
  insert into public.calendars(id,document) values ('short-daily',jsonb_build_object('days',d12,'schedule','daily'));
  insert into public.calendars(id,document) values ('short-alternate',jsonb_build_object('days',d12,'schedule','alternate'));
  begin
    insert into public.calendars(id,document) values ('invalid-count',jsonb_build_object('days',d13));
    raise exception '13 doors should have been rejected';
  exception when check_violation then null;
  end;
  begin
    insert into public.calendars(id,document) values ('invalid-schedule',jsonb_build_object('days',d12,'schedule','anything'));
    raise exception 'invalid schedule should have been rejected';
  exception when check_violation then null;
  end;
  begin
    insert into public.calendars(id,document) values ('forged-plan',jsonb_build_object('days',d12,'plan','season'));
    raise exception 'editable plan should have been rejected';
  exception when check_violation then null;
  end;
  if not exists(select 1 from storage.buckets where id='calendar-photos' and allowed_mime_types @> array['image/jpeg','video/webm','video/mp4']) then
    raise exception 'Video formats missing';
  end if;
end $$;
rollback;
