# AI Coding Guide

ไฟล์นี้คือ context สำหรับ AI/agent ที่เข้ามาแก้โปรเจกต์นี้ต่อ ให้ยึดโครงสร้างปัจจุบันของโปรเจกต์ก่อนเพิ่มโค้ดใหม่

## Project Shape

- Stack หลักคือ Next.js App Router, TypeScript, Tailwind CSS, Supabase SSR/Auth starter และ Tiptap สำหรับ editor ของ blog
- Route groups หลัก:
  - `app/(public)` สำหรับหน้าสาธารณะ เช่น `/houses` และ `/blog`
  - `app/(auth)` สำหรับ auth pages ที่ URL ขึ้นต้น `/auth`
  - `app/(protected)` สำหรับหน้าที่ต้อง login เช่น `/protected`, `/user`, `/admin`
  - `app/api` สำหรับ API routes
- House domain logic อยู่ใน `lib/houses.ts`
- House recommendation logic อยู่ใน `lib/house-recommendations.ts`
- Villa calendar logic อยู่ใน `lib/villa-calendar.ts`
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

## Current Routes

- Public:
  - `/houses`
  - `/houses/search`
  - `/houses/[id]`
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
  - `/admin/blog`
  - `/admin/blog/new`
  - `/admin/blog/[id]`
- API:
  - `/api/houses`
  - `/api/houses/[id]`
  - `/api/house-recommendations`
  - `/api/house-recommendations/[id]`
  - `/api/blog`
  - `/api/blog/[id]`
  - `/api/blog/images`
  - `/api/villa-calendar`
  - `/api/villa-calendar/day`

## Core Rule

อย่าเขียน business/data logic ซ้ำใน page หรือ API route ให้เริ่มจาก helper กลางตาม domain ก่อนเสมอ

- logic เกี่ยวกับบ้านพัก: `lib/houses.ts`
- logic เกี่ยวกับบ้านแนะนำ: `lib/house-recommendations.ts`
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

## Auth And Roles

- roles มี `admin` และ `user`
- role helper อยู่ใน `lib/auth/roles.ts`
- server-side page guard ใช้ helper ใน `lib/auth/session.ts` เช่น `requireRole`
- API admin guard ใช้ `requireAdminApi()` จาก `lib/auth/api.ts`
- login redirect ตาม role:
  - `admin` ไป `/admin`
  - `user` ไป `/user`
- อย่า refactor Supabase auth starter code ถ้างานไม่ได้แตะส่วนนั้นโดยตรง

## Supabase Local

โปรเจกต์นี้ใช้ Supabase local

- migration ปัจจุบัน:
  - `20260514094459_add_user_roles.sql`
  - `20260514100959_create_house_recommendations.sql`
  - `20260514113246_create_blog_posts.sql`
  - `20260514115435_simplify_blog_posts.sql`
  - `20260515103000_create_internal_accommodations.sql`
  - `20260515113000_create_admin_accommodation_create_rpc.sql`
  - `20260515123000_create_admin_accommodation_update_rpc.sql`
  - `20260515133000_extend_admin_accommodation_update_rpc.sql`
  - `20260515143000_add_agency_prices.sql`
- ถ้าแก้ schema ให้เพิ่ม migration ใหม่ใน `supabase/migrations` อย่าแก้ migration เก่าที่ apply แล้วโดยไม่จำเป็น
- RLS ต้องเปิดและ policy ต้องสอดคล้องกับ role
- ห้าม expose service role หรือ secret ฝั่ง client
- `.env.local` ใช้ค่า local Supabase ได้ แต่ห้ามย้าย secret ไปเป็น `NEXT_PUBLIC_*` ถ้าไม่ใช่ public anon/publishable key

## House Domain

ใช้ `House` เป็น internal shape หลักใน React/TypeScript และใช้ camelCase ภายในโค้ด เช่น:

```ts
house.swimmingKid
```

แต่ public API response ยังรักษา snake_case เดิม เช่น:

```ts
swimming_kid
```

ถ้าต้องส่งข้อมูลบ้านออกจาก API route ให้ใช้ `toHouseApiData()` เพื่อแปลง internal shape เป็น API shape

ตัวอย่าง logic ที่ต้องอยู่ใน `lib/houses.ts`:

- type ของบ้านพัก
- mapping จาก external API
- fallback value
- parse ตัวเลขจาก string เช่น price, people, farsea
- filter/search/sort
- formatter เช่น ระยะห่างจากทะเล
- formatter/price display เช่น `formatSeaDistance()` และ `getDisplayNightlyPrice()` ต้องอยู่ใน `lib/houses.ts` เพื่อให้ card/detail page ใช้ราคาเดียวกัน
- selector เช่น บ้านราคาประหยัดหรือบ้านใกล้ทะเล
- helper รูปภาพบ้านและ gallery data

## House Pages

หน้าใน `app/(public)/houses` ควรเป็นตัวประกอบ UI เป็นหลัก

- `/houses`: ดึงข้อมูลด้วย `getHouses()` แล้วใช้ selector เช่น `getBudgetHouses()` และ `getNearSeaHouses()`
- `/houses` แสดงบ้านแนะนำจาก Supabase โดย join ด้วย `h_id` กับ external house data ใน page/helper
- `/houses/[id]`: เป็น detail page แบบ orchestration ใช้ helper จาก `lib/houses.ts` เช่น `getHouses()`, `getHouseImages()`, `groupHouseImagesByZone()` และ `getNearSeaHouses()` แล้ว `notFound()` ถ้าไม่เจอ
- `/houses/[id]` layout ปัจจุบันคือ header, gallery, main detail ฝั่งซ้าย, `VillaCalendar` sticky sidebar ฝั่งขวา และ section บ้านพักแนะนำด้านล่าง
- `/houses/search`: ใช้ `filterHouses(await getHouses(), params)`
- ถ้ามี uncached data ใน Server Component ให้ render dynamic part หลัง `<Suspense>`

## Search Filters

`SearchFilters` เป็น client component เพราะมี dropdown, slider, checkbox

ข้อสำคัญ:

- form ใช้ `method="get"` และ `action="/houses/search"`
- dropdown controls บางตัว unmount ตอนเมนูปิด ดังนั้นค่าที่ต้อง submit ต้องมี hidden input อยู่ใน form ตลอด
- slider/select/checkbox ควรเปลี่ยน React state
- hidden inputs submit จาก state นั้น
- ใส่ `key={JSON.stringify(params)}` ตอน render `SearchFilters` เพื่อให้ state reset ตาม URL query ใหม่

Query params ที่ใช้ตอนนี้:

```txt
q
minPrice
maxPrice
people
sort
wifi
grill
pet
snooker
discotech
fancyring
tabletennis
slider
billard
swimming_kid
swim
karaoke
airhockey
jacuzzi
bath
```

## House Gallery

รายละเอียด gallery ของ `/houses/[id]`:

- ดึงรูปจาก helper ใน `lib/houses.ts`
- map `image_zone` เพื่อแยกหมวดรูป
- UI อยู่ที่ `app/(public)/houses/[id]/HouseImageGallery.tsx`
- ปฏิทินอยู่ที่ `app/(public)/houses/[id]/VillaCalendar.tsx` และใช้ logic จาก `lib/villa-calendar.ts`
- modal รายละเอียดวันของ `VillaCalendar` ต้อง render ด้วย portal ไปที่ `document.body` และใช้ z-index สูงกว่า content/card ของหน้า เพื่อไม่ให้บ้านแนะนำหรือ carousel ทับ popup
- ต้องไม่ให้ API token หลุดไปฝั่ง client
- remote image host ต้องอยู่ใน `next.config.ts`

## House Recommendations

ระบบบ้านแนะนำเก็บใน Supabase table `house_recommendations`

- logic อยู่ใน `lib/house-recommendations.ts`
- admin จัดการผ่าน `/admin/recommendations`
- public อ่านผ่าน helper/API ได้เฉพาะรายการที่:
  - `status = "visible"`
  - `starts_at <= today`
  - `ends_at IS NULL` หรือ `ends_at >= today`
- `ends_at = null` หมายถึงบ้านแนะนำไม่มีวันหมดอายุ
- status มีแค่ `visible` และ `hidden`
- อนุญาตให้มี hidden/draft หลายรายการต่อ `h_id`
- อนุญาตให้มี visible ได้แค่ 1 รายการต่อ `h_id`
- ห้ามสร้างหรือเปลี่ยน record ให้เป็น visible ถ้า `h_id` นั้นมี visible record อยู่แล้ว
- DB ต้อง enforce ด้วย partial unique index หรือ constraint ไม่ใช่พึ่ง UI อย่างเดียว
- ก่อนสร้าง recommendation ต้องเช็กว่า `h_id` มีอยู่จริงใน external house API ด้วย `getHouseById`
- API contract ใช้ snake_case เช่น `h_id`, `starts_at`, `ends_at`

## Blog

ระบบ blog เป็น public read, admin write

- logic อยู่ใน `lib/blog.ts`
- public pages อยู่ใน `app/(public)/blog`
- admin pages อยู่ใน `app/(protected)/admin/blog`
- API routes อยู่ใน `app/api/blog`
- editor ใช้ Tiptap ใน `BlogPostForm`
- content เก็บเป็น Tiptap JSON ใน `content_json`
- plain text สำหรับค้นหา/preview เก็บใน `content_text`
- ไม่มี category
- ไม่มี status
- ไม่มี publish time
- public อ่านทุกบทความจาก `blog_posts`
- helper ชื่อ `getPublishedBlogPosts` ยังใช้อยู่เป็นชื่อเดิม แต่ตอนนี้หมายถึง public blog posts ทั้งหมด

รหัสและ slug:

- `code` สุ่มรูปแบบ `pvxxxxxxxx`
- ถ้า code ซ้ำ DB unique constraint จะ reject และ `createBlogPost()` retry ได้สูงสุด 5 ครั้ง
- `slug` เก็บใน DB แต่สร้างจากชื่อบทความและ code
- canonical path คือ `/blog/{title-slug}-i.{code}`
- ถ้าเข้า `/blog/{code}` เช่น `/blog/pv001` ต้อง redirect ไป canonical path
- หา post จาก URL โดย extract code จาก suffix `-i.{code}`

รูปใน blog:

- cover image ต้องมาจาก file upload และเก็บ URL ใน `cover_image_url`
- content images จาก import file หรือ clipboard ต้อง preview เป็น local blob ก่อน
- ห้าม upload content image ทันทีตอน paste/import เพราะรูปจะค้างใน storage ถ้าผู้ใช้ไม่ save
- ตอน save ให้ upload cover และ content images ทีเดียวผ่าน `/api/blog/images`
- หลัง upload ให้ replace local blob URL ใน `content_json` เป็น public storage URL
- storage bucket ปัจจุบันคือ `blog-images`

ลิงก์ใน blog:

- แนบลิงก์ผ่าน link mark ของ Tiptap
- internal link ให้ใช้ path ขึ้นต้น `/` เช่น `/houses/123`
- external link ใช้ full URL หรือให้ editor normalize เช่น `example.com` เป็น `https://example.com`
- public renderer `BlogContent` ต้อง render internal link ด้วย Next `Link`
- link ในหน้าอ่านและใน editor ต้องมี visual state ที่ดูออกว่ากดได้

## Adding A New House Field

ถ้าต้องเพิ่ม field ใหม่จาก external API ให้ทำตามลำดับนี้:

1. เพิ่ม field ใน `ExternalHouse`
2. เพิ่ม field ใน `House`
3. map field ใน `mapExternalHouse()`
4. ถ้า field ต้องออก API ให้เช็ก `toHouseApiData()`
5. ถ้า field ใช้ค้นหา/filter ให้เพิ่มใน `HouseSearchParams`
6. ถ้าเป็น amenity checkbox ให้เพิ่มใน `AMENITY_FILTERS` และ `SearchFilters`
7. ถ้าแสดงใน detail page ให้เพิ่มใน `getDetailRows()`

## UI Components

- `HouseCard` รับข้อมูลแบบ `HouseCardData`
- `HouseCard` ใช้ `getDisplayNightlyPrice()` จาก `lib/houses.ts`; อย่า duplicate สูตรบวกราคาใน component
- รูปใน `HouseCard` ต้องอยู่ในกรอบ `overflow-hidden`/`isolate` และ hover ควร scale เฉพาะรูป ไม่ยกทั้ง card จนชนหรือซ้อนกับ card อื่น
- `HouseSection` รับ list ของ `HouseCardData`
- `HouseCarousel` เป็น client component สำหรับ drag-scroll
- `HouseImageGallery` เป็น client component สำหรับ gallery modal
- `VillaCalendar` เป็น client component สำหรับปฏิทินบ้านพักและ modal รายละเอียดวัน
- `BlogCard` และ `BlogContent` อยู่ใน `app/(public)/blog`
- `BlogSection` อยู่ใน `app/(public)/houses` เพื่อแสดง blog บนหน้า houses
- `BlogPostForm` เป็น client component สำหรับ admin blog editor
- `RecommendationManager` เป็น client component สำหรับ admin recommendations
- อย่าสร้าง type domain ซ้ำใน component ถ้ามี type ใน `lib/*` แล้ว ให้ import type จาก helper กลาง

## Frontend And UX

- หน้า public ควรโหลดเร็ว อ่านง่าย และให้สิ่งที่กดได้ดูเป็น interactive ชัดเจน
- ปุ่มควรมี icon จาก `lucide-react` เมื่อเหมาะสม
- form admin ต้องมี feedback/error state
- link ใน blog ต้องมี underline/hover/focus state
- editor ต้องแสดง state ที่ผู้ใช้รู้ได้ว่าข้อความนั้นแนบลิงก์แล้ว
- อย่าใส่คำอธิบายวิธีใช้ยาว ๆ ใน UI ถ้า control พอชัดด้วย label, icon, tooltip หรือ state

## Theme And Color

ใช้ theme tokens จาก `app/globals.css` และ `tailwind.config.ts` เป็นแหล่งกำหนดสีหลักเสมอ

- ใช้ semantic classes ก่อน เช่น `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `border-border`, `bg-muted`, `text-muted-foreground`, `bg-primary`, `text-primary`, `bg-secondary`, `text-secondary`, `bg-accent`, `text-accent`, `ring-ring`
- ใช้ `brand` สำหรับสี highlight/display ของแบรนด์ เช่น hero, emphasis, decorative highlight: `text-brand`, `bg-brand`, `bg-brand/10`
- ใช้ `accent` สำหรับ UI action/interactive state ที่ต้องอ่านได้บนพื้นขาว เช่น ราคา, active state, hover state หรือปุ่มสำคัญรอง
- หลีกเลี่ยงการ hardcode สีใหม่เช่น `bg-white`, `text-slate-*`, `bg-sky-*`, `text-stone-*`, `text-gray-*` ถ้าใช้ token ที่มีอยู่แทนได้
- ถ้าจำเป็นต้องใช้สีสถานะเฉพาะ เช่น success/warning/error/calendar states ให้ใช้เฉพาะบริบทนั้น และคุม contrast ให้อ่านง่าย
- อย่าเพิ่ม palette ใหม่ใน component โดยตรง ถ้าต้องใช้ซ้ำ ให้เพิ่ม CSS variable ใน `globals.css` และ map ใน `tailwind.config.ts`
- dark mode ต้องอิง token เดียวกัน ห้ามทำ component ที่ดูดีเฉพาะ light mode ด้วยการบังคับ `bg-white`/`text-slate-*` โดยไม่จำเป็น
- ก่อนใช้ `accent` เป็น background พร้อมข้อความ ให้เช็ก contrast โดยเฉพาะข้อความขนาดเล็ก

## Config Rules

- `next.config.ts` ใช้ ESM เท่านั้น ห้ามปน `module.exports`
- `tailwind.config.ts` ใช้ import แทน `require`
- ESLint ignore `.next/**` เพราะเป็น generated output
- อย่าแก้ไฟล์ generated ใน `.next`
- ถ้ารัน `next build` แล้วติด Google Fonts เพราะ sandbox/network ให้รันซ้ำด้วยสิทธิ์ network ที่เหมาะสม

## Validation

หลังแก้โค้ด ให้รันอย่างน้อย:

```bash
npm run lint
npm run build
```

ถ้าแก้ frontend interaction ให้ทดสอบด้วย browser/Playwright หรือ dev server flow จริงด้วย เช่น:

```txt
/houses/search?q=9&minPrice=12000&maxPrice=30000
submit form
expected: URL ยังเก็บ query params ที่เลือกไว้
```

ตัวอย่าง flow ที่ควรเช็กตามงาน:

- search filters ยัง submit query ถูก
- `/houses/[id]` ยังแสดง gallery, detail layout, sticky `VillaCalendar`, และบ้านพักแนะนำได้
- กดวันว่างใน `VillaCalendar` บน `/houses/[id]` แล้ว modal ต้องอยู่เหนือ carousel/card ทั้งหมด
- `HouseCard` ใน carousel ต้องไม่ให้รูปหรือ hover state ล้นไปซ้อน card อื่น
- `/admin/recommendations` ยัง block visible duplicate ต่อ `h_id`
- `/admin/recommendations` ยังรองรับ `ends_at` ว่างสำหรับบ้านแนะนำไม่มีวันหมดอายุ
- `/admin/blog/new` paste/import รูปแล้ว upload เฉพาะตอน save
- `/blog/{code}` redirect ไป canonical slug
- link ใน blog กดได้และ internal link ไม่เปิดแท็บใหม่

## Admin House Management

ระบบจัดการบ้านพัก (Inventory) ถูกย้ายจาก External API มาเป็นระบบภายใน (Supabase)

- logic อยู่ใน `lib/houses.ts`
- หน้าจัดการหลักอยู่ที่ `/admin/houses`
- แบบฟอร์มเพิ่ม/แก้ไขบ้านพักใช้ `HouseCreateForm` ซึ่งเป็น Client Component
- UI ของแบบฟอร์มถูกแบ่งเป็น **Tab** เพื่อความเป็นระเบียบ:
  - **รายละเอียดบ้าน:** ข้อมูลหลัก, ที่ตั้ง, จำนวนห้อง, สิ่งอำนวยความสะดวก และเบอร์ติดต่อ (contacts)
  - **ราคา:** ราคาหลัก, ราคาตามวันในสัปดาห์ และปฏิทินราคาพิเศษ
- ข้อมูลในฟอร์มจะถูกเก็บไว้ใน DOM (ใช้ CSS `hidden`) เพื่อให้ข้อมูลไม่หายขณะสลับ Tab และส่งไปบันทึกทีเดียวเมื่อกด Save

### Dual Pricing Model (Retail vs Agency)

ระบบรองรับการตั้งราคา 2 รูปแบบคู่กันในทุกจุด:
- **Retail Price (ราคาปกติ/ราคาพิเศษ):** ราคาสำหรับขายลูกค้าทั่วไป
- **Agency Price (ราคา Agency):** ราคาสำหรับตัวแทนจำหน่าย
- รองรับทั้งในส่วนของ ราคาหลัก (Normal Price), ราคาตามวันในสัปดาห์ (Weekday Prices) และราคาพิเศษรายวัน (Daily Date Prices)

### Daily Special Prices (Calendar)

การจัดการราคาพิเศษรายวันใช้ `AdminHouseCalendar` ใน `HouseCreateForm`

- แสดงผลแบบปฏิทินรายเดือน คล้ายกับฝั่งลูกค้า
- **การเพิ่มข้อมูล:**
  - **แบบช่วงวัน (Bulk):** ใช้ Input ด้านบนระบุ Start/End Date
  - **แบบเลือกบนปฏิทิน:** คลิกที่วันที่เพื่อเปิด Modal หรือ `Shift + คลิก` เพื่อเลือกช่วงวัน
- **การแก้ไข:** คลิกที่วันที่ที่มีราคาพิเศษอยู่แล้วเพื่อแก้ไขราคาหรือหมายเหตุ
- **การลบ:** คลิกที่วันที่แล้วกดปุ่ม "ลบ" ใน Modal

### House List Table

หน้า `/admin/houses` แสดงรายการบ้านพักในรูปแบบตารางที่กระชับ

- แสดงเฉพาะ: ชื่อบ้าน/รหัส, ประเภทที่พัก, สถานะ (เผยแพร่/ซ่อน) และปุ่มจัดการ
- ตัดข้อมูลที่ตั้ง, จำนวนคน และราคาออกเพื่อความสะอาดของ UI และให้ไปดูรายละเอียดเชิงลึกในหน้าแก้ไขแทน
- ค้นหาได้ด้วยรหัสหรือชื่อบ้าน และกรองตามสถานะได้

## Style Preferences

- ทำให้ page อ่านเหมือน orchestration ไม่ใช่ที่รวม business logic
- รวม duplication ที่เกิดซ้ำเกินหนึ่งที่ไว้ใน helper กลาง
- ใช้ชื่อ internal เป็น camelCase
- แปลง external/API contract ที่ boundary เท่านั้น
- ลบ template comment หรือ mock label ที่ไม่จริงเมื่อฟีเจอร์เริ่มใช้งานจริง
- อย่า refactor auth/Supabase starter code ถ้างานไม่ได้แตะส่วนนั้น
- อย่าแก้ migration เก่าที่ apply แล้วโดยไม่จำเป็น ให้เพิ่ม migration ใหม่แทน
