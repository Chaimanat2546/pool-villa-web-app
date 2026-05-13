import Image from "next/image";
import Link from "next/link";

type House = {
    id: string;
    coverImage: string | null;
    toilet: string | null;
    bedroom: string | null;
    farsea: string | null;
    price: string | null;
};

type HouseCardProps = {
    house: House;
};

export function HouseCard({ house }: HouseCardProps) {
    return (
        <Link
            href={`/houses/${house.id}`}
            className="min-w-[260px] flex-shrink-0"
            draggable={false}
        >
            <article className="rounded-lg border p-4">
                {house.coverImage && (
                    <Image
                        src={house.coverImage}
                        alt={`House DV-${house.id}`}
                        width={500}
                        height={300}
                        draggable={false}
                        className="mb-4 h-48 w-full rounded-md object-cover"
                        loading="eager"
                    />
                )}

                <h2 className="font-semibold text-xl">DV-{house.id}</h2>

                {house.toilet && <p className="text-sm text-gray-500">ห้องน้ำ: {house.toilet}</p>}
                {house.bedroom && <p className="text-sm text-gray-500">ห้องนอน: {house.bedroom}</p>}
                {house.farsea && <p className="text-sm text-gray-500">{house.farsea === "0" ? "ติดทะเล" : `ห่างจากทะเล ${house.farsea}`}</p>}
                {house.price && <p className="text-sm text-gray-500">ราคา: {house.price}</p>}
            </article>
        </Link>
    );
}
