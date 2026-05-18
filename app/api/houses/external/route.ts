export const runtime = "edge";
import { connection, NextResponse } from "next/server";
import { getExternalHouses, toHouseApiData } from "@/lib/houses";

export async function GET() {
  await connection();

  try {
    const houses = await getExternalHouses();

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
