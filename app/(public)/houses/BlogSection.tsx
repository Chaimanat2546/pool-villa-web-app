import { BlogCard } from "@/app/(public)/blog/BlogCard";
import type { BlogPost } from "@/lib/blog";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HouseCarousel } from "./HouseCarousel";

type BlogSectionProps = {
  posts: BlogPost[];
};

export function BlogSection({ posts }: BlogSectionProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="flex w-full flex-col gap-4 overflow-hidden py-4">
      <header className="flex w-full items-end justify-between">
        <h2 className="text-2xl font-bold md:text-3xl text-primary">บทความล่าสุด</h2>
        <Link
          href="/blog"
          className="group flex items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:text-primary"
        >
          ดูเพิ่มเติม
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </header>

      <div className="w-full max-w-7xl">
        <HouseCarousel>
          {posts.map((post) => (
            <div key={post.id} className="flex-none snap-start">
              <BlogCard post={post} />
            </div>
          )).slice(0, 8)}
        </HouseCarousel>
      </div>
    </section>
  );
}
