import { notFound } from "next/navigation";
import { Suspense, type ComponentType } from "react";
import {
  Bath,
  BedDouble,
  Flame,
  Gamepad2,
  MapPin,
  Music2,
  PawPrint,
  Sparkles,
  Users,
  Waves,
  Wifi,
} from "lucide-react";
import {
  applyPublicAccommodationCoverImages,
  formatSeaDistance,
  getDisplayNightlyPrice,
  getInternalHouses,
  getInternalHouseDetailByCode,
  getPublicHouseImagesByAccommodationId,
  getHousesBySourceIds,
  groupHouseImagesByZone,
  type House,
  type PublicHouseDetail,
} from "@/lib/houses";
import { HouseSection } from "../HouseSection";
import { HouseImageGallery } from "./HouseImageGallery";
import { VillaCalendar } from "./VillaCalendar";
import { getPublicAccommodationRecommendations } from "@/lib/accommodation-recommendations";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

type DetailItem = {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

type AmenityItem = DetailItem;

function isEnabled(value: string) {
  return value.trim().toLowerCase() === "y";
}

function formatNightlyPrice(house: House) {
  const displayPrice = getDisplayNightlyPrice(house.price);

  return displayPrice ? `฿${displayPrice.toLocaleString()}` : "สอบถามราคา";
}

function getPoolLabel(swim: string) {
  const normalizedSwim = swim.trim().toLowerCase();

  if (!normalizedSwim || normalizedSwim === "n" || normalizedSwim === "ไม่มี") {
    return null;
  }

  if (normalizedSwim === "salt") return "สระว่ายน้ำระบบเกลือ";
  if (normalizedSwim === "chlorine") return "สระว่ายน้ำระบบคลอรีน";

  return "สระว่ายน้ำส่วนตัว";
}

function getOverviewItems(house: House): DetailItem[] {
  return [
    {
      label: "ราคาเริ่มต้น",
      value: `${formatNightlyPrice(house)} / คืน`,
      icon: Sparkles,
    },
    {
      label: "รองรับ",
      value: `${house.people} ท่าน`,
      icon: Users,
    },
    {
      label: "ห้องนอน",
      value: `${house.bedroom} ห้อง`,
      icon: BedDouble,
    },
    {
      label: "ห้องน้ำ",
      value: `${house.toilet} ห้อง`,
      icon: Bath,
    },
  ];
}

function getAmenityItems(house: House): AmenityItem[] {
  const poolLabel = getPoolLabel(house.swim);
  const amenities: AmenityItem[] = [];

  if (poolLabel) {
    amenities.push({ label: "สระว่ายน้ำ", value: poolLabel, icon: Waves });
  }

  if (isEnabled(house.wifi)) {
    amenities.push({ label: "Wi-Fi", value: "อินเทอร์เน็ตไร้สาย", icon: Wifi });
  }

  if (isEnabled(house.grill)) {
    amenities.push({ label: "ปิ้งย่าง", value: "มีเตาปิ้งย่าง", icon: Flame });
  }

  if (isEnabled(house.pet)) {
    amenities.push({ label: "สัตว์เลี้ยง", value: "นำสัตว์เลี้ยงเข้าได้", icon: PawPrint });
  }

  if (isEnabled(house.karaoke)) {
    amenities.push({ label: "คาราโอเกะ", value: "มีชุดคาราโอเกะ", icon: Music2 });
  }

  if (isEnabled(house.snooker)) {
    amenities.push({ label: "สนุกเกอร์", value: "มีโต๊ะสนุกเกอร์", icon: Gamepad2 });
  }

  if (isEnabled(house.billard)) {
    amenities.push({ label: "พูล/บิลเลียด", value: "มีโต๊ะพูล", icon: Gamepad2 });
  }

  if (isEnabled(house.slider)) {
    amenities.push({ label: "สไลเดอร์", value: "มีสไลเดอร์", icon: Waves });
  }

  if (isEnabled(house.swimmingKid)) {
    amenities.push({ label: "สระเด็ก", value: "มีสระสำหรับเด็ก", icon: Waves });
  }

  if (isEnabled(house.jacuzzi)) {
    amenities.push({ label: "Jacuzzi", value: "มีอ่างจากุซซี่", icon: Sparkles });
  }

  if (isEnabled(house.bath)) {
    amenities.push({ label: "อ่างอาบน้ำ", value: "มีอ่างอาบน้ำ", icon: Bath });
  }

  if (isEnabled(house.tabletennis)) {
    amenities.push({ label: "ปิงปอง", value: "มีโต๊ะปิงปอง", icon: Gamepad2 });
  }

  if (isEnabled(house.airhockey)) {
    amenities.push({ label: "Air hockey", value: "มีโต๊ะแอร์ฮอกกี้", icon: Gamepad2 });
  }

  if (isEnabled(house.discotech)) {
    amenities.push({ label: "ปาร์ตี้", value: "มีไฟ/เสียงสำหรับปาร์ตี้", icon: Music2 });
  }

  return amenities;
}

function OverviewItem({ item }: { item: DetailItem }) {
  const Icon = item.icon;

  return (
    <div className="rounded-md border border-border bg-card p-4 shadow-sm">
      <Icon className="h-5 w-5 text-accent" aria-hidden />
      <p className="mt-3 text-sm text-muted-foreground">{item.label}</p>
      <p className="mt-1 text-lg font-semibold text-primary">{item.value}</p>
    </div>
  );
}

function AmenityRow({ item }: { item: AmenityItem }) {
  const Icon = item.icon;

  return (
    <div className="flex min-h-16 items-center gap-3 border-b border-border py-3">
      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
      <div>
        <p className="font-medium text-primary">{item.label}</p>
        <p className="text-sm text-muted-foreground">{item.value}</p>
      </div>
    </div>
  );
}

function InternalHouseDetails({ house }: { house: PublicHouseDetail }) {
  const hasContacts = house.contacts.length > 0;
  const hasFacilities = house.facilities.length > 0;

  return (
    <section className="border-b border-border py-8">
      <h2 className="text-2xl font-bold text-primary">ข้อมูลจากระบบ</h2>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard label="ประเภทบ้าน" value={house.accommodationTypeName} />
        <InfoCard label="พื้นที่/โซน" value={formatAreaLabel(house)} />
        <InfoCard
          label="เช็คอิน"
          value={house.checkInTime ? `หลัง ${house.checkInTime}` : null}
        />
        <InfoCard
          label="เช็คเอาท์"
          value={house.checkOutTime ? `ก่อน ${house.checkOutTime}` : null}
        />
        <InfoCard
          label="ค่ามัดจำ"
          value={formatMoney(house.securityDepositAmount)}
        />
        <InfoCard
          label="ค่าคนเสริม"
          value={formatMoney(house.extraGuestPrice)}
        />
      </div>

      {house.addressDetails && (
        <div className="mt-6 rounded-md bg-muted/40 p-4">
          <p className="text-sm text-muted-foreground">ที่อยู่</p>
          <p className="mt-1 font-medium text-primary">{house.addressDetails}</p>
          {house.googleMapsUrl && (
            <a
              href={house.googleMapsUrl}
              className="mt-2 inline-flex text-sm font-semibold text-accent underline"
              target="_blank"
              rel="noreferrer"
            >
              เปิดแผนที่
            </a>
          )}
        </div>
      )}

      {(house.poolDescription || house.petPolicyDetails || house.additionalFeeDetails) && (
        <div className="mt-6 space-y-3">
          {house.poolDescription && (
            <TextCard label="รายละเอียดสระ" value={house.poolDescription} />
          )}
          {house.petPolicyDetails && (
            <TextCard label="นโยบายสัตว์เลี้ยง" value={house.petPolicyDetails} />
          )}
          {house.additionalFeeDetails && (
            <TextCard label="ค่าใช้จ่ายเพิ่มเติม" value={house.additionalFeeDetails} />
          )}
        </div>
      )}

      {hasFacilities && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">Facilities</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {house.facilities.map((facility) => (
              <span
                key={facility.id}
                className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
              >
                {facility.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {hasContacts && (
        <div className="mt-6">
          <p className="text-sm text-muted-foreground">ติดต่อ</p>
          <div className="mt-2 space-y-2">
            {house.contacts.map((contact, index) => (
              <div
                key={`${contact.phoneNumber}-${index}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <div>
                  <p className="font-medium text-primary">
                    {contact.name ?? "เจ้าหน้าที่"}
                  </p>
                  {contact.role && (
                    <p className="text-xs text-muted-foreground">
                      {contact.role}
                    </p>
                  )}
                </div>
                <span className="text-sm font-semibold text-accent">
                  {contact.phoneNumber}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function InfoCard({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;

  return (
    <div className="rounded-md bg-muted/40 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-primary">{value}</p>
    </div>
  );
}

function TextCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm text-primary leading-6">{value}</p>
    </div>
  );
}

function formatMoney(value: number | null) {
  if (value === null) return null;

  return `฿${Math.round(value).toLocaleString()}`;
}

function formatAreaLabel(house: PublicHouseDetail) {
  const parts = [house.areaName, house.zoneName, house.provinceName].filter(
    Boolean,
  ) as string[];

  return parts.length > 0 ? parts.join(" · ") : null;
}

export default function HouseDetailPage({ params }: PageProps) {
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
      <Suspense fallback={<p>กำลังโหลดข้อมูลบ้าน...</p>}>
        <HouseDetail params={params} />
      </Suspense>
    </main>
  );
}

async function HouseDetail({ params }: PageProps) {
  const { id } = await params;
  const [house, houses, recommendations] = await Promise.all([
    getInternalHouseDetailByCode(id),
    getInternalHouses(),
    getPublicAccommodationRecommendations(),
  ]);

  if (!house) {
    notFound();
  }

  const displayCode = /[a-z]/i.test(house.code)
    ? house.code
    : `DV-${house.code}`;
  const displayTitle = house.name?.trim() || displayCode;

  const publicHouseImages = await getPublicHouseImagesByAccommodationId(
    house.sourceId,
  );

  const publicCoverImage =
    publicHouseImages.find((image) => image.zone === "cover")?.url ?? null;
  const houseImages = publicHouseImages.filter(
    (image) => image.zone !== "cover",
  );
  const coverImage = publicCoverImage ?? house.coverImage;
  const imageGroups = groupHouseImagesByZone(houseImages);
  const overviewItems = getOverviewItems(house);
  const amenityItems = getAmenityItems(house);
  const recommendedHouses = await applyPublicAccommodationCoverImages(
    getHousesBySourceIds(
      houses,
      recommendations
        .map((recommendation) => recommendation.accommodationId)
        .filter((accommodationId) => accommodationId !== house.sourceId),
    ),
  );

  return (
    <>
      <header className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Pool Villa Pattaya
        </p>
        <h1 className="mt-2 text-4xl font-bold leading-tight text-primary md:text-5xl">
          {displayTitle}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground md:text-base">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4" aria-hidden />
            บ้านพักของเรา
          </span>
          <span className="hidden text-border sm:inline">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Waves className="h-4 w-4" aria-hidden />
            {formatSeaDistance(house.farsea)}
          </span>
          <span className="hidden text-border sm:inline">|</span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden />
            รองรับ {house.people} ท่าน
          </span>
        </div>
      </header>

      <HouseImageGallery
        houseTitle={displayTitle}
        coverImage={coverImage}
        images={houseImages}
        imageGroups={imageGroups}
      />

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <section className="border-b border-border pb-8">
            <h2 className="text-2xl font-bold text-primary">เกี่ยวกับบ้านพัก</h2>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              บ้านพักพูลวิลล่า {displayTitle} สำหรับกลุ่มที่ต้องการพื้นที่พักผ่อน
              มี {house.bedroom} ห้องนอน {house.toilet} ห้องน้ำ รองรับได้ประมาณ{" "}
              {house.people} ท่าน และอยู่{formatSeaDistance(house.farsea)}
            </p>
          </section>

          <section className="border-b border-border py-8">
            <h2 className="text-2xl font-bold text-primary">ข้อมูลโดยรวม</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {overviewItems.map((item) => (
                <OverviewItem key={item.label} item={item} />
              ))}
            </div>
          </section>

          <section className="border-b border-border py-8">
            <h2 className="text-2xl font-bold text-primary">สิ่งที่บ้านนี้มีให้</h2>
            {amenityItems.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-x-8 sm:grid-cols-2">
                {amenityItems.map((item) => (
                  <AmenityRow key={item.label} item={item} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">
                ยังไม่มีข้อมูลสิ่งอำนวยความสะดวกเพิ่มเติม
              </p>
            )}
          </section>

          <InternalHouseDetails house={house} />

          <section className="py-8">
            <h2 className="text-2xl font-bold text-primary">รายละเอียดเพิ่มเติม</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">รหัสบ้าน</p>
                <p className="mt-1 font-semibold text-primary">{displayCode}</p>
              </div>
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">ระยะห่างจากทะเล</p>
                <p className="mt-1 font-semibold text-primary">
                  {formatSeaDistance(house.farsea)}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">ประเภทสระ</p>
                <p className="mt-1 font-semibold text-primary">
                  {getPoolLabel(house.swim) ?? "ไม่ระบุ"}
                </p>
              </div>
              <div className="rounded-md bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">ราคา</p>
                <p className="mt-1 font-semibold text-primary">
                  {formatNightlyPrice(house)} / คืน
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <VillaCalendar
              villaId={house.sourceId}
              source="internal"
            />
          </div>
        </aside>
      </div>

      {recommendedHouses.length > 0 && (
        <div className="mt-12 border-t border-border pt-10">
          <HouseSection
            title="บ้านพักแนะนำ"
            houses={recommendedHouses}
            seeMoreHref="/houses/search?recommended=y"
          />
        </div>
      )}
    </>
  );
}
