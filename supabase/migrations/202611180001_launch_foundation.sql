-- Launch foundation for creator accounts (email magic links are the proposed default).
-- Not applied automatically. Review and apply to the intended Supabase project.
-- The current browser DB adapter must be replaced before these tables are used.
begin;

create table public.calendars (
  id text primary key check (length(id) between 10 and 64),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document jsonb not null check (
    jsonb_typeof(document) = 'object'
    and document ? 'days'
    and jsonb_typeof(document -> 'days') = 'array'
    and jsonb_array_length(document -> 'days') = 24
    and not (document ? 'plan')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index calendars_owner_id_idx on public.calendars(owner_id);
alter table public.calendars enable row level security;
revoke all on public.calendars from anon, authenticated;
grant select, insert, update, delete on public.calendars to authenticated;
create policy "Creators manage their own calendars" on public.calendars
  for all to authenticated using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create function public.touch_calendar_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger touch_calendar_updated_at before update on public.calendars
  for each row execute function public.touch_calendar_updated_at();

-- Plans are separate from editable calendar JSON. Only the verified payment server writes them.
create table public.calendar_entitlements (
  calendar_id text primary key references public.calendars(id) on delete cascade,
  stripe_checkout_session_id text not null unique,
  status text not null check (status in ('active', 'revoked')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.calendar_entitlements enable row level security;
revoke all on public.calendar_entitlements from anon, authenticated;
grant select on public.calendar_entitlements to authenticated;
create policy "Creators read their own entitlement" on public.calendar_entitlements
  for select to authenticated using (
    exists (select 1 from public.calendars c where c.id = calendar_id and c.owner_id = (select auth.uid()))
  );

-- Store only SHA-256 hashes of random recipient tokens. Never expose the creator's edit token.
create table public.calendar_shares (
  token_hash text primary key check (token_hash ~ '^[0-9a-f]{64}$'),
  calendar_id text not null references public.calendars(id) on delete cascade,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index calendar_shares_calendar_id_idx on public.calendar_shares(calendar_id);
alter table public.calendar_shares enable row level security;
revoke all on public.calendar_shares from anon, authenticated;

-- A webhook transaction records this alongside the entitlement update for idempotent fulfillment.
create table public.stripe_webhook_events (
  id text primary key,
  processed_at timestamptz not null default now()
);
alter table public.stripe_webhook_events enable row level security;
revoke all on public.stripe_webhook_events from anon, authenticated;

-- A private bucket. Client object paths must be <auth user UUID>/<random photo ID>.jpg.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('calendar-photos', 'calendar-photos', false, 10485760, array['image/jpeg'])
on conflict (id) do nothing;
do $$ begin
  if exists (select 1 from storage.buckets where id = 'calendar-photos' and public) then
    raise exception 'calendar-photos already exists as a public bucket; review before using it for private photos';
  end if;
end $$;
create policy "Creators upload their own calendar photos" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'calendar-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Creators read their own calendar photos" on storage.objects
  for select to authenticated using (
    bucket_id = 'calendar-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
create policy "Creators delete their own calendar photos" on storage.objects
  for delete to authenticated using (
    bucket_id = 'calendar-photos' and (storage.foldername(name))[1] = (select auth.uid())::text
  );
commit;
