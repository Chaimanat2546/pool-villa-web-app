create type public.blog_post_status as enum ('draft', 'published', 'archived');

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  slug text not null unique,
  title text not null,
  excerpt text,
  cover_image_url text,
  content_json jsonb not null default '{"type":"doc","content":[]}'::jsonb,
  content_text text not null default '',
  status public.blog_post_status not null default 'draft',
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint blog_posts_code_not_blank check (length(btrim(code)) > 0),
  constraint blog_posts_code_trimmed check (code = btrim(code)),
  constraint blog_posts_slug_not_blank check (length(btrim(slug)) > 0),
  constraint blog_posts_slug_trimmed check (slug = btrim(slug)),
  constraint blog_posts_slug_contains_code check (
    right(slug, length('-i.' || code)) = '-i.' || code
  ),
  constraint blog_posts_title_not_blank check (length(btrim(title)) > 0)
);

comment on table public.blog_posts is
  'Medium-style blog posts managed by admins and read by the public when published.';
comment on column public.blog_posts.code is
  'Short unique article code, for example pv001. /blog/pv001 redirects to the canonical slug.';
comment on column public.blog_posts.slug is
  'Canonical URL slug generated from title plus -i.{code}.';
comment on column public.blog_posts.content_json is
  'Structured rich text document, intended as the source of truth for rendering/editing.';
comment on column public.blog_posts.content_text is
  'Plain text extracted from content_json for search and excerpts.';

create index blog_posts_public_lookup_idx
on public.blog_posts (status, published_at desc, created_at desc);

create index blog_posts_code_lookup_idx
on public.blog_posts (code);

create trigger set_blog_posts_updated_at
before update on public.blog_posts
for each row
execute function app_private.set_updated_at();

alter table public.blog_posts enable row level security;

grant select on table public.blog_posts to anon, authenticated;
grant insert, update, delete on table public.blog_posts to authenticated;
grant all on table public.blog_posts to service_role;

create policy "Anyone can read published blog posts"
on public.blog_posts
for select
to anon, authenticated
using (
  status = 'published'
  and (published_at is null or published_at <= now())
);

create policy "Admins can read all blog posts"
on public.blog_posts
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

create policy "Admins can create blog posts"
on public.blog_posts
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

create policy "Admins can update blog posts"
on public.blog_posts
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

create policy "Admins can delete blog posts"
on public.blog_posts
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
  'blog-images',
  'blog-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Anyone can read blog images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'blog-images');

create policy "Admins can upload blog images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'blog-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can update blog images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'blog-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'blog-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);

create policy "Admins can delete blog images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'blog-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
