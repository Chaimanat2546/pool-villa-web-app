# Validation Checklist

> อ่านไฟล์นี้หลังแก้โค้ดเพื่อตรวจสอบว่าสิ่งที่เกี่ยวข้องยังทำงานได้ถูกต้อง

## คำสั่งหลังแก้โค้ด

```bash
npm run lint
npm run build
```

ถ้าแก้ frontend interaction ให้ทดสอบด้วย browser/dev server flow จริงด้วย เช่น:

```txt
/houses/search?q=9&minPrice=12000&maxPrice=30000
submit form
expected: URL ยังเก็บ query params ที่เลือกไว้
```

## Flow Checklist ตามงาน

- search filters ยัง submit query ถูก
- `/houses/[id]` ยังแสดง gallery, detail layout, sticky `VillaCalendar`, และบ้านพักแนะนำได้
- กดวันว่างใน `VillaCalendar` บน `/houses/[id]` แล้ว modal ต้องอยู่เหนือ carousel/card ทั้งหมด
- `HouseCard` ใน carousel ต้องไม่ให้รูปหรือ hover state ล้นไปซ้อน card อื่น
- `/admin/houses/new` และ `/admin/houses/[id]` tab รูปภาพต้อง preview รูปใหม่ได้, ลบ/กู้คืนรูปเดิมได้, และ upload เฉพาะตอน Save
- สร้าง/แก้ไขบ้านพร้อมรูปปกและรูปหมวด ภายนอก/ภายใน/รีวิว/ห้องครัว/ห้องน้ำ/ห้องนอน แล้ว `/houses`, `/houses/search`, `/houses/[id]` ต้องใช้รูป internal ถ้ามี
- เปลี่ยนรูปปกต้องยังมี cover ได้เพียง 1 รูปต่อบ้าน และไม่ทิ้ง orphan storage object ถ้า DB insert ล้มเหลว
- public ต้องอ่านรูปเฉพาะบ้าน `published`; บ้าน `archived` ต้องไม่ expose รูปผ่าน public helper/RLS
- `/admin/recommendations` ยัง block visible duplicate ต่อ `h_id`
- `/admin/recommendations` ยังรองรับ `ends_at` ว่างสำหรับบ้านแนะนำไม่มีวันหมดอายุ
- `/admin/houses/recommendations` ยัง block visible duplicate ต่อ `accommodation_id` และรองรับ `ends_at` ว่าง
- `/admin/blog/new` paste/import รูปแล้ว upload เฉพาะตอน save
- `/blog/{code}` redirect ไป canonical slug
- link ใน blog กดได้และ internal link ไม่เปิดแท็บใหม่
- `/admin/area-activities` ต้องสร้าง/แก้ไข/ลบกิจกรรมที่ผูกหลาย area ได้
- `/admin/area-activities` ต้องบันทึกได้ทั้งแบบไม่มีรูป, มี 1 รูป, และมี 2 รูป
- `/admin/area-activities` ต้องบล็อกการเพิ่มรูปเกิน 2 รูป
- `/houses/[id]` (internal) ต้องแสดงกิจกรรม active ตาม area ของบ้านพัก ต่อจาก `VillaCalendar`
- กิจกรรมที่ `hidden`, หมดอายุ, หรือยังไม่ถึง `starts_at` ต้องไม่แสดงฝั่ง public
- กิจกรรมที่ `ends_at = null` ต้องแสดงได้ตามเงื่อนไข active
- pagination ของกิจกรรมบน `/houses/[id]` ต้องทำงานเมื่อมีมากกว่า 4 รายการ
- `/houses/external/[id]` ต้องไม่แสดง section กิจกรรมแนะนำ
