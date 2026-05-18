# Area Activities

> อ่านไฟล์นี้เมื่องานแตะ `area_activities`, `lib/area-activities.ts`, `/admin/area-activities`, `/api/admin/area-activities` หรือ section กิจกรรมแนะนำบน `/houses/[id]`

## Overview

Area activities are admin-managed tourism activity recommendations linked to one or more accommodation areas. They are displayed only on internal house detail pages when the house area matches.

## Rules

- One activity can link to multiple areas through `area_activity_areas`.
- `ends_at = null` means no expiration date.
- Status is only `visible` or `hidden`.
- Public listing includes active visible activities only.
- Active means `starts_at <= current_date` and `(ends_at is null or ends_at >= current_date)`.
- Activities can have `0-2` images.
- The two-image limit is enforced by database constraints and helper validation.
- No description, outbound link, or booking CTA is part of this domain.

## Public Flow

- The internal house page `/houses/[id]` loads data from `lib/*` helpers directly.
- The page reads `house.accommodationAreaId`.
- The page loads the first activity page with `getPublicAreaActivitiesForArea`.
- Pagination requests use `GET /api/area-activities`.
- `/houses/external/[id]` must not show this section.

## Admin Flow

- Admin page: `/admin/area-activities`
- API routes:
  - `GET /api/admin/area-activities`
  - `POST /api/admin/area-activities`
  - `PATCH /api/admin/area-activities/[id]`
  - `DELETE /api/admin/area-activities/[id]`
  - `POST /api/admin/area-activities/[id]/images`
  - `DELETE /api/admin/area-activities/[id]/images`
- API routes call `await connection()` before runtime work.
- Admin API routes use `requireAdminApi()`.
- Images are stored in bucket `area-activity-images`.
