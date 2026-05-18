# Admin House Management

> อ่านไฟล์นี้เมื่องานแตะ `/admin/houses`, `HouseCreateForm`, `AdminHouseImageManager`, `AdminHouseCalendar`, `SettingsManager` หรือ API routes ใน `/api/admin/houses`

## ภาพรวม

ระบบจัดการบ้านพัก (Inventory) ถูกย้ายจาก External API มาเป็นระบบภายใน (Supabase)

- logic อยู่ใน `lib/houses.ts`
- หน้าจัดการหลักอยู่ที่ `/admin/houses`
- หน้าสร้างบ้านใหม่อยู่ที่ `/admin/houses/new` ใช้ `HouseCreateForm`
- หน้าแก้ไขบ้านอยู่ที่ `/admin/houses/[id]` ใช้ `HouseCreateForm` เช่นกัน (reuse component เดียวกัน)
- หน้าจัดการ Lookup Data อยู่ที่ `/admin/houses/settings`

## HouseCreateForm — Tab Structure

UI ของแบบฟอร์มถูกแบ่งเป็น **Tab** เพื่อความเป็นระเบียบ:

- **รายละเอียดบ้าน:** ข้อมูลหลัก, ราคาหลัก, ราคา Agency ปกติ, ราคาคนเสริม, เงินประกัน, ที่ตั้ง, จำนวนห้อง, สระ, นโยบายสัตว์เลี้ยง, สิ่งอำนวยความสะดวก และเบอร์ติดต่อ (contacts)
- **ราคา:** ราคาตามวันในสัปดาห์ และปฏิทินราคาพิเศษ
- **รูปภาพ:** รูปปก 1 รูป และรูปบริเวณบ้านหมวด ภายนอก, ภายใน, รีวิว, ห้องครัว, ห้องน้ำ, ห้องนอน

ข้อมูลในฟอร์มจะถูกเก็บไว้ใน DOM (ใช้ CSS `hidden`) เพื่อให้ข้อมูลไม่หายขณะสลับ Tab และส่งไปบันทึกทีเดียวเมื่อกด Save

## รูปภาพใน HouseCreateForm

- ใช้ `AdminHouseImageManager` จัดการรูป
- รูปใหม่ preview ด้วย local blob ก่อน upload
- upload เฉพาะตอนกด Save ผ่าน `/api/admin/houses/[id]/images`
- ถ้าเปลี่ยนรูปปก ให้ mark รูปปกเดิมรอลบก่อน upload รูปปกใหม่ เพื่อไม่ชน unique cover constraint

## Flow การสร้างบ้านใหม่

1. save ข้อมูลหลักกับ `/api/admin/houses` ให้ได้ `id` ก่อน
2. upload รูปด้วย `/api/admin/houses/[id]/images`
3. ถ้า upload รูปล้มเหลว บ้านยังถูกสร้างแล้วและผู้ใช้ควรแก้ต่อในหน้า edit ได้

หน้าเพิ่มบ้านใหม่ต้องรองรับข้อมูลรายละเอียดบ้านชุดเดียวกับหน้าแก้ไข (สระ, สัตว์เลี้ยง, facilities, contacts)

`create_admin_accommodation` ต้องบันทึกรายละเอียดบ้านใน transaction เดียวกับข้อมูลหลัก ไม่ใช่ให้ผู้ใช้สร้างบ้านก่อนแล้วค่อยเข้าไปแก้ไขซ้ำ

## API Admin Houses

Admin house management ใช้ API routes ที่แยกจาก public API:

- `POST /api/admin/houses` → `createAdminHouse()` ใน `lib/houses.ts`
- `PATCH /api/admin/houses/[id]` → `updateAdminHouse()` ใน `lib/houses.ts`
- `GET /api/admin/houses/[id]/images` → ดึงรูปบ้านสำหรับ admin
- `POST /api/admin/houses/[id]/images` → upload รูปเข้า Storage bucket `accommodation-images` และบันทึก metadata ด้วย `addAdminHouseImages()`
- `DELETE /api/admin/houses/[id]/images` → ลบ metadata ด้วย `deleteAdminHouseImages()` และลบ object จาก Storage
- `POST /api/admin/houses/settings` → `createAdminHouseProvince/Zone/Area/Type/Facility()` ตาม `kind` payload

**API รูปบ้าน:**

- ใช้ `multipart/form-data` สำหรับ upload โดย field หลักคือ `files`; ส่ง `categories` คู่กับไฟล์เพื่อกำหนดหมวด
- category ที่รับได้คือ `cover`, `exterior`, `interior`, `review`, `kitchen`, `bathroom`, `bedroom`
- รองรับเฉพาะ JPEG, PNG, WebP, GIF และไฟล์ละไม่เกิน 10MB
- ห้าม expose service role; route ใช้ `requireAdminApi()` และ storage policy/RLS เป็นด่าน DB

## House Settings (Lookup Data)

ระบบ Settings จัดการข้อมูล lookup ที่ใช้ใน dropdown ของแบบฟอร์มบ้าน

- จัดการผ่าน `SettingsManager` Client Component ที่ `/admin/houses/settings`
- รองรับ kind: `province`, `zone`, `area`, `type`, `facility`
- `facility` มี field: `name`, `slug` (required), `icon` (optional)
- `zone` ต้องการ `province_id`
- `area` ต้องการ `accommodation_zone_id`

## Dual Pricing Model (Retail vs Agency)

ระบบรองรับการตั้งราคา 2 รูปแบบคู่กันในทุกจุด:

- **Retail Price (ราคาปกติ/ราคาพิเศษ):** ราคาสำหรับขายลูกค้าทั่วไป
- **Agency Price (ราคา Agency):** ราคาสำหรับตัวแทนจำหน่าย
- รองรับทั้งในส่วนของ ราคาหลัก (Normal Price), ราคาตามวันในสัปดาห์ (Weekday Prices) และราคาพิเศษรายวัน (Daily Date Prices)

## Daily Special Prices (AdminHouseCalendar)

การจัดการราคาพิเศษรายวันใช้ `AdminHouseCalendar` ใน `HouseCreateForm`

- แสดงผลแบบปฏิทินรายเดือน คล้ายกับฝั่งลูกค้า
- **การเพิ่มข้อมูล:**
  - **แบบช่วงวัน (Bulk):** ใช้ Input ด้านบนระบุ Start/End Date
  - **แบบเลือกบนปฏิทิน:** คลิกที่วันที่เพื่อเปิด Modal หรือ `Shift + คลิก` เพื่อเลือกช่วงวัน
- **การแก้ไข:** คลิกที่วันที่ที่มีราคาพิเศษอยู่แล้วเพื่อแก้ไขราคาหรือหมายเหตุ
- **การลบ:** คลิกที่วันที่แล้วกดปุ่ม "ลบ" ใน Modal
- **สถานะที่รองรับ:**
  - `ราคาพิเศษ` (ส้ม)
  - `วันหยุด` (เหลือง)
  - `รอโอน` (เขียว)
  - `ติดจองแล้ว` (แดง)

## House List Table

หน้า `/admin/houses` แสดงรายการบ้านพักในรูปแบบตารางที่กระชับ

- แสดงเฉพาะ: ชื่อบ้าน/รหัส, ประเภทที่พัก, สถานะ (เผยแพร่/ซ่อน) และปุ่มจัดการ
- ตัดข้อมูลที่ตั้ง, จำนวนคน และราคาออกเพื่อความสะอาดของ UI
- ค้นหาได้ด้วยรหัสหรือชื่อบ้าน และกรองตามสถานะได้
