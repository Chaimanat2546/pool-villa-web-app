import { connection, NextResponse } from "next/server";
import { getExternalHouseById, toHouseApiData } from "@/lib/houses";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, { params }: RouteContext) {
  void request;
  await connection();

  try {
    const { id } = await params;
    const house = await getExternalHouseById(id);

    if (!house) {
      return NextResponse.json({ error: "House not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: toHouseApiData(house),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "An unexpected error occurred while fetching house data." },
      { status: 500 },
    );
  }
}
