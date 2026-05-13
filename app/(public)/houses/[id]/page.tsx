import Image from "next/image";

type House = {
    id: string;
    price: string | null;
    bedroom: string | null;
    toilet: string | null;
    coverImage: string | null;
    farsea: string | null;
    wifi: string | null;
    grill: string | null;
    pet: string | null;
    snooker: string | null;
    discotech: string | null;
    fancyring: string | null;
    tabletennis: string | null;
    slider: string | null;
    billard: string | null;
    swimming_kid: string | null;
    swim: string | null;
    karaoke: string | null;
    airhockey: string | null;
    jacuzzi: string | null;
    bath: string | null;
    people: string | null;
};

type HouseApiResponse = {
    data: House;
};

type PageProps = {
    params: Promise<{
        id: string;
    }>;
};

async function getHouse(
    id: string
): Promise<HouseApiResponse> {
    const res = await fetch(
        `http://localhost:3000/api/houses/${id}`,
        {
            cache: "no-store",
        }
    );

    if (!res.ok) {
        throw new Error("Failed to fetch house");
    }

    return res.json() as Promise<HouseApiResponse>;
}

export default async function HouseDetailPage({
    params,
}: PageProps) {
    const { id } = await params;

    const result = await getHouse(id);

    const house = result.data;

    return (
        <main className="mx-auto max-w-5xl p-6">
            {house.coverImage && (
                <Image
                    src={house.coverImage}
                    alt={`DV-${house.id}`}
                    width={1200}
                    height={700}
                    priority
                    className="mb-6 h-[500px] w-full rounded-xl object-cover"
                />
            )}
            <div className="space-y-2 text-lg">
                <p>
                    ราคา:{" "}
                    {house.price ?? "ไม่มีข้อมูล"}
                </p>

                <p>
                    ห้องนอน:{" "}
                    {house.bedroom ?? "-"}
                </p>

                <p>
                    ห้องน้ำ:{" "}
                    {house.toilet ?? "-"}
                </p>

                <p>
                    บ้าน:{" "}
                    {house.farsea ?? "-"}
                </p>

                <p>
                    Wi-Fi:{" "}
                    {house.wifi ?? "-"}
                </p>

                <p>
                    Grill:{" "}
                    {house.grill ?? "-"}
                </p>

                <p>
                    Pet:{" "}
                    {house.pet ?? "-"}
                </p>

                <p>
                    Snooker:{" "}
                    {house.snooker ?? "-"}
                </p>

                <p>
                    Discotech:{" "}
                    {house.discotech ?? "-"}
                </p>

                <p>
                    Fancyring:{" "}
                    {house.fancyring ?? "-"}
                </p>

                <p>
                    Tabletennis:{" "}
                    {house.tabletennis ?? "-"}
                </p>

                <p>
                    Slider:{" "}
                    {house.slider ?? "-"}
                </p>

                <p>
                    Billard:{" "}
                    {house.billard ?? "-"}
                </p>

                <p>
                    Swimming_kid:{" "}
                    {house.swimming_kid ?? "-"}
                </p>

                <p>
                    Swim:{" "}
                    {house.swim ?? "-"}
                </p>

                <p>
                    Karaoke:{" "}
                    {house.karaoke ?? "-"}
                </p>

                <p>
                    Airhockey:{" "}
                    {house.airhockey ?? "-"}
                </p>

                <p>
                    Jacuzzi:{" "}
                    {house.jacuzzi ?? "-"}
                </p>

                <p>
                    Bath:{" "}
                    {house.bath ?? "-"}
                </p>

                <p>
                    People:{" "}
                    {house.people ?? "-"}
                </p>

                <p>ID: {house.id}</p>
            </div>
        </main>
    );
}