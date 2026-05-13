import { SearchFilters } from "./SearchFilters";
import { HouseCard } from "../HouseCard";

type House = {
    id: string;
    coverImage: string | null;
    price: string | null;
    people: string | null;
    bedroom: string | null;
    toilet: string | null;
    wifi: string | null;
    grill: string | null;
    pet: string | null;
    snooker: string | null;
    discotech: string | null;
    fancyring: string | null;
    tabletennis: string | null;
    slider: string | null;
    billard: string | null;
    swimmingKid: string | null;
    swim: string | null;
    karaoke: string | null;
    airhockey: string | null;
    jacuzzi: string | null;
    farsea: string | null;
    bath: string | null;
};

type HouseApiResponse = {
    data: House[];
};

type SearchPageProps = {
    searchParams: Promise<{
        q?: string;
        minPrice?: string;
        maxPrice?: string;
        people?: string;
        sort?: string;
        farsea?: string;
        wifi?: string;
        grill?: string;
        pet?: string;
        snooker?: string;
        discotech?: string;
        fancyring?: string;
        tabletennis?: string;
        slider?: string;
        billard?: string;
        swimmingKid?: string;
        swim?: string;
        karaoke?: string;
        airhockey?: string;
        jacuzzi?: string;
        bath?: string;
    }>;
};

async function getHouses(): Promise<HouseApiResponse> {
    const res = await fetch("http://localhost:3000/api/houses", {
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch houses");
    }

    return res.json() as Promise<HouseApiResponse>;
}

function toNumber(value: string | null | undefined) {
    if (!value) return null;

    const number = Number(value.replace(/,/g, ""));

    return Number.isNaN(number) ? null : number;
}

export default async function SearchPage({
    searchParams,
}: SearchPageProps) {
    const params = await searchParams;

    const minPrice = toNumber(params.minPrice);
    const maxPrice = toNumber(params.maxPrice);
    const selectedPeople = toNumber(params.people);

    const sort = params.sort ?? "";

    const result = await getHouses();

    let houses = result.data.filter((house) => {
        const price = toNumber(house.price);
        const people = toNumber(house.people);

        const matchMinPrice =
            minPrice === null ||
            (price !== null && price >= minPrice);

        const matchMaxPrice =
            maxPrice === null ||
            (price !== null && price <= maxPrice);

        const matchPeople =
            selectedPeople === null ||
            (people !== null &&
                people >= selectedPeople);

        const matchAmenities =
            (!params.wifi || house.wifi === "y") &&
            (!params.grill || house.grill === "y") &&
            (!params.pet || house.pet === "y") &&
            (!params.snooker || house.snooker === "y") &&
            (!params.discotech || house.discotech === "y") &&
            (!params.fancyring || house.fancyring === "y") &&
            (!params.tabletennis || house.tabletennis === "y") &&
            (!params.slider || house.slider === "y") &&
            (!params.billard || house.billard === "y") &&
            (!params.swimmingKid ||
                house.swimmingKid === "y") &&
            (!params.karaoke || house.karaoke === "y") &&
            (!params.airhockey ||
                house.airhockey === "y") &&
            (!params.jacuzzi || house.jacuzzi === "y") &&
            (!params.bath || house.bath === "y");

        return (
            matchMinPrice &&
            matchMaxPrice &&
            matchPeople &&
            matchAmenities
        );
    });

    houses = houses.sort((a, b) => {
        const priceA = toNumber(a.price) ?? 0;
        const priceB = toNumber(b.price) ?? 0;

        const peopleA = toNumber(a.people) ?? 0;
        const peopleB = toNumber(b.people) ?? 0;

        if (sort === "price_asc") {
            return priceA - priceB;
        }

        if (sort === "price_desc") {
            return priceB - priceA;
        }

        if (sort === "people_asc") {
            return peopleA - peopleB;
        }

        if (sort === "people_desc") {
            return peopleB - peopleA;
        }

        return 0;
    });

    return (
        <main className="mx-auto max-w-7xl p-6">
            <h1 className="mb-6 text-3xl font-bold">
                ค้นหาบ้านพัก
            </h1>

            <SearchFilters
                defaultQ={params.q}
                defaultMinPrice={params.minPrice}
                defaultMaxPrice={params.maxPrice}
                defaultPeople={params.people}
                defaultSort={params.sort}
                defaultWifi={params.wifi}
                defaultGrill={params.grill}
                defaultPet={params.pet}
                defaultSnooker={params.snooker}
                defaultDiscotech={params.discotech}
                defaultFancyring={params.fancyring}
                defaultTabletennis={params.tabletennis}
                defaultSlider={params.slider}
                defaultBillard={params.billard}
                defaultSwimming_kid={params.swimmingKid}
                defaultSwim={params.swim}
                defaultKaraoke={params.karaoke}
                defaultAirhockey={params.airhockey}
                defaultJacuzzi={params.jacuzzi}
                defaultBath={params.bath}
            />

            <p className="mb-6 text-sm text-gray-500">
                พบทั้งหมด {houses.length} รายการ
            </p>

            <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
                {houses.map((house, index) => (
                    <HouseCard
                        key={`${house.id}-${index}`}
                        house={house}
                    />
                ))}
            </div>
        </main>
    );
}