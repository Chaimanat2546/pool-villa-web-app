# Blog

> อ่านไฟล์นี้เมื่องานแตะ `blog_posts` table, `lib/blog.ts`, `/blog` pages, `BlogPostForm`, Tiptap editor หรือ `/api/blog`

## ภาพรวม

ระบบ blog เป็น public read, admin write

- logic อยู่ใน `lib/blog.ts`
- public pages อยู่ใน `app/(public)/blog`
- admin pages อยู่ใน `app/(protected)/admin/blog`
- API routes อยู่ใน `app/api/blog`
- editor ใช้ Tiptap ใน `BlogPostForm`
- content เก็บเป็น Tiptap JSON ใน `content_json`
- plain text สำหรับค้นหา/preview เก็บใน `content_text`
- ไม่มี category, status, publish time
- public อ่านทุกบทความจาก `blog_posts`
- helper ชื่อ `getPublishedBlogPosts` ยังใช้อยู่เป็นชื่อเดิม แต่ตอนนี้หมายถึง public blog posts ทั้งหมด

## รหัสและ Slug

- `code` สุ่มรูปแบบ `pvxxxxxxxx`
- ถ้า code ซ้ำ DB unique constraint จะ reject และ `createBlogPost()` retry ได้สูงสุด 5 ครั้ง
- `slug` เก็บใน DB แต่สร้างจากชื่อบทความและ code
- canonical path คือ `/blog/{title-slug}-i.{code}`
- ถ้าเข้า `/blog/{code}` เช่น `/blog/pv001` ต้อง redirect ไป canonical path
- หา post จาก URL โดย extract code จาก suffix `-i.{code}`

## รูปใน Blog

- cover image ต้องมาจาก file upload และเก็บ URL ใน `cover_image_url`
- content images จาก import file หรือ clipboard ต้อง preview เป็น local blob ก่อน
- ห้าม upload content image ทันทีตอน paste/import เพราะรูปจะค้างใน storage ถ้าผู้ใช้ไม่ save
- ตอน save ให้ upload cover และ content images ทีเดียวผ่าน `/api/blog/images`
- หลัง upload ให้ replace local blob URL ใน `content_json` เป็น public storage URL
- storage bucket ปัจจุบันคือ `blog-images`

## ลิงก์ใน Blog

- แนบลิงก์ผ่าน link mark ของ Tiptap
- internal link ให้ใช้ path ขึ้นต้น `/` เช่น `/houses/123`
- external link ใช้ full URL หรือให้ editor normalize เช่น `example.com` เป็น `https://example.com`
- public renderer `BlogContent` ต้อง render internal link ด้วย Next `Link`
- link ในหน้าอ่านและใน editor ต้องมี visual state ที่ดูออกว่ากดได้
