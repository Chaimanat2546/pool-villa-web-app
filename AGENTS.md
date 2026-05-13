# AI Coding Guide

ไฟล์นี้คือ context สำหรับ AI/agent ที่เข้ามาแก้โปรเจกต์นี้ต่อ ให้ยึดโครงสร้างนี้เป็นหลักก่อนเพิ่มโค้ดใหม่

## Project Shape

- Stack หลักคือ Next.js App Router, TypeScript, Tailwind CSS และ Supabase auth starter
- public house pages อยู่ใน `app/(public)/houses`
- house domain logic อยู่ใน `lib/houses.ts`
- reusable UI อยู่ใน `components` และ `components/ui`
- API routes อยู่ใน `app/api`

## Core Rule

อย่าเขียน business/data logic ซ้ำใน page หรือ API route ถ้า logic เกี่ยวกับบ้านพัก ให้เริ่มที่ `lib/houses.ts` ก่อน

ตัวอย่าง logic ที่ต้องอยู่ใน `lib/houses.ts`:

- type ของบ้านพัก
- mapping จาก external API
- fallback value
- parse ตัวเลขจาก string เช่น price, people, farsea
- filter/search/sort
- formatter เช่น ระยะห่างจากทะเล
- selector เช่น บ้านราคาประหยัด หรือบ้านใกล้ทะเล

## Data Flow

Server pages ควร import helper โดยตรงจาก `lib/houses.ts`

ดี:

```ts
const houses = await getHouses();
const results = filterHouses(houses, params);
```

เลี่ยง:

```ts
await fetch("http://localhost:3000/api/houses");
```

เหตุผล: server page ไม่ควรยิง HTTP กลับเข้าตัวเอง เพราะเปราะกับ port, environment และ production deploy

## House Domain

ใช้ `House` เป็น internal shape หลักใน React/TypeScript และใช้ camelCase ภายในโค้ด เช่น:

```ts
house.swimmingKid
```

แต่ public API response ยังรักษา snake_case เดิม เช่น:

```ts
swimming_kid
```

ถ้าต้องส่งข้อมูลออกจาก API route ให้ใช้ `toHouseApiData()` เพื่อแปลง internal shape เป็น API shape

## API Routes

API routes ใน `app/api/houses` มีไว้สำหรับ external/client consumer ไม่ใช่ data layer ภายใน app

กฎ:

- import จาก `lib/houses.ts`
- อย่า map external API ซ้ำใน route
- ใช้ `await connection()` ก่อน runtime-only work เพราะโปรเจกต์เปิด `cacheComponents`
- catch เฉพาะ error จากงาน runtime จริง อย่า wrap `connection()` ไว้ใน `try/catch`

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

## Pages

หน้าใน `app/(public)/houses` ควรเป็นตัวประกอบ UI เป็นหลัก

- `/houses`: ดึงข้อมูลด้วย `getHouses()` แล้วใช้ selector เช่น `getBudgetHouses()` และ `getNearSeaHouses()`
- `/houses/[id]`: ใช้ `getHouseById()` และ `notFound()` ถ้าไม่เจอ
- `/houses/search`: ใช้ `filterHouses(await getHouses(), params)`

ถ้ามี uncached data ใน Server Component ให้ render dynamic part หลัง `<Suspense>`

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
- `HouseSection` รับ list ของ `HouseCardData`
- `HouseCarousel` เป็น client component สำหรับ drag-scroll
- อย่าสร้าง type `House` ซ้ำใน component ให้ import type จาก `lib/houses.ts`

## Config Rules

- `next.config.ts` ใช้ ESM เท่านั้น ห้ามปน `module.exports`
- `tailwind.config.ts` ใช้ import แทน `require`
- ESLint ignore `.next/**` เพราะเป็น generated output
- อย่าแก้ไฟล์ generated ใน `.next`

## Validation

หลังแก้โค้ด ให้รันอย่างน้อย:

```bash
npm run lint
npm run build
```

ถ้าแก้ frontend interaction ให้ทดสอบด้วย browser/Playwright flow จริง เช่น:

```txt
/houses/search?q=9&minPrice=12000&maxPrice=30000
submit form
expected: URL ยังเก็บ query params ที่เลือกไว้
```

## House Gallery Implementation

รายละเอียดการเพิ่มฟีเจอร์ Gallery ให้กับหน้า `/houses/[id]`:

- **Server-side helper**: ดึงรูปจาก API ใน `lib/houses.ts` พร้อม pagination, map `image_zone`, และใส่ header `Accept`/`User-Agent` เพื่อป้องกัน 403
- **UI Component**: Bento gallery + modal ดูรูปทั้งหมดใน `HouseImageGallery.tsx`
- **Integration**: ผูกหน้า detail ให้เรียกรูปบ้านตาม id ใน `app/(public)/houses/[id]/page.tsx`
- **Config**: เพิ่ม remote image host ใน `next.config.ts` และ placeholder env ใน `.env.example`

การตรวจสอบ:
- ผ่าน `npm run lint` และ `npm run build`
- ทดสอบที่ `/houses/9` เห็น Bento + ปุ่ม “ดูรูปทั้งหมด” และ modal แยกหมวดตาม `image_zone`
- ไม่มี token หลุดไปฝั่ง client

## Style Preferences

- ทำให้ page อ่านเหมือน orchestration ไม่ใช่ที่รวม business logic
- รวม duplication ที่เกิดซ้ำเกินหนึ่งที่ไว้ใน helper กลาง
- ใช้ชื่อ internal เป็น camelCase
- แปลง external/API contract ที่ boundary เท่านั้น
- ลบ template comment หรือ mock label ที่ไม่จริงเมื่อฟีเจอร์เริ่มใช้งานจริง
- อย่า refactor auth/Supabase starter code ถ้างานไม่ได้แตะส่วนนั้น
