import { Suspense } from "react";
import { requireRole } from "@/lib/auth/session";
import { BlogPostForm } from "../BlogPostForm";

export default function NewBlogPostPage() {
  return (
    <div className="flex w-full max-w-4xl flex-col gap-6">
      <div>
        <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Admin dashboard
        </p>
        <h1 className="text-3xl font-bold">เขียนบทความ</h1>
      </div>

      <Suspense fallback={<p>Loading editor...</p>}>
        <NewBlogPost />
      </Suspense>
    </div>
  );
}

async function NewBlogPost() {
  await requireRole("admin");

  return <BlogPostForm />;
}
