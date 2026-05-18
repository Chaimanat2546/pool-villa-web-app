# House Domain

> อ่านไฟล์นี้เมื่องานแตะ House data model, `lib/houses.ts`, `/houses` pages, Search Filters หรือ House Gallery

## House Domain Model

ใช้ `House` เป็น internal shape หลักใน React/TypeScript และใช้ camelCase ภายในโค้ด เช่น:

```ts
house.swimmingKid;
```

แต่ public API response ยังรักษา snake_case เดิม เช่น:

```ts
swimming_kid;
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

- `/houses`: ดึงข้อมูลด้วย `getInternalHouses()` แล้วใช้ selector เช่น `getBudgetHouses()` และ `getNearSeaHouses()`, และแสดงบ้านแนะนำโดยดึงจาก `getPublicAccommodationRecommendations()` และกรองด้วย `getHousesBySourceIds()`
- `/houses` และ `/houses/search` ต้องใช้ `applyPublicAccommodationCoverImages()` หลังได้ list บ้าน เพื่อให้ `HouseCard` ใช้รูปปกจาก internal `accommodation_images`
- `/houses/[id]`: เป็น detail page แบบ orchestration ใช้ `getInternalHouseDetailByCode(id)` เพื่อดึงข้อมูลรายละเอียดบ้านพักในระบบแบบสมบูรณ์
- `/houses/[id]` ดึงรูปภาพทั้งหมดของที่พักโดยใช้ `getPublicHouseImagesByAccommodationId(house.sourceId)` ซึ่งจะแชร์รูปภาพกับระบบรูปภาพส่วนการจัดการ
- `/houses/[id]` นำเสนอข้อมูลสิ่งอำนวยความสะดวกโดยดึงข้อมูลแบบไดนามิกจาก `house.facilities` และแสดงผลรายละเอียดเพิ่มเติมต่าง ๆ ( bedroom details, check-in/out times, contact details เป็นต้น) อย่างมีสัดส่วน
- `/houses/[id]` เชื่อมโยงและแสดงกิจกรรมแนะนำตามพื้นที่โดยดึงผ่าน `getPublicAreaActivitiesForArea()` ใน `AreaActivitiesSection`
- `/houses/search`: ใช้ `getInternalHouses()` และ `filterHouses(...)` เพื่อทำการค้นหาและกรองบ้านพักในระบบทั้งหมด

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
- รูปบ้านจากระบบภายในเก็บใน Supabase table `accommodation_images` และ Storage bucket `accommodation-images`
- category ของรูปภายในมี `cover`, `exterior`, `interior`, `review`, `kitchen`, `bathroom`, `bedroom`
- DB enforce รูป `cover` ได้ 1 รูปต่อ accommodation ด้วย partial unique index; อย่าพึ่ง UI อย่างเดียว
- public gallery ใช้ `getPublicHouseImages()` เพื่อดึงรูปของบ้านที่ `accommodations.status = 'published'` เท่านั้น และจับคู่จาก `accommodations.code` กับ house id/code เช่น `9`, `DV-9`
- public card/list/search ใช้ `applyPublicAccommodationCoverImages()` เพื่อ overlay cover image จาก internal images โดย fallback external cover เดิม
- map `image_zone` เพื่อแยกหมวดรูป
- UI อยู่ที่ `app/(public)/houses/[id]/HouseImageGallery.tsx`
- ปฏิทินอยู่ที่ `app/(public)/houses/[id]/VillaCalendar.tsx` และใช้ logic จาก `lib/villa-calendar.ts`
- modal รายละเอียดวันของ `VillaCalendar` ต้อง render ด้วย portal ไปที่ `document.body` และใช้ z-index สูงกว่า content/card ของหน้า เพื่อไม่ให้บ้านแนะนำหรือ carousel ทับ popup
- ต้องไม่ให้ API token หลุดไปฝั่ง client
- remote image host ต้องอยู่ใน `next.config.ts`; Supabase Storage public URL ต้องรองรับทั้ง local (`localhost/127.0.0.1:54321`) และ host จาก `NEXT_PUBLIC_SUPABASE_URL`

## Adding A New House Field

ถ้าต้องเพิ่ม field ใหม่จาก external API ให้ทำตามลำดับนี้:

1. เพิ่ม field ใน `ExternalHouse`
2. เพิ่ม field ใน `House`
3. map field ใน `mapExternalHouse()`
4. ถ้า field ต้องออก API ให้เช็ก `toHouseApiData()`
5. ถ้า field ใช้ค้นหา/filter ให้เพิ่มใน `HouseSearchParams`
6. ถ้าเป็น amenity checkbox ให้เพิ่มใน `AMENITY_FILTERS` และ `SearchFilters`
7. ถ้าแสดงใน detail page ให้เพิ่มใน `getDetailRows()`

## External Houses (ระบบบ้านภายนอก)

ระบบบ้านภายนอก (Deville API) แยกออกมาเพื่อให้รองรับบ้านพักเดิมหรือพาร์ทเนอร์ภายนอก

- **เส้นทาง (Routes):**
  - `/houses/external` (หน้าแสดงรายการหลัก คล้ายกับบ้านพักในระบบ)
  - `/houses/external/search` (หน้าค้นหาและตัวกรองสำหรับบ้านภายนอก)
  - `/houses/external/[id]` (หน้ารายละเอียดบ้านภายนอกเดี่ยว)
- **API Endpoints:**
  - `/api/houses/external` (ดึงรายการบ้านภายนอกทั้งหมด)
  - `/api/houses/external/[id]` (ดึงรายละเอียดบ้านภายนอกรายหลัง)
- **Logic & Abstractions:**
  - logic สำหรับติดต่อกับ Deville API อยู่ใน `lib/houses.ts` เช่น `getExternalHouses()`, `getExternalHouseById()`
  - query search และ filter logic คล้ายกับ internal houses แต่แยก boundary ชัดเจนที่ prefix route `/houses/external`

