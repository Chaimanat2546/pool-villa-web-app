import Link from "next/link";
import { getBlogPath, type BlogPost } from "@/lib/blog";

type BlogCardProps = {
  post: BlogPost;
};

export function BlogCard({ post }: BlogCardProps) {
  return (
    <Link
      href={getBlogPath(post)}
      className="group block h-full cursor-pointer"
    >
      <article className="flex h-full w-72 flex-col gap-2 rounded-md border border-border shadow-sm transition-colors hover:border-secondary/50 hover:bg-muted/30 duration-300 group-hover:-translate-y-[2px] group-hover:shadow-md">
        <div className="relative aspect-[5/3] w-full overflow-hidden rounded-t-md bg-muted shadow-sm transition-all">
          {post.coverImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={post.coverImageUrl}
                alt={post.title}
                className="h-full w-full object-cover"
              />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-muted-foreground">
              ไม่มีรูปภาพ
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3 pb-2">
          <h3 className="line-clamp-2 text-lg font-semibold leading-tight text-primary">
            {post.title}
          </h3>
          {post.excerpt && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {post.excerpt.length > 20
                ? post.excerpt.slice(0, 20) + "..."
                : post.excerpt}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
