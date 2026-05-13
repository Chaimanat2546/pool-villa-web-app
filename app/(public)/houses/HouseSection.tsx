import type { HouseCardData } from "@/lib/houses";
import { HouseCarousel } from "./HouseCarousel";
import { HouseCard } from "./HouseCard";

type HouseSectionProps = {
  title: string;
  houses: HouseCardData[];
};

export function HouseSection({ title, houses }: HouseSectionProps) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 text-2xl font-bold">{title}</h2>

      <HouseCarousel>
        {houses.map((house) => (
          <HouseCard key={house.id} house={house} />
        ))}
      </HouseCarousel>
    </section>
  );
}
