import { Suspense } from "react";
import {
  getBudgetHouses,
  getHouses,
  getHousesByIds,
  getNearSeaHouses,
} from "@/lib/houses";
import { getPublicHouseRecommendations } from "@/lib/house-recommendations";
import { HouseSection } from "./HouseSection";

export default function HousesPage() {
  return (
    <main className="p-6">
      <h1 className="mb-6 text-2xl font-bold">รายการบ้าน</h1>

      <Suspense fallback={<p>กำลังโหลดข้อมูลบ้าน...</p>}>
        <HouseList />
      </Suspense>
    </main>
  );
}

async function HouseList() {
  const [houses, recommendations] = await Promise.all([
    getHouses(),
    getPublicHouseRecommendations(),
  ]);
  const recommendedHouses = getHousesByIds(
    houses,
    recommendations.map((recommendation) => recommendation.hId),
  );

  return (
    <>
      {recommendedHouses.length > 0 && (
        <HouseSection title="บ้านแนะนำ" houses={recommendedHouses} />
      )}

      <HouseSection
        title="บ้านพักราคาประหยัด"
        houses={getBudgetHouses(houses)}
      />

      <HouseSection
        title="บ้านพักใกล้ทะเล"
        houses={getNearSeaHouses(houses)}
      />
    </>
  );
}
