import {
  filterHouses,
  getHouses,
  getHousesByIds,
  type HouseSearchParams,
} from "@/lib/houses";
import { getPublicHouseRecommendations } from "@/lib/house-recommendations";
import { Suspense } from "react";
import { HouseCard } from "../HouseCard";
import { SearchFilters } from "./SearchFilters";

type SearchPageProps = {
  searchParams: Promise<HouseSearchParams>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">ค้นหาบ้านพัก</h1>

      <Suspense fallback={<p>กำลังโหลดข้อมูลบ้าน...</p>}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const isRecommendedSearch = params.recommended === "y";
  const recommendationsPromise = isRecommendedSearch
    ? getPublicHouseRecommendations()
    : Promise.resolve<Awaited<ReturnType<typeof getPublicHouseRecommendations>>>(
        [],
      );
  const [allHouses, recommendations] = await Promise.all([
    getHouses(),
    recommendationsPromise,
  ]);
  const searchableHouses = isRecommendedSearch
    ? getHousesByIds(
        allHouses,
        recommendations.map((recommendation) => recommendation.hId),
      )
    : allHouses;
  const houses = filterHouses(searchableHouses, params);

  return (
    <>
      <SearchFilters
        key={JSON.stringify(params)}
        defaultQ={params.q}
        defaultMinPrice={params.minPrice}
        defaultMaxPrice={params.maxPrice}
        defaultMaxFarsea={params.maxFarsea}
        defaultPeople={params.people}
        defaultSort={params.sort}
        defaultRecommended={params.recommended}
        defaultWifi={params.wifi}
        defaultGrill={params.grill}
        defaultPet={params.pet}
        defaultSnooker={params.snooker}
        defaultDiscotech={params.discotech}
        defaultFancyring={params.fancyring}
        defaultTabletennis={params.tabletennis}
        defaultSlider={params.slider}
        defaultBillard={params.billard}
        defaultSwimmingKid={params.swimming_kid}
        defaultSwim={params.swim}
        defaultKaraoke={params.karaoke}
        defaultAirhockey={params.airhockey}
        defaultJacuzzi={params.jacuzzi}
        defaultBath={params.bath}
      />

      <p className="mb-6 text-sm text-gray-500">
        {isRecommendedSearch ? "พบบ้านพักแนะนำ" : "พบทั้งหมด"} {houses.length} รายการ
      </p>

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
        {houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </div>
    </>
  );
}
