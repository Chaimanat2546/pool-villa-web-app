import { Suspense } from "react";
import {
  filterHouses,
  getExternalHouses,
  getHousesByIds,
  type HouseSearchParams,
} from "@/lib/houses";
import { getPublicHouseRecommendations } from "@/lib/house-recommendations";
import { HouseCard } from "../../HouseCard";
import { SearchFilters } from "../../search/SearchFilters";

type SearchPageProps = {
  searchParams: Promise<HouseSearchParams>;
};

export default function ExternalSearchPage({ searchParams }: SearchPageProps) {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold text-primary">
        ค้นหาบ้านพัก (External)
      </h1>

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
  const [houses, recommendations] = await Promise.all([
    getExternalHouses(),
    recommendationsPromise,
  ]);
  const recommendedHouses = isRecommendedSearch
    ? getHousesByIds(
        houses,
        recommendations.map((recommendation) => recommendation.hId),
      )
    : houses;
  const filteredHouses = filterHouses(recommendedHouses, params);

  return (
    <>
      <SearchFilters
        key={JSON.stringify(params)}
        action="/houses/external/search"
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
        {isRecommendedSearch ? "พบบ้านพักแนะนำ" : "พบทั้งหมด"} {filteredHouses.length} รายการ
      </p>

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-5">
        {filteredHouses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </div>
    </>
  );
}
