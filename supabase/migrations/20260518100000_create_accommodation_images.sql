create type public.accommodation_image_category as enum (
  'cover',
  'exterior',
  'interior',
  'review',
  'kitchen',
  'bathroom',
  'bedroom'
);

create table public.accommodation_images (
  id uuid primary key default gen_random_uuid(),
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  category public.accommodation_image_category not null,
  storage_path text not null,
  public_url text not null,
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accommodation_images_storage_path_not_blank
    check (length(btrim(storage_path)) > 0),
  constraint accommodation_images_storage_path_trimmed
    check (storage_path = btrim(storage_path)),
  constraint accommodation_images_public_url_not_blank
    check (length(btrim(public_url)) > 0),
  constraint accommodation_images_public_url_trimmed
    check (public_url = btrim(public_url)),
  constraint accommodation_images_alt_text_trimmed
    check (alt_text is null or alt_text = btrim(alt_text)),
  constraint accommodation_images_sort_order_non_negative
    check (sort_order >= 0)
);

comment on table public.accommodation_images is
  'Images for internal accommodations, grouped by gallery category. Cover is limited to one image per accommodation.';
comment on column public.accommodation_images.category is
  'cover = main card/detail image; exterior/interior/review/kitchen/bathroom/bedroom = gallery groups.';
comment on column public.accommodation_images.storage_path is
  'Object path inside the accommodation-images Supabase Storage bucket.';
comment on column public.accommodation_images.public_url is
  'Public delivery URL generated from the accommodation-images bucket.';

create unique index accommodation_images_cover_unique_idx
on public.accommodation_images (accommodation_id)
where category = 'cover';

create unique index accommodation_images_storage_path_unique_idx
on public.accommodation_images (storage_path);

create index accommodation_images_accommodation_id_idx
on public.accommodation_images (accommodation_id);

create index accommodation_images_category_order_idx
on public.accommodation_images (accommodation_id, category, sort_order, created_at);

create trigger set_accommodation_images_updated_at
before update on public.accommodation_images
for each row
execute function app_private.set_updated_at();

alter table public.accommodation_images enable row level security;

grant select on table public.accommodation_images
to anon, authenticated;

grant select, insert, update, delete on table public.accommodation_images
to authenticated;

grant all on table public.accommodation_images
to service_role;

create policy "Anyone can read published accommodation images"
on public.accommodation_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.accommodations
    where accommodations.id = accommodation_images.accommodation_id
      and accommodations.status = 'published'
  )
);

create policy "Admins can read accommodation images"
on public.accommodation_images
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

create policy "Admins can create accommodation images"
on public.accommodation_images
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

create policy "Admins can update accommodation images"
on public.accommodation_images
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

create policy "Admins can delete accommodation images"
on public.accommodation_images
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

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'accommodation-images',
  'accommodation-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can read accommodation images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'accommodation-images');

create policy "Admins can upload accommodation images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'accommodation-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update accommodation images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'accommodation-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'accommodation-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete accommodation images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'accommodation-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
