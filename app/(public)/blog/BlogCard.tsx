import Link from "next/link";
import { getBlogPath, type BlogPost } from "@/lib/blog";

type BlogCardProps = {
  post: BlogPost;
};

export function BlogCard({ post }: BlogCardProps) {
  return (
    <article className="overflow-hidden rounded-lg border bg-white">
      {post.coverImageUrl && (
        <Link href={getBlogPath(post)} className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="aspect-video w-full object-cover"
          />
        </Link>
      )}

      <div className="space-y-3 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {post.code}
        </p>
        <h2 className="text-xl font-semibold leading-tight">
          <Link href={getBlogPath(post)}>{post.title}</Link>
        </h2>
        {post.excerpt && (
          <p className="line-clamp-3 text-sm text-muted-foreground">
            {post.excerpt}
          </p>
        )}
      </div>
    </article>
  );
}
