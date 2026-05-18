import { notFound } from "next/navigation";
import { Suspense, type ComponentType } from "react";
import {
  Bath,
  BedDouble,
  CircleCheck,
  ExternalLink,
  Flame,
  Gamepad2,
  MapPin,
  Music2,
  PawPrint,
  Phone,
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
import { getPublicAreaActivitiesForArea } from "@/lib/area-activities";
import { AreaActivitiesSection } from "./AreaActivitiesSection";

const AREA_ACTIVITY_PAGE_SIZE = 4;

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

type AmenityItem = {
  id: string;
  label: string;
  value?: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

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

function getFacilityIcon(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();

  if (["wifi", "wi-fi"].includes(normalizedSlug)) return Wifi;
  if (["grill", "bbq", "barbecue"].includes(normalizedSlug)) return Flame;
  if (["pet", "pets", "pet-friendly"].includes(normalizedSlug)) return PawPrint;
  if (["karaoke", "discotech", "disco", "party"].includes(normalizedSlug)) {
    return Music2;
  }
  if (
    [
      "snooker",
      "billard",
      "billiard",
      "pool-table",
      "tabletennis",
      "table-tennis",
      "pingpong",
      "airhockey",
      "air-hockey",
    ].includes(normalizedSlug)
  ) {
    return Gamepad2;
  }
  if (
    [
      "slider",
      "water-slider",
      "swimming_kid",
      "swimming-kid",
      "kid-pool",
      "kids-pool",
    ].includes(normalizedSlug)
  ) {
    return Waves;
  }
  if (["jacuzzi", "bath", "bathtub"].includes(normalizedSlug)) return Bath;

  return CircleCheck;
}

function getAmenityItems(house: PublicHouseDetail): AmenityItem[] {
  return house.facilities.map((facility) => ({
    id: facility.id,
    label: facility.name,
    icon: getFacilityIcon(facility.slug),
  }));
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
        {item.value && (
          <p className="text-sm text-muted-foreground">{item.value}</p>
        )}
      </div>
    </div>
  );
}

function AdditionalDetails({
  house,
  displayCode,
}: {
  house: PublicHouseDetail;
  displayCode: string;
}) {
  const hasContacts = house.contacts.length > 0;

  return (
    <section className="py-8">
      <h2 className="text-2xl font-bold text-primary">รายละเอียดเพิ่มเติม</h2>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <InfoCard label="รหัสบ้าน" value={displayCode} />
        <InfoCard label="ระยะห่างจากทะเล" value={formatSeaDistance(house.farsea)} />
        <InfoCard label="ประเภทสระ" value={getPoolLabel(house.swim) ?? "ไม่ระบุ"} />
        <InfoCard label="ราคา" value={`${formatNightlyPrice(house)} / คืน`} />
        <InfoCard label="ประเภทบ้าน" value={house.accommodationTypeName} />
        <InfoCard label="พื้นที่/โซน" value={formatAreaLabel(house)} />
        <InfoCard
          label="เช็คอิน"
          value={house.checkInTime ? `หลัง ${house.checkInTime.slice(0, 5)} น.` : null}
        />
        <InfoCard
          label="เช็คเอาท์"
          value={house.checkOutTime ? `ก่อน ${house.checkOutTime.slice(0, 5)} น.` : null}
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
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-accent underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              เปิดแผนที่
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
          )}
        </div>
      )}

      {(house.bedroomDetails ||
        house.poolDescription ||
        house.petPolicyDetails ||
        house.additionalDetails ||
        house.additionalFeeDetails) && (
          <div className="mt-6 space-y-3">
            {house.bedroomDetails && (
              <TextCard label="รายละเอียดห้องนอน" value={house.bedroomDetails} />
            )}
            {house.poolDescription && (
              <TextCard label="รายละเอียดสระ" value={house.poolDescription} />
            )}
            {house.petPolicyDetails && (
              <TextCard label="นโยบายสัตว์เลี้ยง" value={house.petPolicyDetails} />
            )}
            {house.additionalDetails && (
              <TextCard label="รายละเอียดอื่นๆ" value={house.additionalDetails} />
            )}
            {house.additionalFeeDetails && (
              <TextCard label="ค่าใช้จ่ายเพิ่มเติม" value={house.additionalFeeDetails} />
            )}
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
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                  <Phone className="h-3.5 w-3.5" aria-hidden />
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
  const systemLocationLabel = formatAreaLabel(house);
  const locationLabel = systemLocationLabel ?? "บ้านพักของเรา";
  const recommendedSourceIds = recommendations
    .map((recommendation) => recommendation.accommodationId)
    .filter((accommodationId) => accommodationId !== house.sourceId);
  const areaActivities = await getPublicAreaActivitiesForArea({
    areaId: house.accommodationAreaId,
    page: 1,
    pageSize: AREA_ACTIVITY_PAGE_SIZE,
  });

  const [publicHouseImages, recommendedHouses] = await Promise.all([
    getPublicHouseImagesByAccommodationId(house.sourceId),
    applyPublicAccommodationCoverImages(
      getHousesBySourceIds(houses, recommendedSourceIds),
    ),
  ]);

  const publicCoverImage =
    publicHouseImages.find((image) => image.zone === "cover")?.url ?? null;
  const houseImages = publicHouseImages.filter(
    (image) => image.zone !== "cover",
  );
  const coverImage = publicCoverImage ?? house.coverImage;
  const imageGroups = groupHouseImagesByZone(houseImages);
  const overviewItems = getOverviewItems(house);
  const amenityItems = getAmenityItems(house);

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
            {locationLabel}
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
                  <AmenityRow key={item.id} item={item} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted-foreground">
                ยังไม่มีข้อมูลสิ่งอำนวยความสะดวกเพิ่มเติม
              </p>
            )}
          </section>

          <AdditionalDetails house={house} displayCode={displayCode} />
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24">
            <VillaCalendar
              villaId={house.sourceId}
              source="internal"
            />
            <AreaActivitiesSection
              areaId={house.accommodationAreaId}
              activities={areaActivities.activities}
              totalCount={areaActivities.totalCount}
              pageSize={AREA_ACTIVITY_PAGE_SIZE}
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
