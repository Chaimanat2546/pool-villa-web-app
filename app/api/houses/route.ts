import { NextResponse } from "next/server";

const HOUSE_API_URL = "https://www.devillegroups.com/api/json/getHouse_deville.json";
const COVER_IMAGE_BASE_URL = "https://www.devillegroups.com/imgs/profile_imgs_large";

type ExternalHouse = {
    h_id: string;
    h_toilet: string;
    h_bedroom: string;
    h_farsea: string;
    price: string;
    img_name: string;
    wifi: string;
    grill: string;
    pet: string;
    snooker: string;
    discotech: string;
    fancyring: string;
    tabletennis: string;
    slider: string;
    billard: string;
    swimming_kid: string;
    swim: string;
    karaoke: string;
    airhockey: string;
    jacuzzi: string;
    bath: string;
    people: string;
};

type House = {
    id: string;
    coverImage: string | null;
    toilet: string | null;
    bedroom: string | null;
    farsea: string | null;
    price: string | null;
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

export async function GET() {
    try {
        const res = await fetch(HOUSE_API_URL, {
            cache: "no-store"
        });

        if (!res.ok) {
            return NextResponse.json(
                { error: "Failed to fetch data from the API" },
                { status: 500 }
            );
        }

        const houses = (await res.json()) as ExternalHouse[];

        const mappedHouses: House[] = houses.map((house) => ({
            id: house.h_id,
            coverImage: house.img_name
                ? `${COVER_IMAGE_BASE_URL}/${house.img_name}`
                : null,
            toilet: house.h_toilet ?? "ไม่มีห้องน้ำ",
            bedroom: house.h_bedroom ?? "ไม่มีห้องนอน",
            farsea: house.h_farsea ?? "ไม่มีบ้าน",
            price: house.price ?? "-",
            wifi: house.wifi ?? "ไม่มี",
            grill: house.grill ?? "ไม่มี",
            pet: house.pet ?? "ไม่มี",
            snooker: house.snooker ?? "ไม่มี",
            discotech: house.discotech ?? "ไม่มี",
            fancyring: house.fancyring ?? "ไม่มี",
            tabletennis: house.tabletennis ?? "ไม่มี",
            slider: house.slider ?? "ไม่มี",
            billard: house.billard ?? "ไม่มี",
            swimming_kid: house.swimming_kid ?? "ไม่มี",
            swim: house.swim ?? "ไม่มี",
            karaoke: house.karaoke ?? "ไม่มี",
            airhockey: house.airhockey ?? "ไม่มี",
            jacuzzi: house.jacuzzi ?? "ไม่มี",
            bath: house.bath ?? "ไม่มี",
            people: house.people ?? "ไม่มี",
        }));

        return NextResponse.json({
            data: mappedHouses,
        });
    } catch (error) {
        console.log(error);
        return NextResponse.json(
            { error: "An unexpected error occurred while fetching house data." },
            { status: 500 }
        );
    }
}