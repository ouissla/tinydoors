-- Support short calendars and private recorded clips. Existing ownership policies are unchanged.
begin;
alter table public.calendars drop constraint calendars_document_check;
alter table public.calendars add constraint calendars_document_check check (
  jsonb_typeof(document) = 'object'
  and document ? 'days'
  and jsonb_typeof(document -> 'days') = 'array'
  and jsonb_array_length(document -> 'days') in (12, 24)
  and (not (document ? 'schedule') or document ->> 'schedule' in ('daily', 'alternate'))
  and not (document ? 'plan')
);
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'video/webm', 'video/mp4']
where id = 'calendar-photos';
commit;
