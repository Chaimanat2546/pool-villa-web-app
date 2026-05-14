import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getAdminBlogPostById } from "@/lib/blog";
import { requireRole } from "@/lib/auth/session";
import { BlogPostForm } from "../BlogPostForm";

type EditBlogPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default function EditBlogPostPage({ params }: EditBlogPostPageProps) {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold">แก้ไขบทความ</h1>
      </div>

      <Suspense fallback={<p>Loading editor...</p>}>
        <EditBlogPost params={params} />
      </Suspense>
    </div>
  );
}

async function EditBlogPost({ params }: EditBlogPostPageProps) {
  await requireRole("admin");
  const { id } = await params;
  const post = await getAdminBlogPostById(id);

  if (!post) {
    notFound();
  }

  return <BlogPostForm post={post} />;
}
