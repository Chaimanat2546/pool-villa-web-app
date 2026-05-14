import { Suspense } from "react";
import {
  getBudgetHouses,
  getHouses,
  getHousesByIds,
  getNearSeaHouses,
} from "@/lib/houses";
import { getPublishedBlogPosts } from "@/lib/blog";
import { getPublicHouseRecommendations } from "@/lib/house-recommendations";
import { BlogSection } from "./BlogSection";
import { HouseSection } from "./HouseSection";
import Image from "next/image";
import { Search } from "lucide-react";

export default function HousesPage() {
  return (
    <div className="flex flex-col gap-10 pb-20">
      <HeroSearch />
      <div className="flex flex-col gap-16 px-16">
        <Suspense fallback={<div className="py-20 text-center">กำลังโหลดข้อมูล...</div>}>
          <HouseList />
        </Suspense>
      </div>
    </div>
  );
}

function HeroSearch() {
  return (
    <section className="relative aspect-[14/6] min-h-[300px] w-full overflow-hidden">
      <Image
        className="object-cover object-top"
        src="https://www.poolvillapattaya.co.th/assets/images/cover-pc.jpg"
        alt="poolvillapattaya"
        fill
        priority
        loading="eager"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
      <form
        action="/houses/search"
        method="get"
        className="absolute left-1/2 top-[80%] z-10 flex w-[min(92vw,760px)] -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-lg border border-border bg-background/95 p-2 shadow-xl backdrop-blur"
      >
        <label className="sr-only" htmlFor="hero-house-search">
          ค้นหาบ้านพัก
        </label>
        <input
          id="hero-house-search"
          name="q"
          type="search"
          placeholder="ค้นหารหัสบ้าน เช่น DV-9 หรือ 9"
          className="h-12 min-w-0 flex-1 bg-transparent px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-brand px-5 text-sm font-semibold text-brand-foreground transition-colors hover:bg-brand/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
          ค้นหา
        </button>
      </form>
    </section>
  );
}

async function HouseList() {
  const [houses, recommendations, blogPosts] = await Promise.all([
    getHouses(),
    getPublicHouseRecommendations(),
    getPublishedBlogPosts(3),
  ]);
  const recommendedHouses = getHousesByIds(
    houses,
    recommendations.map((recommendation) => recommendation.hId),
  );

  return (
    <>
      {recommendedHouses.length > 0 && (
        <HouseSection
          title="บ้านพักแนะนำ"
          houses={recommendedHouses}
          seeMoreHref="/houses/search?recommended=y"
        />
      )}

      <HouseSection
        title="บ้านพักใกล้ทะเล"
        houses={getNearSeaHouses(houses)}
        seeMoreHref="/houses/search?maxFarsea=5&sort=farsea_asc"
      />

      <BlogSection posts={blogPosts} />

      <HouseSection
        title="บ้านพักราคาประหยัด"
        houses={getBudgetHouses(houses)}
        seeMoreHref="/houses/search?maxPrice=7000&sort=price_asc"
      />
    </>
  );
}
