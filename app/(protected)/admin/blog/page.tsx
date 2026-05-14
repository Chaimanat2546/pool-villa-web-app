import Link from "next/link";
import { Suspense } from "react";
import { getAdminBlogPosts, getBlogPath } from "@/lib/blog";
import { requireRole } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export default function AdminBlogPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
            Admin dashboard
          </p>
          <h1 className="text-3xl font-bold">บทความ</h1>
        </div>

        <Button asChild>
          <Link href="/admin/blog/new">เขียนบทความ</Link>
        </Button>
      </div>

      <Suspense fallback={<p>Loading blog posts...</p>}>
        <AdminBlogList />
      </Suspense>
    </main>
  );
}

async function AdminBlogList() {
  await requireRole("admin");
  const posts = await getAdminBlogPosts();

  if (posts.length === 0) {
    return <p className="text-muted-foreground">ยังไม่มีบทความ</p>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-white shadow-sm">
      <div className="grid min-w-[680px] grid-cols-[1fr_140px_160px] gap-3 border-b bg-muted/40 px-4 py-3 text-sm font-medium text-muted-foreground">
        <span>บทความ</span>
        <span>รหัส</span>
        <span className="text-right">จัดการ</span>
      </div>

      <div className="divide-y">
        {posts.map((post) => (
          <div
            key={post.id}
            className="grid min-w-[680px] grid-cols-[1fr_140px_160px] gap-3 px-4 py-3"
          >
            <div>
              <p className="font-medium">{post.title}</p>
              <Link
                href={getBlogPath(post)}
                className="text-sm text-muted-foreground hover:underline"
                target="_blank"
              >
                {post.slug}
              </Link>
            </div>
            <p className="text-sm text-muted-foreground">{post.code}</p>
            <div className="flex justify-end">
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/blog/${post.id}`}>แก้ไข</Link>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
