import {
  filterHouses,
  getHouses,
  type HouseSearchParams,
} from "@/lib/houses";
import { Suspense } from "react";
import { HouseCard } from "../HouseCard";
import { SearchFilters } from "./SearchFilters";

type SearchPageProps = {
  searchParams: Promise<HouseSearchParams>;
};

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-3xl font-bold">ค้นหาบ้านพัก</h1>

      <Suspense fallback={<p>กำลังโหลดข้อมูลบ้าน...</p>}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const houses = filterHouses(await getHouses(), params);

  return (
    <>
      <SearchFilters
        key={JSON.stringify(params)}
        defaultQ={params.q}
        defaultMinPrice={params.minPrice}
        defaultMaxPrice={params.maxPrice}
        defaultPeople={params.people}
        defaultSort={params.sort}
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
        พบทั้งหมด {houses.length} รายการ
      </p>

      <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
        {houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </div>
    </>
  );
}
