# Accommodation Recommendations (Internal Houses)

> อ่านไฟล์นี้เมื่องานแตะ `accommodation_recommendations` table, `lib/accommodation-recommendations.ts` หรือ `/admin/houses/recommendations`

## ภาพรวม

ระบบบ้านแนะนำสำหรับบ้านพักที่สร้างในระบบ (internal accommodations)

- logic อยู่ใน `lib/accommodation-recommendations.ts`
- เก็บข้อมูลใน Supabase table `accommodation_recommendations`

## กฎ

- `ends_at = null` หมายถึงบ้านแนะนำไม่มีวันหมดอายุ
- status มีแค่ `visible` และ `hidden`
- อนุญาตให้มี hidden/draft หลายรายการต่อ `accommodation_id`
- อนุญาตให้มี visible ได้แค่ 1 รายการต่อ `accommodation_id`
- ห้ามสร้างหรือเปลี่ยน record ให้เป็น visible ถ้า `accommodation_id` นั้นมี visible record อยู่แล้ว
- DB ต้อง enforce ด้วย partial unique index หรือ constraint ไม่ใช่พึ่ง UI อย่างเดียว
- API contract ใช้ snake_case เช่น `accommodation_id`, `starts_at`, `ends_at`

## REST API Routes (Admin)

API routes ในระบบสำหรับการจัดการ accommodation recommendations (ต้องผ่าน `requireAdminApi()`):

- `GET /api/admin/accommodations/recommendations`
  - ดึงรายการ recommendations ทั้งหมดที่จัดเรียงตาม `created_at` ล่าสุด
- `POST /api/admin/accommodations/recommendations`
  - สร้าง recommendation ใหม่ โดยรับ payload: `{ accommodation_id, starts_at, ends_at, status }`
  - คืนสถานะ `201 Created`
  - คืนสถานะ `409 Conflict` หากมี `status = 'visible'` สำหรับ `accommodation_id` นี้อยู่แล้ว (ป้องกัน duplication ในระบบ)
- `PATCH /api/admin/accommodations/recommendations/[id]`
  - อัปเดตข้อมูล recommendation ที่กำหนด
  - คืนสถานะ `409 Conflict` หากอัปเดตสถานะเป็น `visible` แต่มีรายการ visible ของบ้านพักนั้นอยู่แล้ว
- `DELETE /api/admin/accommodations/recommendations/[id]`
  - ลบข้อมูล recommendation ออกจากระบบ

## Admin UI Flow

จัดการข้อมูลผ่าน `/admin/houses/recommendations` ด้วย `AccommodationRecommendationManager` (Client Component):

- **บันทึกแบบ Single Save:** มีปุ่มบันทึกรวมในระบบ
- **การตรวจจับความขัดแย้ง (Conflict Validation):** จะแสดงข้อความแจ้งเตือนสีแดง "This accommodation already has a visible recommendation." อย่างสวยงามเมื่อผู้ใช้พยายามบันทึกรายการซ้ำซ้อน
- **การป้อนข้อมูล:** ดึงข้อมูลวันเริ่มต้นโดยใช้ input ปฏิทิน และสามารถระบุวันสิ้นสุดเป็นว่างได้ (null)

