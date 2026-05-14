import type { HouseCardData } from "@/lib/houses";
import { HouseCarousel } from "./HouseCarousel";
import { HouseCard } from "./HouseCard";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";

type HouseSectionProps = {
  title: string;
  houses: HouseCardData[];
  seeMoreHref?: string;
};

export function HouseSection({ title, houses, seeMoreHref }: HouseSectionProps) {
  return (
    <section className="flex w-full flex-col gap-4">
      <header className="mx-auto flex w-full items-end justify-between">
        <h2 className="text-2xl font-bold text-primary md:text-3xl">{title}</h2>
        {seeMoreHref && (
          <Link
            href={seeMoreHref}
            className="group flex items-center gap-1 text-sm font-semibold text-secondary transition-colors hover:text-primary"
          >
            ดูเพิ่มเติม
            <FontAwesomeIcon icon={faArrowRight} className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </header>

      <div className="mx-auto w-full">
        <HouseCarousel>
          {houses.map((house) => (
            <HouseCard key={house.id} house={house} />
          ))}
        </HouseCarousel>
      </div>
    </section>
  );
}
