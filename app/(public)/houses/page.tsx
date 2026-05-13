import { Suspense } from "react";
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

type HouseApiResponse = {
  data: House[];
};

type House = {
  id: string;
  coverImage: string | null;
  toilet: string | null;
  bedroom: string | null;
  farsea: string | null;
  price: string | null;
  wifi: string | null;
  grill: string | null;
  pet: string | null;
  snooker: string | null;
  discotech: string | null;
  fancyring: string | null;
  tabletennis: string | null;
  slider: string | null;
  billard: string | null;
  swimming_kid: string | null;
  swim: string | null;
  karaoke: string | null;
  airhockey: string | null;
  jacuzzi: string | null;
  bath: string | null;
  people: string | null;
};

async function getHouses(): Promise<HouseApiResponse> {
  const res = await fetch("http://localhost:3000/api/houses", {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch houses");
  }

  return res.json() as Promise<HouseApiResponse>;
}

async function HouseList() {
  const result = await getHouses();

  const houses = result.data;

  return (
    <>
      <HouseSection title="บ้านแนะนำ (mock data)" houses={houses.slice(0, 12)} />

      <HouseSection
        title="บ้านพักราคาประหยัด"
        houses={houses
          .filter(
            (house) =>
              house.price && Number(house.price.replace(/,/g, "")) <= 7000,
          )
          .sort((a, b) => {
            const priceA = Number(a.price?.replace(/,/g, "") ?? 0);
            const priceB = Number(b.price?.replace(/,/g, "") ?? 0);

            return priceA - priceB;
          })
          .slice(0, 12)}
      />

      <HouseSection title="บ้านพักใกล้ทะเล" houses={houses.filter((houses) => houses.farsea && Number(houses.farsea.replace(/,/g, "")) <= 4).sort((a, b) => {
        const farseaA = Number(a.farsea?.replace(/,/g, "") ?? 0);
        const farseaB = Number(b.farsea?.replace(/,/g, "") ?? 0);

        return farseaA - farseaB;
      }).slice(0, 12)} />
    </>
  );
}
