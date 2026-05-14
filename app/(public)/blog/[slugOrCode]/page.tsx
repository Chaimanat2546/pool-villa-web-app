import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import {
  getBlogPath,
  getPublishedBlogPostBySlugOrCode,
  type BlogPost,
} from "@/lib/blog";
import { BlogContent } from "../BlogContent";

type BlogDetailPageProps = {
  params: Promise<{
    slugOrCode: string;
  }>;
};

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <Suspense fallback={<p>กำลังโหลดบทความ...</p>}>
        <BlogDetail params={params} />
      </Suspense>
    </main>
  );
}

async function BlogDetail({ params }: BlogDetailPageProps) {
  const { slugOrCode } = await params;
  const post = await getPublishedBlogPostBySlugOrCode(slugOrCode);

  if (!post) {
    notFound();
  }

  const canonicalPath = getBlogPath(post);

  if (decodeURIComponent(slugOrCode) !== post.slug) {
    redirect(canonicalPath);
  }

  return <BlogArticle post={post} />;
}

function BlogArticle({ post }: { post: BlogPost }) {
  return (
    <article>
      <header className="mb-8">
        <p className="mb-3 text-sm font-medium uppercase tracking-wide text-muted-foreground">
          {post.code}
        </p>
        <h1 className="text-4xl font-bold leading-tight">{post.title}</h1>
        {post.excerpt && (
          <p className="mt-4 text-xl leading-8 text-muted-foreground">
            {post.excerpt}
          </p>
        )}
      </header>

      {post.coverImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt={post.title}
          className="mb-8 aspect-video w-full rounded-lg object-cover"
        />
      )}

      <BlogContent content={post.contentJson.content ?? []} />
    </article>
  );
}
