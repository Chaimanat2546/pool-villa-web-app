create type public.house_recommendation_status as enum ('visible', 'hidden');

create table public.house_recommendations (
  id uuid primary key default gen_random_uuid(),
  h_id text not null,
  starts_at date not null,
  ends_at date not null,
  status public.house_recommendation_status not null default 'hidden',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint house_recommendations_h_id_not_blank check (length(btrim(h_id)) > 0),
  constraint house_recommendations_h_id_trimmed check (h_id = btrim(h_id)),
  constraint house_recommendations_valid_date_range check (ends_at >= starts_at)
);

comment on table public.house_recommendations is
  'Paid house recommendation placements managed by admins.';
comment on column public.house_recommendations.h_id is
  'External house id from getHouse_deville.json.';
comment on column public.house_recommendations.status is
  'visible = public recommendation, hidden = draft/inactive recommendation.';

create unique index house_recommendations_one_visible_per_house_idx
on public.house_recommendations (h_id)
where status = 'visible';

create index house_recommendations_public_lookup_idx
on public.house_recommendations (status, starts_at, ends_at, h_id);

create index house_recommendations_admin_lookup_idx
on public.house_recommendations (h_id, status, starts_at desc);

create trigger set_house_recommendations_updated_at
before update on public.house_recommendations
for each row
execute function app_private.set_updated_at();

alter table public.house_recommendations enable row level security;

grant select on table public.house_recommendations to anon, authenticated;
grant insert, update, delete on table public.house_recommendations to authenticated;
grant all on table public.house_recommendations to service_role;

create policy "Anyone can read active visible house recommendations"
on public.house_recommendations
for select
to anon, authenticated
using (
  status = 'visible'
  and starts_at <= current_date
  and ends_at >= current_date
);

create policy "Admins can read all house recommendations"
on public.house_recommendations
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

create policy "Admins can create house recommendations"
on public.house_recommendations
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

create policy "Admins can update house recommendations"
on public.house_recommendations
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

create policy "Admins can delete house recommendations"
on public.house_recommendations
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
