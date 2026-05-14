import Image from "next/image";
import Link from "next/link";
import { formatSeaDistance, type HouseCardData } from "@/lib/houses";

type HouseCardProps = {
  house: HouseCardData;
};

function calculateCommission(price: string) {
  const priceNum = parseInt(price);
  const last3 = priceNum % 1000;
  if (priceNum <= 28000) {
    if (last3 === 500) {
      return priceNum + 1400;
    } else {
      return priceNum + 1900;
    }
  } else if (priceNum > 28000 && priceNum <= 47000) {
    if (last3 === 500) {
      return priceNum + 2400;
    } else {
      return priceNum + 2900;
    }
  } else if (priceNum > 47000) {
    if (last3 === 500) {
      return priceNum + 3400;
    } else {
      return priceNum + 3900;
    }
  }
}

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

        <p className="text-sm text-gray-500">ห้องน้ำ: {house.toilet}</p>
        <p className="text-sm text-gray-500">ห้องนอน: {house.bedroom}</p>
        <p className="text-sm text-gray-500">
          {formatSeaDistance(house.farsea)}
        </p>
        <p className="text-sm text-gray-500">ราคา: {calculateCommission(house.price)}</p>
      </article>
    </Link>
  );
}
