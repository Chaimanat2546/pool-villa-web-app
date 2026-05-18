# Database, Auth & Config

> อ่านไฟล์นี้เมื่องานแตะ Supabase, migrations, Auth/Roles หรือ Config files

## Supabase Local

โปรเจกต์นี้ใช้ Supabase local

- migration ปัจจุบัน:
  - `20260514094459_add_user_roles.sql`
  - `20260514100959_create_house_recommendations.sql`
  - `20260514113246_create_blog_posts.sql`
  - `20260514115435_simplify_blog_posts.sql`
  - `20260514180602_allow_open_ended_house_recommendations.sql`
  - `20260515103000_create_internal_accommodations.sql`
  - `20260515113000_create_admin_accommodation_create_rpc.sql`
  - `20260515123000_create_admin_accommodation_update_rpc.sql`
  - `20260515133000_extend_admin_accommodation_update_rpc.sql`
  - `20260515143000_add_agency_prices.sql`
  - `20260518090000_extend_create_admin_accommodation_details.sql`
  - `20260518100000_create_accommodation_images.sql`
  - `20260518170000_create_accommodation_recommendations.sql`
  - `20260519090000_add_accommodation_date_price_statuses.sql`
- ถ้าแก้ schema ให้เพิ่ม migration ใหม่ใน `supabase/migrations` อย่าแก้ migration เก่าที่ apply แล้วโดยไม่จำเป็น
- RLS ต้องเปิดและ policy ต้องสอดคล้องกับ role
- ห้าม expose service role หรือ secret ฝั่ง client
- `.env.local` ใช้ค่า local Supabase ได้ แต่ห้ามย้าย secret ไปเป็น `NEXT_PUBLIC_*` ถ้าไม่ใช่ public anon/publishable key

## Auth And Roles

- roles มี `admin` และ `user`
- role helper อยู่ใน `lib/auth/roles.ts`
- server-side page guard ใช้ helper ใน `lib/auth/session.ts` เช่น `requireRole`
- API admin guard ใช้ `requireAdminApi()` จาก `lib/auth/api.ts`
- login redirect ตาม role:
  - `admin` ไป `/admin`
  - `user` ไป `/user`
- อย่า refactor Supabase auth starter code ถ้างานไม่ได้แตะส่วนนั้นโดยตรง

## Config Rules

- `next.config.ts` ใช้ ESM เท่านั้น ห้ามปน `module.exports`
- `tailwind.config.ts` ใช้ import แทน `require`
- ESLint ignore `.next/**` เพราะเป็น generated output
- อย่าแก้ไฟล์ generated ใน `.next`
- ถ้ารัน `next build` แล้วติด Google Fonts เพราะ sandbox/network ให้รันซ้ำด้วยสิทธิ์ network ที่เหมาะสม
