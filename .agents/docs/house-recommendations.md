# House Recommendations

> อ่านไฟล์นี้เมื่องานแตะ `house_recommendations` table, `lib/house-recommendations.ts` หรือ `/admin/recommendations`

## ภาพรวม

ระบบบ้านแนะนำเก็บใน Supabase table `house_recommendations`

- logic อยู่ใน `lib/house-recommendations.ts`
- admin จัดการผ่าน `/admin/recommendations`
- public อ่านผ่าน helper/API ได้เฉพาะรายการที่:
  - `status = "visible"`
  - `starts_at <= today`
  - `ends_at IS NULL` หรือ `ends_at >= today`

## กฎ

- `ends_at = null` หมายถึงบ้านแนะนำไม่มีวันหมดอายุ
- status มีแค่ `visible` และ `hidden`
- อนุญาตให้มี hidden/draft หลายรายการต่อ `h_id`
- อนุญาตให้มี visible ได้แค่ 1 รายการต่อ `h_id`
- ห้ามสร้างหรือเปลี่ยน record ให้เป็น visible ถ้า `h_id` นั้นมี visible record อยู่แล้ว
- DB ต้อง enforce ด้วย partial unique index หรือ constraint ไม่ใช่พึ่ง UI อย่างเดียว
- ก่อนสร้าง recommendation ต้องเช็กว่า `h_id` มีอยู่จริงใน external house API ด้วย `getHouseById`
- API contract ใช้ snake_case เช่น `h_id`, `starts_at`, `ends_at`
