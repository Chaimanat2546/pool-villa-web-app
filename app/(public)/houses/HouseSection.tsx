import { HouseCarousel } from "./HouseCarousel";
import { HouseCard } from "./HouseCard";

type House = {
    id: string;
    coverImage: string | null;
    toilet: string | null;
    bedroom: string | null;
    farsea: string | null;
    price: string | null;
};

type HouseSectionProps = {
    title: string;
    houses: House[];
};

export function HouseSection({
    title,
    houses,
}: HouseSectionProps) {
    return (
        <section className="mb-10">
            <h2 className="mb-4 text-2xl font-bold">
                {title}
            </h2>

            <HouseCarousel>
                {houses.map((house, index) => (
                    <HouseCard
                        key={`${house.id}-${index}`}
                        house={house}
                    />
                ))}
            </HouseCarousel>
        </section>
    );
}
