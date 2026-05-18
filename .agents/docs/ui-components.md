# UI Components, Frontend & Theme

> อ่านไฟล์นี้เมื่องานแตะ UI components, UX rules หรือ theme/color tokens

## UI Components Catalogue

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
- `HouseCreateForm` เป็น client component สำหรับ admin สร้าง/แก้ไขบ้านพัก (อยู่ใน `/admin/houses/new`)
- `AdminHouseImageManager` เป็น client component สำหรับเลือก preview ลบ/กู้คืน และ upload รูปบ้านใน `HouseCreateForm`
- `AdminHouseCalendar` เป็น client component สำหรับจัดการ Daily Special Prices ใน `HouseCreateForm`
- `SettingsManager` เป็น client component สำหรับจัดการ Province, Zone, Area, Type และ Facility (อยู่ใน `/admin/houses/settings`)
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
