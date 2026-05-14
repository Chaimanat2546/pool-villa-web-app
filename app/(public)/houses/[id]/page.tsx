import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  formatSeaDistance,
  getHouseById,
  getHouseImages,
  groupHouseImagesByZone,
  type House,
} from "@/lib/houses";
import { HouseImageGallery } from "./HouseImageGallery";
import { VillaCalendar } from "./VillaCalendar";

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

  const houseImages = await getHouseImages(id);
  const imageGroups = groupHouseImagesByZone(houseImages);

  return (
    <>
      <HouseImageGallery
        houseId={house.id}
        coverImage={house.coverImage}
        images={houseImages}
        imageGroups={imageGroups}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">รายละเอียดบ้านพัก</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {getDetailRows(house).map((row) => (
              <div key={row.label} className="rounded-md bg-slate-50 p-3">
                <p className="text-sm text-muted-foreground">{row.label}</p>
                <p className="mt-1 font-semibold text-slate-900">
                  {row.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <VillaCalendar villaId={house.id} />
      </div>
    </>
  );
}
