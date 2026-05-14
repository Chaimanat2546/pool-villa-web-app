import { BlogCard } from "@/app/(public)/blog/BlogCard";
import type { BlogPost } from "@/lib/blog";

type BlogSectionProps = {
  posts: BlogPost[];
};

export function BlogSection({ posts }: BlogSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold">บทความล่าสุด</h2>
      <div className="grid gap-6 md:grid-cols-3">
        {posts.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
