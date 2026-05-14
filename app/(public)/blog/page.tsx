import { Suspense } from "react";
import { getPublishedBlogPosts } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

export default function BlogPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">บทความ</h1>
        <p className="mt-2 text-muted-foreground">
          เรื่องน่ารู้และไอเดียสำหรับการเลือกพูลวิลล่า
        </p>
      </div>

      <Suspense fallback={<p>กำลังโหลดบทความ...</p>}>
        <BlogList />
      </Suspense>
    </main>
  );
}

async function BlogList() {
  const posts = await getPublishedBlogPosts();

  if (posts.length === 0) {
    return <p className="text-muted-foreground">ยังไม่มีบทความ</p>;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <BlogCard key={post.id} post={post} />
      ))}
    </div>
  );
}
