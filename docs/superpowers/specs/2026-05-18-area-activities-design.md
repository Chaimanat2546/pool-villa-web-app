# Area Activities Design

## Goal

Build an admin-managed activity recommendation system for internal house detail pages. Activities are tied to one or more accommodation areas and appear on `/houses/[id]` when the current internal house belongs to a matching area.

## Scope

This feature applies to internal houses only.

- Public display is added to `/houses/[id]`.
- External house routes such as `/houses/external/[id]` are out of scope.
- Activity content is intentionally small: title, dates, status, areas, and up to two images.
- Activities do not have descriptions, outbound links, phone numbers, or booking actions.

## Data Model

Create a new domain named `area-activities` with three public schema tables.

`area_activities`

- `id uuid primary key default gen_random_uuid()`
- `title text not null`
- `starts_at date not null`
- `ends_at date null`
- `status area_activity_status not null default 'hidden'`
- `created_by uuid references auth.users(id) on delete set null default auth.uid()`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

`area_activity_areas`

- `activity_id uuid not null references public.area_activities(id) on delete cascade`
- `area_id uuid not null references public.accommodation_areas(id) on delete cascade`
- Primary key: `(activity_id, area_id)`

`area_activity_images`

- `id uuid primary key default gen_random_uuid()`
- `activity_id uuid not null references public.area_activities(id) on delete cascade`
- `storage_path text not null`
- `public_url text not null`
- `alt_text text null`
- `sort_order integer not null default 0`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Rules:

- `status` supports only `visible` and `hidden`.
- `ends_at = null` means the activity does not expire.
- Date range is valid when `ends_at is null or ends_at >= starts_at`.
- Each activity can link to multiple areas.
- Each activity can have 0, 1, or 2 images.
- The database should enforce the 2-image maximum, not only the UI.

## Storage

Create a new public Supabase Storage bucket named `area-activity-images`.

Allowed uploads:

- JPEG
- PNG
- WebP
- GIF
- Maximum 10 MB per image

Storage policies follow the existing house and blog image pattern:

- Anyone can read objects in the public bucket.
- Only admins can insert, update, or delete objects.
- If database metadata insert fails after upload, the API removes the uploaded object to avoid orphaned files.

## RLS And Permissions

Enable RLS on all new tables.

Public read access:

- `anon` and `authenticated` can read only active visible activities.
- Active means `status = 'visible'`, `starts_at <= current_date`, and `(ends_at is null or ends_at >= current_date)`.
- Activity area links and images are readable only when their parent activity is publicly readable.

Admin access:

- Authenticated admins can read, create, update, and delete activities.
- Admin checks use the existing `profiles.role = 'admin'` pattern.
- API routes also use `requireAdminApi()`.

Indexes:

- Add lookup indexes for public area activity queries by area, status, and date.
- Add foreign key indexes for `activity_id` and `area_id`.
- Add image ordering index on `(activity_id, sort_order, created_at)`.

## Domain Helper

Create `lib/area-activities.ts`.

Responsibilities:

- Define internal camelCase types.
- Define snake_case API response types.
- Parse and validate admin payloads.
- Map Supabase rows into internal types.
- Fetch public active activities for one area with pagination.
- Fetch admin activity list with linked areas and images.
- Create, update, and delete activities.
- Add and delete activity images.
- Convert internal data to API contracts at route boundaries.

Public helper shape:

```ts
getPublicAreaActivitiesForArea(input: {
  areaId: string;
  page: number;
  pageSize: number;
}): Promise<{
  activities: AreaActivity[];
  totalCount: number;
  page: number;
  pageSize: number;
}>;
```

## Admin API

Create admin-only routes under `/api/admin/area-activities`.

- `GET /api/admin/area-activities`
- `POST /api/admin/area-activities`
- `PATCH /api/admin/area-activities/[id]`
- `DELETE /api/admin/area-activities/[id]`
- `POST /api/admin/area-activities/[id]/images`
- `DELETE /api/admin/area-activities/[id]/images`

API route rules:

- Call `await connection()` before runtime work.
- Do not wrap `connection()` in `try/catch`.
- Use `requireAdminApi()` inside `try/catch`.
- Return snake_case public contracts.
- Keep business logic in `lib/area-activities.ts`.

## Admin UI

Create `/admin/area-activities`.

The page is protected with `requireRole("admin")` and renders a client manager component.

Admin form fields:

- Activity title
- Multi-select area picker using existing accommodation area options
- Start date
- Optional end date
- Status selector: visible or hidden
- Image manager allowing up to two images

The UI should:

- Allow saving activities with no images.
- Allow saving activities with one image.
- Block adding a third image before upload.
- Show API validation errors clearly.
- Refresh server data after create, update, delete, upload, and image delete.

Admin navigation gets a new item for `/admin/area-activities`.

## Public UI

On `/houses/[id]`, after the `VillaCalendar` in the right sidebar, add a vertical activity section.

Display rules:

- Only internal house detail pages show this section.
- Extend the internal public house detail mapping to expose `accommodationAreaId` from `accommodations.accommodation_area_id`; use that id for the activity lookup.
- Show all active visible activities for that area, paginated.
- The first page loads with the server-rendered page.
- Pagination uses 4 activities per page to keep the sidebar readable while still showing enough content.

Card contents:

- First available image if present
- Title
- Start date
- End date if present, otherwise a no-expiration label

No description or external call-to-action is shown.

## Data Flow

Server page flow for `/houses/[id]`:

1. Load internal house detail with existing house helper.
2. If no house exists, return `notFound()`.
3. Use `house.accommodationAreaId` to load area activities through `lib/area-activities.ts`.
4. Render activity cards below `VillaCalendar`.

Do not fetch the app's own API from the server page.

## Documentation Updates

Update project documentation as part of implementation.

- `AGENTS.md`: add the new route, API routes, lib helper, and domain doc trigger.
- `.agents/docs/area-activities.md`: document business rules and flow.
- `.agents/docs/database.md`: add the new migration to the migration list.
- `.agents/docs/validation.md`: add post-change validation for admin activity CRUD, image upload, public display, and external route non-regression.

## Validation

Required verification after implementation:

- `npm run lint`
- `npm run build`
- Admin can create an activity linked to multiple areas.
- Admin can save an activity with 0, 1, or 2 images.
- Admin cannot add more than 2 images.
- Hidden activities do not appear publicly.
- Visible active activities appear on matching internal `/houses/[id]` pages.
- Expired activities do not appear.
- Open-ended activities with `ends_at = null` appear after `starts_at`.
- Pagination works when more activities exist than the page size.
- `/houses/external/[id]` remains unchanged.

## Fixed UI Constants

The public sidebar activity section uses `pageSize = 4`.
