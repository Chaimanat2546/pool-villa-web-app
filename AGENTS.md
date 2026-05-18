# AI Coding Guide

ไฟล์นี้คือ context หลักสำหรับ AI/agent ที่เข้ามาแก้โปรเจกต์นี้ ให้ยึดโครงสร้างปัจจุบันก่อนเพิ่มโค้ดใหม่เสมอ

## Project Shape

- Stack หลักคือ Next.js App Router, TypeScript, Tailwind CSS, Supabase SSR/Auth starter และ Tiptap สำหรับ editor ของ blog
- Route groups หลัก:
  - `app/(public)` สำหรับหน้าสาธารณะ เช่น `/houses` และ `/blog`
  - `app/(auth)` สำหรับ auth pages ที่ URL ขึ้นต้น `/auth`
  - `app/(protected)` สำหรับหน้าที่ต้อง login เช่น `/protected`, `/user`, `/admin`
  - `app/api` สำหรับ API routes
- House domain logic อยู่ใน `lib/houses.ts`
- House recommendation logic อยู่ใน `lib/house-recommendations.ts`
- Accommodation recommendation logic อยู่ใน `lib/accommodation-recommendations.ts`
- Villa calendar logic อยู่ใน `lib/villa-calendar.ts`
- Villa calendar types (shared types) อยู่ใน `lib/villa-calendar-types.ts`
- Blog domain logic อยู่ใน `lib/blog.ts`
- Auth role/session/API helpers อยู่ใน `lib/auth`
- Supabase clients อยู่ใน `lib/supabase`
- reusable UI อยู่ใน `components` และ `components/ui`
- migrations อยู่ใน `supabase/migrations`

## Project Skills

ก่อนเริ่มงานให้เช็ก skill ใน `.agents/skills` ที่เกี่ยวกับงานนั้น ๆ และใช้ร่วมกับกฎในไฟล์นี้

- `supabase`: ใช้ทุกครั้งที่งานแตะ Supabase, Auth, Database, Storage, RLS, migration หรือ client/server integration
- `supabase-postgres-best-practices`: ใช้เมื่อออกแบบ schema, index, policy, query หรือ optimize Postgres
- `vercel-react-best-practices`: ใช้เมื่อแก้หรือรีวิว React/Next.js component, page, data fetching, bundle/performance หรือ frontend interaction

สำหรับงาน React/Next.js ให้ระวัง waterfall, bundle import, server/client data fetching, shared module state, re-render ที่ไม่จำเป็น และการส่ง props จาก Server Component ไป Client Component มากเกินไป

## Domain Docs

เนื้อหา domain-specific ถูกแยกออกไปเป็นไฟล์ใน `.agents/docs/` ให้เปิดเฉพาะไฟล์ที่เกี่ยวกับงาน:

| ไฟล์                                    | เปิดเมื่อ                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `.agents/docs/house-domain.md`          | งานแตะ `lib/houses.ts`, `/houses` pages, Search Filters, House Gallery หรือ Adding New House Field                                    |
| `.agents/docs/house-admin.md`           | งานแตะ `/admin/houses`, `HouseCreateForm`, `AdminHouseImageManager`, `AdminHouseCalendar`, `SettingsManager` หรือ `/api/admin/houses` |
| `.agents/docs/house-recommendations.md` | งานแตะ `house_recommendations` table, `lib/house-recommendations.ts` หรือ `/admin/recommendations`                                    |
| `.agents/docs/accommodation-recommendations.md` | งานแตะ `accommodation_recommendations` table, `lib/accommodation-recommendations.ts` หรือ `/admin/houses/recommendations`                   |
| `.agents/docs/blog.md`                  | งานแตะ `lib/blog.ts`, `/blog` pages, `BlogPostForm`, Tiptap editor หรือ `/api/blog`                                                   |
| `.agents/docs/ui-components.md`         | งานแตะ UI components, UX rules หรือ theme/color tokens                                                                                |
| `.agents/docs/database.md`              | งานแตะ Supabase setup, migrations, Auth/Roles หรือ config files                                                                       |
| `.agents/docs/validation.md`            | หลังแก้โค้ดเพื่อ verify ว่าสิ่งที่เกี่ยวข้องยังทำงานได้                                                                               |

## Current Routes

- Public:
  - `/houses`
  - `/houses/search`
  - `/houses/[id]`
  - `/houses/external`
  - `/houses/external/search`
  - `/houses/external/[id]`
  - `/blog`
  - `/blog/[slugOrCode]`
- Auth:
  - `/auth/login`
  - `/auth/sign-up`
  - `/auth/forgot-password`
  - `/auth/update-password`
  - `/auth/sign-up-success`
  - `/auth/error`
  - `/auth/confirm`
- Protected:
  - `/protected`
  - `/user`
  - `/admin`
  - `/admin/recommendations`
  - `/admin/houses/recommendations`
  - `/admin/blog`
  - `/admin/blog/new`
  - `/admin/blog/[id]`
  - `/admin/houses`
  - `/admin/houses/new`
  - `/admin/houses/[id]`
  - `/admin/houses/settings`
- API:
  - `/api/houses`
  - `/api/houses/[id]`
  - `/api/houses/external`
  - `/api/houses/external/[id]`
  - `/api/house-recommendations`
  - `/api/house-recommendations/[id]`
  - `/api/blog`
  - `/api/blog/[id]`
  - `/api/blog/images`
  - `/api/villa-calendar`
  - `/api/villa-calendar/day`
  - `/api/admin/houses` (POST: สร้างบ้านใหม่)
  - `/api/admin/houses/[id]` (PATCH: แก้ไขบ้าน)
  - `/api/admin/houses/[id]/images` (GET/POST/DELETE: จัดการรูปบ้านพัก)
  - `/api/admin/houses/settings` (POST: เพิ่ม province/zone/area/type/facility)
  - `/api/admin/accommodations/recommendations`
  - `/api/admin/accommodations/recommendations/[id]`

## Core Rule

อย่าเขียน business/data logic ซ้ำใน page หรือ API route ให้เริ่มจาก helper กลางตาม domain ก่อนเสมอ

- logic เกี่ยวกับบ้านพัก: `lib/houses.ts`
- logic เกี่ยวกับบ้านแนะนำ: `lib/house-recommendations.ts`
- logic เกี่ยวกับบ้านแนะนำ (บ้านพักในระบบ): `lib/accommodation-recommendations.ts`
- logic เกี่ยวกับ blog: `lib/blog.ts`
- logic เกี่ยวกับ role/session/API auth: `lib/auth/*`

หน้าและ API route ควรอ่านเหมือน orchestration เท่านั้น เช่น validate request, เรียก helper, แปลง response, render UI

## Data Flow

Server pages ควร import helper โดยตรงจาก `lib/*` ไม่ควร fetch HTTP กลับเข้าตัวเอง

ดี:

```ts
const houses = await getHouses();
const results = filterHouses(houses, params);
```

เลี่ยง:

```ts
await fetch("http://localhost:3000/api/houses");
```

เหตุผล: server page ไม่ควรผูกกับ port, environment หรือ production URL ของตัวเอง

Client components ที่ทำ mutation เช่น admin form สามารถเรียก API route ได้ เช่น `BlogPostForm` เรียก `/api/blog`, `/api/blog/[id]` และ `/api/blog/images`

## API Routes

โปรเจกต์เปิด `cacheComponents` ดังนั้น API routes ที่ทำ runtime-only work ต้องใช้ `await connection()` ก่อนงาน runtime จริง

กฎ:

- import helper จาก `lib/*`
- อย่า map external API หรือ query Supabase ซ้ำใน route ถ้ามี helper กลางแล้ว
- ใช้ `await connection()` ก่อน `try/catch`
- catch เฉพาะ error จากงาน runtime จริง อย่า wrap `connection()` ไว้ใน `try/catch`
- API response ที่เป็น public contract ใช้ snake_case
- internal React/TypeScript shape ใช้ camelCase

ตัวอย่าง:

```ts
export async function GET() {
  await connection();

  try {
    const houses = await getHouses();
    return NextResponse.json({ data: houses.map(toHouseApiData) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "..." }, { status: 500 });
  }
}
```

## Style Preferences

- ทำให้ page อ่านเหมือน orchestration ไม่ใช่ที่รวม business logic
- รวม duplication ที่เกิดซ้ำเกินหนึ่งที่ไว้ใน helper กลาง
- ใช้ชื่อ internal เป็น camelCase
- แปลง external/API contract ที่ boundary เท่านั้น
- ลบ template comment หรือ mock label ที่ไม่จริงเมื่อฟีเจอร์เริ่มใช้งานจริง
- อย่า refactor auth/Supabase starter code ถ้างานไม่ได้แตะส่วนนั้น
- อย่าแก้ migration เก่าที่ apply แล้วโดยไม่จำเป็น ให้เพิ่ม migration ใหม่แทน

## การอัปเดตเอกสาร

เอกสารแบ่งเป็น 2 ระดับ ให้แก้ถูกที่:

| แก้ที่                         | เมื่อ                                                                                |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **`AGENTS.md`**                | เพิ่ม route ใหม่, เพิ่ม lib ใหม่, เปลี่ยน stack หลัก, เพิ่ม skill ใหม่               |
| **`.agents/docs/<domain>.md`** | เพิ่ม/เปลี่ยน business rule, เพิ่ม field/column, เปลี่ยน UI pattern, เพิ่ม migration |

### กฎ

- **อย่าเขียน domain detail ลงใน `AGENTS.md` โดยตรง** — ให้ใส่ใน doc ไฟล์ที่ตรงกัน แล้วอัปเดต trigger row ใน Domain Docs table ถ้าจำเป็น
- **เพิ่ม doc ไฟล์ใหม่** เมื่อมี domain ใหม่ที่ยังไม่มีไฟล์ครอบคลุม แล้วเพิ่ม row ใน Domain Docs table ใน `AGENTS.md`
- **อัปเดต migration list** ใน `.agents/docs/database.md` ทุกครั้งที่เพิ่ม migration ใหม่
- **อัปเดต validation checklist** ใน `.agents/docs/validation.md` ทุกครั้งที่มี flow ใหม่ที่ต้องเช็กหลัง deploy
