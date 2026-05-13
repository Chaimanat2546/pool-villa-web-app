import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatSeaDistance, getHouseById, type House } from "@/lib/houses";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function getDetailRows(house: House) {
  return [
    { label: "ราคา", value: house.price },
    { label: "ห้องนอน", value: house.bedroom },
    { label: "ห้องน้ำ", value: house.toilet },
    { label: "ระยะห่างจากทะเล", value: formatSeaDistance(house.farsea) },
    { label: "Wi-Fi", value: house.wifi },
    { label: "Grill", value: house.grill },
    { label: "Pet", value: house.pet },
    { label: "Snooker", value: house.snooker },
    { label: "Discotech", value: house.discotech },
    { label: "Fancyring", value: house.fancyring },
    { label: "Tabletennis", value: house.tabletennis },
    { label: "Slider", value: house.slider },
    { label: "Billard", value: house.billard },
    { label: "Swimming kid", value: house.swimmingKid },
    { label: "Swim", value: house.swim },
    { label: "Karaoke", value: house.karaoke },
    { label: "Airhockey", value: house.airhockey },
    { label: "Jacuzzi", value: house.jacuzzi },
    { label: "Bath", value: house.bath },
    { label: "People", value: house.people },
    { label: "ID", value: house.id },
  ];
}

export default function HouseDetailPage({ params }: PageProps) {
  return (
    <main className="mx-auto max-w-5xl p-6">
      <Suspense fallback={<p>กำลังโหลดข้อมูลบ้าน...</p>}>
        <HouseDetail params={params} />
      </Suspense>
    </main>
  );
}

async function HouseDetail({ params }: PageProps) {
  const { id } = await params;
  const house = await getHouseById(id);

  if (!house) {
    notFound();
  }

  return (
    <>
      {house.coverImage && (
        <Image
          src={house.coverImage}
          alt={`DV-${house.id}`}
          width={1200}
          height={700}
          priority
          className="mb-6 h-[500px] w-full rounded-xl object-cover"
        />
      )}

      <div className="space-y-2 text-lg">
        {getDetailRows(house).map((row) => (
          <p key={row.label}>
            {row.label}: {row.value}
          </p>
        ))}
      </div>
    </>
  );
}
