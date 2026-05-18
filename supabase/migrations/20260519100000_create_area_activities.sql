create type public.area_activity_status as enum ('visible', 'hidden');

create table public.area_activities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at date not null,
  ends_at date,
  status public.area_activity_status not null default 'hidden',
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint area_activities_title_not_blank check (length(btrim(title)) > 0),
  constraint area_activities_title_trimmed check (title = btrim(title)),
  constraint area_activities_valid_date_range check (ends_at is null or ends_at >= starts_at)
);

create table public.area_activity_areas (
  activity_id uuid not null references public.area_activities(id) on delete cascade,
  area_id uuid not null references public.accommodation_areas(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (activity_id, area_id)
);

create table public.area_activity_images (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null references public.area_activities(id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint area_activity_images_storage_path_not_blank check (length(btrim(storage_path)) > 0),
  constraint area_activity_images_storage_path_trimmed check (storage_path = btrim(storage_path)),
  constraint area_activity_images_public_url_not_blank check (length(btrim(public_url)) > 0),
  constraint area_activity_images_public_url_trimmed check (public_url = btrim(public_url)),
  constraint area_activity_images_alt_text_trimmed check (alt_text is null or alt_text = btrim(alt_text)),
  constraint area_activity_images_sort_order_non_negative check (sort_order >= 0),
  constraint area_activity_images_sort_order_max_two check (sort_order <= 1)
);

comment on table public.area_activities is
  'Admin-managed tourism activity recommendations for internal house detail pages.';

comment on column public.area_activities.status is
  'visible = public activity, hidden = draft/inactive activity.';

comment on column public.area_activities.ends_at is
  'Activity expiration date. Null means the activity does not expire.';

comment on table public.area_activity_areas is
  'Many-to-many links between activities and accommodation areas.';

comment on table public.area_activity_images is
  'Up to two images for each area activity.';

create unique index area_activity_images_activity_sort_order_unique_idx
on public.area_activity_images (activity_id, sort_order);

create unique index area_activity_images_storage_path_unique_idx
on public.area_activity_images (storage_path);

create index area_activities_public_lookup_idx
on public.area_activities (status, starts_at, ends_at, created_at desc);

create index area_activity_areas_area_activity_idx
on public.area_activity_areas (area_id, activity_id);

create index area_activity_areas_activity_idx
on public.area_activity_areas (activity_id);

create index area_activity_images_activity_order_idx
on public.area_activity_images (activity_id, sort_order, created_at);

create trigger set_area_activities_updated_at
before update on public.area_activities
for each row
execute function app_private.set_updated_at();

create trigger set_area_activity_images_updated_at
before update on public.area_activity_images
for each row
execute function app_private.set_updated_at();

alter table public.area_activities enable row level security;
alter table public.area_activity_areas enable row level security;
alter table public.area_activity_images enable row level security;

grant select on table public.area_activities, public.area_activity_areas, public.area_activity_images
to anon, authenticated;

grant insert, update, delete on table public.area_activities, public.area_activity_areas, public.area_activity_images
to authenticated;

grant all on table public.area_activities, public.area_activity_areas, public.area_activity_images
to service_role;

create policy "Anyone can read active visible area activities"
on public.area_activities
for select
to anon, authenticated
using (
  status = 'visible'
  and starts_at <= current_date
  and (ends_at is null or ends_at >= current_date)
);

create policy "Anyone can read public area activity links"
on public.area_activity_areas
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.area_activities
    where area_activities.id = area_activity_areas.activity_id
      and area_activities.status = 'visible'
      and area_activities.starts_at <= current_date
      and (area_activities.ends_at is null or area_activities.ends_at >= current_date)
  )
);

create policy "Anyone can read public area activity images"
on public.area_activity_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.area_activities
    where area_activities.id = area_activity_images.activity_id
      and area_activities.status = 'visible'
      and area_activities.starts_at <= current_date
      and (area_activities.ends_at is null or area_activities.ends_at >= current_date)
  )
);

create policy "Admins can read all area activities"
on public.area_activities
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

create policy "Admins can manage area activities"
on public.area_activities
for all
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

create policy "Admins can manage area activity links"
on public.area_activity_areas
for all
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

create policy "Admins can manage area activity images"
on public.area_activity_images
for all
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

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'area-activity-images',
  'area-activity-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can read area activity images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'area-activity-images');

create policy "Admins can upload area activity images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'area-activity-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update area activity images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'area-activity-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'area-activity-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete area activity images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'area-activity-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
