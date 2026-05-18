create type public.accommodation_recommendation_status as enum ('visible', 'hidden');

create table public.accommodation_recommendations (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  starts_at date not null,
  ends_at date,
  status public.accommodation_recommendation_status not null default 'hidden',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_recommendations_valid_date_range check (ends_at is null or ends_at >= starts_at)
);

comment on table public.accommodation_recommendations is
  'Paid accommodation recommendation placements managed by admins for internal inventory.';
comment on column public.accommodation_recommendations.status is
  'visible = public recommendation, hidden = draft/inactive recommendation.';

-- อนุญาตให้แสดงผลแบบ visible ได้ 1 รายการต่อบ้านเท่านั้น
create unique index accommodation_recommendations_one_visible_per_house_idx
on public.accommodation_recommendations (accommodation_id)
where status = 'visible';

create index accommodation_recommendations_public_lookup_idx
on public.accommodation_recommendations (status, starts_at, ends_at, accommodation_id);

create index accommodation_recommendations_admin_lookup_idx
on public.accommodation_recommendations (accommodation_id, status, starts_at desc);

create trigger set_accommodation_recommendations_updated_at
before update on public.accommodation_recommendations
for each row
execute function app_private.set_updated_at();

alter table public.accommodation_recommendations enable row level security;

grant select on table public.accommodation_recommendations to anon, authenticated;
grant insert, update, delete on table public.accommodation_recommendations to authenticated;
grant all on table public.accommodation_recommendations to service_role;

create policy "Anyone can read active visible accommodation recommendations"
on public.accommodation_recommendations
for select
to anon, authenticated
using (
  status = 'visible'
  and starts_at <= current_date
  and (ends_at is null or ends_at >= current_date)
);

create policy "Admins can read all accommodation recommendations"
on public.accommodation_recommendations
for select
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can create accommodation recommendations"
on public.accommodation_recommendations
for insert
to authenticated
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodation recommendations"
on public.accommodation_recommendations
for update
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodation recommendations"
on public.accommodation_recommendations
for delete
to authenticated
using (
  exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);