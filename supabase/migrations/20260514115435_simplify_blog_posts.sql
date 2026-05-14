drop policy if exists "Anyone can read published blog posts" on public.blog_posts;

drop index if exists public.blog_posts_public_lookup_idx;

alter table public.blog_posts
drop column if exists status,
drop column if exists published_at;

drop type if exists public.blog_post_status;

create index blog_posts_public_lookup_idx
on public.blog_posts (created_at desc);

create policy "Anyone can read blog posts"
on public.blog_posts
for select
to anon, authenticated
using (true);
