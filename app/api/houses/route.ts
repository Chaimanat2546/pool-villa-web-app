import { connection, NextResponse } from "next/server";
import { getHouses, toHouseApiData } from "@/lib/houses";

export async function GET() {
  await connection();

  try {
    const houses = await getHouses();

    return NextResponse.json({
      data: houses.map(toHouseApiData),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "An unexpected error occurred while fetching house data." },
      { status: 500 },
    );
  }
}
