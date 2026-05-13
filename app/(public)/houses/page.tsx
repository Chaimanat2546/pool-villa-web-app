import { Suspense } from "react";
import { getBudgetHouses, getHouses, getNearSeaHouses } from "@/lib/houses";
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
  const houses = await getHouses();

  return (
    <>
      <HouseSection title="บ้านแนะนำ" houses={houses.slice(0, 12)} />

      <HouseSection
        title="บ้านพักราคาประหยัด"
        houses={getBudgetHouses(houses)}
      />

      <HouseSection title="บ้านพักใกล้ทะเล" houses={getNearSeaHouses(houses)} />
    </>
  );
}
