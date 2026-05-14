import Image from "next/image";
import Link from "next/link";
import {
  formatSeaDistance,
  getDisplayNightlyPrice,
  type HouseCardData,
} from "@/lib/houses";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBath, faBed, faLocationDot } from "@fortawesome/free-solid-svg-icons";

type HouseCardProps = {
  house: HouseCardData;
};

export function HouseCard({ house }: HouseCardProps) {
  const displayPrice = getDisplayNightlyPrice(house.price);

  return (
    <Link
      href={`/houses/${house.id}`}
      className="group relative z-0 block w-[280px] flex-none snap-start cursor-pointer md:w-56"
      draggable={false}
    >
      <article className="isolate flex h-full flex-col overflow-hidden rounded-md border border-border bg-card shadow-sm transition-colors duration-300 group-hover:border-brand/35 group-hover:bg-muted/20 group-hover:shadow-md">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
          {house.coverImage && (
            <Image
              src={house.coverImage}
              alt={`House DV-${house.id}`}
              fill
              sizes="(max-width: 768px) 280px, 320px"
              draggable={false}
              className="object-cover brightness-[0.92] saturate-[0.98] transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-black/5" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col gap-1 bg-card px-3 py-2">

          <div className="flex justify-between items-start w-full">
            <h3 className="text-lg font-semibold text-primary truncate">
              DV-{house.id}
            </h3>
          </div>
          <p className="text-xs text-secondary">
            <FontAwesomeIcon icon={faLocationDot} /> {formatSeaDistance(house.farsea)}
          </p>

          <div className="flex items-center gap-1">
            <span className="text-xs text-secondary">
              <FontAwesomeIcon icon={faBed} className="mr-1" /> {house.bedroom} ห้องนอน
              <FontAwesomeIcon icon={faBath} className="ml-3" /> {house.toilet} ห้องน้ำ
            </span>
          </div>

          <div className="mt-auto flex items-baseline border-t border-border pt-1.5">
            <span className="text-lg font-bold text-accent">
              {displayPrice?.toLocaleString() ?? "N/A"}
            </span>
            <span className="text-sm text-muted-foreground ml-1">/ คืน</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
