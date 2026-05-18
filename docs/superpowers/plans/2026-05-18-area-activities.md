# Area Activities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin-managed `area-activities` system that displays active area-matched activities on internal house detail pages.

**Architecture:** Add a new Supabase-backed domain in `lib/area-activities.ts`, keep API routes thin, and render public activities from server-loaded first-page data plus a public pagination endpoint on `/houses/[id]`. Admin UI manages activities, area links, and up to two images through admin-only API routes.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Supabase SSR, Supabase Postgres/RLS/Storage.

---

## File Structure

- Create: `supabase/migrations/20260519100000_create_area_activities.sql`
  - Defines enum, tables, indexes, triggers, RLS policies, grants, and `area-activity-images` bucket.
- Create: `lib/area-activities.ts`
  - Owns types, validation, Supabase row mapping, public/admin reads, mutations, image metadata helpers, and API serializers.
- Create: `app/api/admin/area-activities/route.ts`
  - Admin list and create endpoint.
- Create: `app/api/admin/area-activities/[id]/route.ts`
  - Admin update and delete endpoint.
- Create: `app/api/admin/area-activities/[id]/images/route.ts`
  - Admin upload and delete image endpoint.
- Create: `app/api/area-activities/route.ts`
  - Public paginated read endpoint for client-side pagination on internal house detail pages.
- Create: `app/(protected)/admin/area-activities/page.tsx`
  - Protected admin page and server data loader.
- Create: `app/(protected)/admin/area-activities/AreaActivityManager.tsx`
  - Client UI for CRUD, area multi-select, and image upload/delete.
- Create: `app/(public)/houses/[id]/AreaActivitiesSection.tsx`
  - Client pagination UI for the public sidebar activity list.
- Modify: `lib/houses.ts`
  - Expose `accommodationAreaId` on `PublicHouseDetail`.
- Modify: `app/(public)/houses/[id]/page.tsx`
  - Load first page of activities for `house.accommodationAreaId` and render the sidebar section below `VillaCalendar`.
  - This file currently has local changes; inspect and merge carefully before editing.
- Modify: `app/(protected)/admin/AdminSidebarNav.tsx`
  - Add `/admin/area-activities` navigation item.
- Modify: `AGENTS.md`
  - Add new route, API routes, lib helper, and domain doc row.
- Create: `.agents/docs/area-activities.md`
  - Document business rules, data flow, routes, and UI behavior.
- Modify: `.agents/docs/database.md`
  - Add the migration filename to the migration list.
- Modify: `.agents/docs/validation.md`
  - Add validation checks for area activities.

---

### Task 1: Database Schema And Storage

**Files:**
- Create: `supabase/migrations/20260519100000_create_area_activities.sql`
- Modify: `.agents/docs/database.md`

- [ ] **Step 1: Create the migration file**

Use `apply_patch` to add `supabase/migrations/20260519100000_create_area_activities.sql` with this SQL:

```sql
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

comment on table public.area_activities is
  'Admin-managed tourism activity recommendations displayed on internal house detail pages by accommodation area.';
comment on column public.area_activities.ends_at is
  'Activity expiration date. Null means the activity does not expire.';
comment on column public.area_activities.status is
  'visible = public activity, hidden = draft/inactive activity.';

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
  constraint area_activity_images_max_two_order check (sort_order between 0 and 1)
);

comment on table public.area_activity_areas is
  'Many-to-many links between area activities and accommodation areas.';
comment on table public.area_activity_images is
  'Up to two public images for each area activity.';
comment on column public.area_activity_images.storage_path is
  'Object path inside the area-activity-images Supabase Storage bucket.';

create unique index area_activity_images_activity_sort_order_unique_idx
on public.area_activity_images (activity_id, sort_order);

create unique index area_activity_images_storage_path_unique_idx
on public.area_activity_images (storage_path);

create index area_activities_public_lookup_idx
on public.area_activities (status, starts_at, ends_at, created_at desc);

create index area_activity_areas_area_activity_idx
on public.area_activity_areas (area_id, activity_id);

create index area_activity_areas_activity_id_idx
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
    select 1 from public.profiles
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
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
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
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
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
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
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
    select 1 from public.profiles
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
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
)
with check (
  bucket_id = 'area-activity-images'
  and exists (
    select 1 from public.profiles
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
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role = 'admin'
  )
);
```

- [ ] **Step 2: Add the migration to database docs**

Add this line to `.agents/docs/database.md` in the migration list after `20260519090000_add_accommodation_date_price_statuses.sql`:

```txt
  - `20260519100000_create_area_activities.sql`
```

- [ ] **Step 3: Commit database work**

Run:

```bash
git add supabase/migrations/20260519100000_create_area_activities.sql .agents/docs/database.md
git commit -m "feat: add area activities schema"
```

Expected: commit succeeds with only the migration and database docs staged.

---

### Task 2: Domain Helper

**Files:**
- Create: `lib/area-activities.ts`

- [ ] **Step 1: Create the helper with types and parsers**

Create `lib/area-activities.ts` with these exported types and parser behavior:

```ts
import { createClient } from "@/lib/supabase/server";

export type AreaActivityStatus = "visible" | "hidden";

export type AreaActivityImage = {
  id: string;
  activityId: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AreaActivityArea = {
  activityId: string;
  areaId: string;
  areaName: string | null;
  zoneName: string | null;
  provinceName: string | null;
};

export type AreaActivity = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  status: AreaActivityStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  areas: AreaActivityArea[];
  images: AreaActivityImage[];
};

export type AreaActivityApiData = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: AreaActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  areas: {
    activity_id: string;
    area_id: string;
    area_name: string | null;
    zone_name: string | null;
    province_name: string | null;
  }[];
  images: {
    id: string;
    activity_id: string;
    storage_path: string;
    public_url: string;
    alt_text: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }[];
};

export type AreaActivityInput = {
  title: string;
  areaIds: string[];
  startsAt: string;
  endsAt: string | null;
  status: AreaActivityStatus;
};

export type AreaActivityImageInput = {
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
};
```

Validation rules to implement in this file:

```ts
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isAreaActivityStatus(status: unknown): status is AreaActivityStatus {
  return status === "visible" || status === "hidden";
}
```

`parseAreaActivityInput(value)` returns `{ ok: true, data }` or `{ ok: false, error }` and enforces:

- `title` is required and trimmed.
- `area_ids` is a non-empty array of strings.
- Duplicate area ids are removed.
- `starts_at` is `YYYY-MM-DD`.
- `ends_at` can be empty/null or `YYYY-MM-DD`.
- `ends_at` must be greater than or equal to `starts_at` when provided.
- `status` is `visible` or `hidden`.

- [ ] **Step 2: Add row mapping and API serialization**

Add row types for Supabase nested selects:

```ts
type AreaActivityRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: AreaActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  areas?: {
    activity_id: string;
    area_id: string;
    area?: {
      name: string;
      zone?: {
        name: string;
        province?: { name: string } | null;
      } | null;
    } | null;
  }[] | null;
  images?: AreaActivityImageRow[] | null;
};

type AreaActivityImageRow = {
  id: string;
  activity_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};
```

Map rows to camelCase and serialize back to snake_case with `toAreaActivityApiData(activity)`.

- [ ] **Step 3: Add public and admin read helpers**

Use this select string:

```ts
const AREA_ACTIVITY_SELECT = `
  id,
  title,
  starts_at,
  ends_at,
  status,
  created_by,
  created_at,
  updated_at,
  areas:area_activity_areas(
    activity_id,
    area_id,
    area:accommodation_areas(
      name,
      zone:accommodation_zones(
        name,
        province:provinces(name)
      )
    )
  ),
  images:area_activity_images(
    id,
    activity_id,
    storage_path,
    public_url,
    alt_text,
    sort_order,
    created_at,
    updated_at
  )
`;
```

Implement the public read helper with a two-query flow so filtering by area does not depend on nested join filter behavior:

```ts
export async function getPublicAreaActivitiesForArea(input: {
  areaId: string;
  page: number;
  pageSize: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, input.page);
  const pageSize = Math.max(1, Math.min(input.pageSize, 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const today = new Date().toISOString().slice(0, 10);

  const { data: links, error: linkError } = await supabase
    .from("area_activity_areas")
    .select("activity_id")
    .eq("area_id", input.areaId)
    .returns<{ activity_id: string }[]>();

  if (linkError) throw new Error(linkError.message);

  const activityIds = links.map((link) => link.activity_id);

  if (activityIds.length === 0) {
    return { activities: [], totalCount: 0, page, pageSize };
  }

  const { data, error, count } = await supabase
    .from("area_activities")
    .select(AREA_ACTIVITY_SELECT, { count: "exact" })
    .in("id", activityIds)
    .eq("status", "visible")
    .lte("starts_at", today)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("starts_at", { ascending: false })
    .order("sort_order", {
      ascending: true,
      referencedTable: "area_activity_images",
    })
    .range(from, to)
    .returns<AreaActivityRow[]>();

  if (error) throw new Error(error.message);

  return {
    activities: data.map(mapAreaActivity),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function getAdminAreaActivities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("area_activities")
    .select(AREA_ACTIVITY_SELECT)
    .order("created_at", { ascending: false })
    .order("sort_order", {
      ascending: true,
      referencedTable: "area_activity_images",
    })
    .returns<AreaActivityRow[]>();

  if (error) throw new Error(error.message);
  return data.map(mapAreaActivity);
}
```

- [ ] **Step 4: Add mutation helpers**

Implement:

```ts
export async function createAreaActivity(input: AreaActivityInput) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("area_activities")
    .insert({
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) throw new Error(error.message);

  const areaRows = input.areaIds.map((areaId) => ({
    activity_id: data.id,
    area_id: areaId,
  }));
  const { error: areaError } = await supabase
    .from("area_activity_areas")
    .insert(areaRows);

  if (areaError) throw new Error(areaError.message);

  const activity = await getAdminAreaActivityById(data.id);
  if (!activity) throw new Error("Activity not found after create.");
  return activity;
}

export async function updateAreaActivity(id: string, input: AreaActivityInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("area_activities")
    .update({
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("area_activity_areas")
    .delete()
    .eq("activity_id", id);

  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase
    .from("area_activity_areas")
    .insert(input.areaIds.map((areaId) => ({ activity_id: id, area_id: areaId })));

  if (insertError) throw new Error(insertError.message);

  const activity = await getAdminAreaActivityById(id);
  if (!activity) throw new Error("Activity not found.");
  return activity;
}
```

Also implement:

```ts
export async function getAdminAreaActivityById(id: string): Promise<AreaActivity | null>
export async function deleteAreaActivity(id: string): Promise<void>
export async function addAreaActivityImages(activityId: string, images: AreaActivityImageInput[]): Promise<AreaActivityImage[]>
export async function deleteAreaActivityImages(activityId: string, ids: string[]): Promise<AreaActivityImage[]>
export function toAreaActivityImageApiData(image: AreaActivityImage)
```

`addAreaActivityImages` must check existing image count and throw `Area activity can have at most two images.` if the final count would exceed two.

- [ ] **Step 5: Verify TypeScript syntax**

Run:

```bash
npm run lint
```

Expected before the rest of the feature is wired: lint may fail only because imports from new files are not yet referenced. Fix syntax errors before continuing.

- [ ] **Step 6: Commit helper work**

Run:

```bash
git add lib/area-activities.ts
git commit -m "feat: add area activities helper"
```

Expected: commit succeeds with the helper file only.

---

### Task 3: API Routes

**Files:**
- Create: `app/api/admin/area-activities/route.ts`
- Create: `app/api/admin/area-activities/[id]/route.ts`
- Create: `app/api/admin/area-activities/[id]/images/route.ts`
- Create: `app/api/area-activities/route.ts`

- [ ] **Step 1: Create list and create route**

Add `app/api/admin/area-activities/route.ts`:

```ts
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  createAreaActivity,
  getAdminAreaActivities,
  parseAreaActivityInput,
  toAreaActivityApiData,
} from "@/lib/area-activities";

export async function GET() {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const activities = await getAdminAreaActivities();
    return NextResponse.json({
      data: activities.map(toAreaActivityApiData),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching area activities." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const parsed = parseAreaActivityInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const activity = await createAreaActivity(parsed.data);
    return NextResponse.json(
      { data: toAreaActivityApiData(activity) },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating area activity.",
      },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 2: Create update and delete route**

Add `app/api/admin/area-activities/[id]/route.ts`:

```ts
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  deleteAreaActivity,
  parseAreaActivityInput,
  toAreaActivityApiData,
  updateAreaActivity,
} from "@/lib/area-activities";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const parsed = parseAreaActivityInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { id } = await params;
    const activity = await updateAreaActivity(id, parsed.data);
    return NextResponse.json({ data: toAreaActivityApiData(activity) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating area activity.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    await deleteAreaActivity(id);
    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting area activity." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 3: Create image route**

Add `app/api/admin/area-activities/[id]/images/route.ts` following the existing house image route pattern. Use these constants:

```ts
const AREA_ACTIVITY_IMAGE_BUCKET = "area-activity-images";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);
```

Required behavior:

- `POST` reads `files`, optional `alt_texts`, optional `sort_orders`.
- Rejects zero files with `files are required.`
- Rejects invalid type or empty file with `Only non-empty JPEG, PNG, WebP, and GIF images are allowed.`
- Rejects files over 10 MB with `Each image must be 10MB or smaller.`
- Uploads to `${id}/${crypto.randomUUID()}.${extension}`.
- Calls `addAreaActivityImages(id, imageInputs)`.
- Removes uploaded storage paths if DB insert fails.
- `DELETE` reads `{ ids: string[] }`, calls `deleteAreaActivityImages`, then removes deleted `storagePath` objects.

- [ ] **Step 4: Verify API syntax**

Add `app/api/area-activities/route.ts` for public pagination:

```ts
import { connection, NextResponse } from "next/server";
import {
  getPublicAreaActivitiesForArea,
  toAreaActivityApiData,
} from "@/lib/area-activities";

function getPositiveInteger(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export async function GET(request: Request) {
  await connection();

  try {
    const url = new URL(request.url);
    const areaId = url.searchParams.get("area_id")?.trim() ?? "";

    if (!areaId) {
      return NextResponse.json({ error: "area_id is required." }, { status: 400 });
    }

    const page = getPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = Math.min(
      getPositiveInteger(url.searchParams.get("page_size"), 4),
      12,
    );
    const result = await getPublicAreaActivitiesForArea({
      areaId,
      page,
      pageSize,
    });

    return NextResponse.json({
      data: result.activities.map(toAreaActivityApiData),
      meta: {
        total_count: result.totalCount,
        page: result.page,
        page_size: result.pageSize,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching area activities." },
      { status: 500 },
    );
  }
}
```

- [ ] **Step 5: Verify API syntax**

Run:

```bash
npm run lint
```

Expected: no lint errors from the new API files.

- [ ] **Step 6: Commit API routes**

Run:

```bash
git add app/api/admin/area-activities app/api/area-activities lib/area-activities.ts
git commit -m "feat: add area activities api"
```

Expected: commit succeeds with API route files and any helper refinements needed by those routes.

---

### Task 4: Admin UI

**Files:**
- Create: `app/(protected)/admin/area-activities/page.tsx`
- Create: `app/(protected)/admin/area-activities/AreaActivityManager.tsx`
- Modify: `app/(protected)/admin/AdminSidebarNav.tsx`

- [ ] **Step 1: Create the protected page**

Add `app/(protected)/admin/area-activities/page.tsx`:

```tsx
import { Suspense } from "react";
import { getAdminAreaActivities } from "@/lib/area-activities";
import { getAdminHouseSettingsData } from "@/lib/houses";
import { requireRole } from "@/lib/auth/session";
import { AreaActivityManager } from "./AreaActivityManager";

export default function AdminAreaActivitiesPage() {
  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold text-primary">กิจกรรมแนะนำตามพื้นที่</h1>
      </div>

      <Suspense fallback={<p>Loading area activities...</p>}>
        <AdminAreaActivities />
      </Suspense>
    </div>
  );
}

async function AdminAreaActivities() {
  await requireRole("admin");

  const [activities, settings] = await Promise.all([
    getAdminAreaActivities(),
    getAdminHouseSettingsData(),
  ]);

  return <AreaActivityManager activities={activities} areas={settings.areas} />;
}
```

- [ ] **Step 2: Create the manager component**

Create `AreaActivityManager.tsx` as a client component using the patterns from `AccommodationRecommendationManager`.

Required state:

```ts
type ActivityDraft = {
  title: string;
  areaIds: string[];
  startsAt: string;
  endsAt: string | null;
  status: AreaActivityStatus;
};
```

Payload mapper:

```ts
function toPayload(draft: ActivityDraft) {
  return {
    title: draft.title,
    area_ids: draft.areaIds,
    starts_at: draft.startsAt,
    ends_at: draft.endsAt || null,
    status: draft.status,
  };
}
```

The component must include:

- Create form with title, multi-select area checkboxes, dates, no-expiry checkbox, status, and submit.
- Existing activity list with editable fields.
- Save button calling `PATCH /api/admin/area-activities/${id}`.
- Delete button calling `DELETE /api/admin/area-activities/${id}`.
- Image upload control per activity calling `POST /api/admin/area-activities/${id}/images`.
- Image delete button calling `DELETE /api/admin/area-activities/${id}/images`.
- UI block when an activity already has 2 images: disable file input and show `เพิ่มรูปได้สูงสุด 2 รูป`.

Use existing components:

```ts
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
```

Use lucide icons:

```ts
import { ImagePlus, Plus, Save, Trash2 } from "lucide-react";
```

- [ ] **Step 3: Add admin navigation**

In `app/(protected)/admin/AdminSidebarNav.tsx`, import `MapPinned` from `lucide-react` and add this item after Dashboard or Houses:

```ts
{ href: "/admin/area-activities", label: "กิจกรรมแนะนำ", icon: MapPinned },
```

No special active route branch is needed because the default `pathname === href || pathname.startsWith(`${href}/`)` covers this route.

- [ ] **Step 4: Verify admin UI**

Run:

```bash
npm run lint
```

Expected: no lint errors from the new admin UI.

- [ ] **Step 5: Commit admin UI**

Run:

```bash
git add app/(protected)/admin/area-activities app/(protected)/admin/AdminSidebarNav.tsx
git commit -m "feat: add area activities admin ui"
```

Expected: commit succeeds with admin UI files.

---

### Task 5: Public Internal House Display

**Files:**
- Modify: `lib/houses.ts`
- Create: `app/(public)/houses/[id]/AreaActivitiesSection.tsx`
- Modify: `app/(public)/houses/[id]/page.tsx`

- [ ] **Step 1: Expose area id in public house detail**

In `lib/houses.ts`, update `PublicHouseDetail`:

```ts
export type PublicHouseDetail = House & {
  accommodationAreaId: string;
  accommodationTypeName: string | null;
  areaName: string | null;
  zoneName: string | null;
  provinceName: string | null;
  // keep the remaining existing fields unchanged
};
```

In `mapPublicAccommodationDetail(row)`, add:

```ts
accommodationAreaId: row.accommodation_area_id,
```

Confirm `PUBLIC_HOUSE_DETAIL_SELECT` already selects `accommodation_area_id`; if it does not, add it to the select string.

- [ ] **Step 2: Create public section component**

Add `app/(public)/houses/[id]/AreaActivitiesSection.tsx`:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AreaActivity, AreaActivityApiData } from "@/lib/area-activities";
import { Button } from "@/components/ui/button";

type AreaActivitiesSectionProps = {
  areaId: string;
  activities: AreaActivity[];
  totalCount: number;
  pageSize: number;
};

function formatDateRange(activity: AreaActivity) {
  const startsAt = new Date(`${activity.startsAt}T00:00:00`);
  const startText = startsAt.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  if (!activity.endsAt) {
    return `${startText} เป็นต้นไป`;
  }

  const endsAt = new Date(`${activity.endsAt}T00:00:00`);
  const endText = endsAt.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return `${startText} - ${endText}`;
}

function mapAreaActivityApiData(activity: AreaActivityApiData): AreaActivity {
  return {
    id: activity.id,
    title: activity.title,
    startsAt: activity.starts_at,
    endsAt: activity.ends_at,
    status: activity.status,
    createdBy: activity.created_by,
    createdAt: activity.created_at,
    updatedAt: activity.updated_at,
    areas: activity.areas.map((area) => ({
      activityId: area.activity_id,
      areaId: area.area_id,
      areaName: area.area_name,
      zoneName: area.zone_name,
      provinceName: area.province_name,
    })),
    images: activity.images.map((image) => ({
      id: image.id,
      activityId: image.activity_id,
      storagePath: image.storage_path,
      publicUrl: image.public_url,
      altText: image.alt_text,
      sortOrder: image.sort_order,
      createdAt: image.created_at,
      updatedAt: image.updated_at,
    })),
  };
}

export function AreaActivitiesSection({
  areaId,
  activities,
  totalCount,
  pageSize,
}: AreaActivitiesSectionProps) {
  const [page, setPage] = useState(1);
  const [currentActivities, setCurrentActivities] = useState(activities);
  const [currentTotalCount, setCurrentTotalCount] = useState(totalCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(currentTotalCount / pageSize));

  async function loadPage(nextPage: number) {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        area_id: areaId,
        page: String(nextPage),
        page_size: String(pageSize),
      });
      const response = await fetch(`/api/area-activities?${params.toString()}`);
      const body = (await response.json().catch(() => null)) as {
        data?: AreaActivityApiData[];
        meta?: { total_count?: number };
        error?: string;
      } | null;

      if (!response.ok) {
        throw new Error(body?.error ?? "Request failed.");
      }

      setCurrentActivities((body?.data ?? []).map(mapAreaActivityApiData));
      setCurrentTotalCount(body?.meta?.total_count ?? 0);
      setPage(nextPage);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Request failed.");
    } finally {
      setIsLoading(false);
    }
  }

  if (currentActivities.length === 0 && currentTotalCount === 0) return null;

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-primary">กิจกรรมแนะนำ</h2>
        {totalPages > 1 ? (
          <span className="text-xs text-muted-foreground">
            {page}/{totalPages}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        {currentActivities.map((activity) => {
          const image = activity.images[0];

          return (
            <article
              key={activity.id}
              className="overflow-hidden rounded-md border border-border bg-background"
            >
              {image ? (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={image.publicUrl}
                    alt={image.altText ?? activity.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 320px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div className="grid gap-1 p-3">
                <h3 className="text-sm font-semibold text-card-foreground">
                  {activity.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {formatDateRange(activity)}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => loadPage(Math.max(1, page - 1))}
            disabled={page === 1 || isLoading}
            aria-label="Previous activities"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => loadPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || isLoading}
            aria-label="Next activities"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
```

- [ ] **Step 3: Wire server data into `/houses/[id]`**

Inspect `app/(public)/houses/[id]/page.tsx` because it has local changes. Preserve those changes.

Add imports:

```ts
import { getPublicAreaActivitiesForArea } from "@/lib/area-activities";
import { AreaActivitiesSection } from "./AreaActivitiesSection";
```

Add constant near the top:

```ts
const AREA_ACTIVITY_PAGE_SIZE = 4;
```

After `house` is known and before rendering, load activities:

```ts
const areaActivities = await getPublicAreaActivitiesForArea({
  areaId: house.accommodationAreaId,
  page: 1,
  pageSize: AREA_ACTIVITY_PAGE_SIZE,
});
```

In the right sidebar, render immediately after `VillaCalendar`:

```tsx
<AreaActivitiesSection
  areaId={house.accommodationAreaId}
  activities={areaActivities.activities}
  totalCount={areaActivities.totalCount}
  pageSize={AREA_ACTIVITY_PAGE_SIZE}
/>
```

- [ ] **Step 4: Verify public display syntax**

Run:

```bash
npm run lint
```

Expected: no lint errors from `lib/houses.ts`, `AreaActivitiesSection.tsx`, or `/houses/[id]/page.tsx`.

- [ ] **Step 5: Commit public display**

Run:

```bash
git add lib/houses.ts app/(public)/houses/[id]/AreaActivitiesSection.tsx app/(public)/houses/[id]/page.tsx
git commit -m "feat: show area activities on house details"
```

Expected: commit succeeds and does not revert unrelated local changes in `/houses/[id]` files.

---

### Task 6: Project Documentation

**Files:**
- Modify: `AGENTS.md`
- Create: `.agents/docs/area-activities.md`
- Modify: `.agents/docs/validation.md`

- [ ] **Step 1: Add the domain doc**

Create `.agents/docs/area-activities.md`:

```md
# Area Activities

> อ่านไฟล์นี้เมื่องานแตะ `area_activities`, `lib/area-activities.ts`, `/admin/area-activities`, `/api/admin/area-activities` หรือกิจกรรมแนะนำบน `/houses/[id]`

## Overview

Area activities are admin-managed tourism activity recommendations tied to one or more accommodation areas. They appear only on internal `/houses/[id]` pages whose house area matches one of the activity areas.

## Rules

- One activity can link to multiple areas through `area_activity_areas`.
- `ends_at = null` means no expiration date.
- `status` supports `visible` and `hidden`.
- Public display includes only active visible activities.
- Active means `starts_at <= current_date` and `ends_at is null or ends_at >= current_date`.
- Activities can have 0, 1, or 2 images.
- The two-image limit is enforced by database constraints and helper validation.
- Activities do not have descriptions, links, phone numbers, or booking actions.

## Public Flow

- `/houses/[id]` uses internal house detail data only.
- The page reads `house.accommodationAreaId`.
- The page calls `getPublicAreaActivitiesForArea()` directly from `lib/area-activities.ts`.
- Do not fetch the app's own API from the server page.
- `/houses/external/[id]` is out of scope and must remain unchanged.

## Admin Flow

- Admin page: `/admin/area-activities`
- API routes:
  - `GET /api/admin/area-activities`
  - `POST /api/admin/area-activities`
  - `PATCH /api/admin/area-activities/[id]`
  - `DELETE /api/admin/area-activities/[id]`
  - `POST /api/admin/area-activities/[id]/images`
  - `DELETE /api/admin/area-activities/[id]/images`
- `GET /api/area-activities` is public read-only and supports `area_id`, `page`, and `page_size`.
- All API routes must call `await connection()` before runtime work.
- Admin API routes must use `requireAdminApi()`.
- Image uploads use the `area-activity-images` bucket.
```

- [ ] **Step 2: Update AGENTS.md**

Add `lib/area-activities.ts` to Project Shape.

Add route:

```txt
  - `/admin/area-activities`
```

Add API routes:

```txt
  - `/api/admin/area-activities`
  - `/api/admin/area-activities/[id]`
  - `/api/admin/area-activities/[id]/images`
  - `/api/area-activities`
```

Add domain docs row:

```md
| `.agents/docs/area-activities.md` | งานแตะ `area_activities`, `lib/area-activities.ts`, `/admin/area-activities`, `/api/admin/area-activities` หรือกิจกรรมแนะนำบน `/houses/[id]` |
```

Add core rule bullet:

```txt
- logic เกี่ยวกับกิจกรรมแนะนำตามพื้นที่: `lib/area-activities.ts`
```

- [ ] **Step 3: Update validation docs**

Add these bullets to `.agents/docs/validation.md`:

```md
- `/admin/area-activities` ต้องสร้าง/แก้ไข/ลบกิจกรรมที่ผูกหลาย area ได้
- `/admin/area-activities` ต้องบันทึกกิจกรรมได้เมื่อมีรูป 0, 1 หรือ 2 รูป
- `/admin/area-activities` ต้องบล็อกการเพิ่มรูปเกิน 2 รูป
- `/houses/[id]` ของ internal house ต้องแสดงกิจกรรม active ที่ตรงกับ area ของบ้าน
- กิจกรรม `hidden`, หมดอายุ, หรือยังไม่ถึง `starts_at` ต้องไม่แสดงบน public
- กิจกรรม `ends_at = null` ต้องแสดงได้หลังถึง `starts_at`
- pagination ของกิจกรรมแนะนำบน `/houses/[id]` ต้องทำงานเมื่อมีมากกว่า 4 รายการ
- `/houses/external/[id]` ต้องไม่แสดง section กิจกรรมแนะนำและต้องไม่เปลี่ยน behavior เดิม
```

- [ ] **Step 4: Commit docs**

Run:

```bash
git add AGENTS.md .agents/docs/area-activities.md .agents/docs/validation.md
git commit -m "docs: document area activities"
```

Expected: commit succeeds with docs only.

---

### Task 7: Full Verification

**Files:**
- Verify all files changed by Tasks 1-6.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint
```

Expected: passes.

- [ ] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: passes. If Google Fonts or network access fails because of sandbox restrictions, rerun with escalated network permission and keep the failure output in the implementation notes.

- [ ] **Step 3: Start the dev server**

Run:

```bash
npm run dev
```

Expected: local Next.js server starts and prints the local URL.

- [ ] **Step 4: Browser verification**

Open the local URL in the in-app browser and verify:

- `/admin/area-activities` loads for admin.
- Create activity with at least two selected areas and no image.
- Upload one image to that activity.
- Confirm the upload UI allows one more image and blocks a third after two images exist.
- Set the activity to `visible`, `starts_at` today, `ends_at` empty.
- Open an internal `/houses/[id]` whose area matches one selected area.
- Confirm the activity appears below the calendar.
- Add more than 4 active activities for the same area or seed data locally.
- Confirm sidebar pagination changes visible activity cards.
- Open `/houses/external/[id]`.
- Confirm no area activity section appears and the page still renders normally.

- [ ] **Step 5: Final status**

Run:

```bash
git status --short
```

Expected: only intentional files are modified. Do not revert unrelated user changes.

---

## Self-Review Notes

- Spec coverage: schema, storage, RLS, helper, API, admin UI, public UI, docs, and verification are covered.
- Type consistency: internal uses camelCase, API contracts use snake_case, and route names match the approved `area-activities` domain.
- Known repo constraint: there are existing local changes under `app/(public)/houses/[id]`; implementation must preserve them and merge around them.
