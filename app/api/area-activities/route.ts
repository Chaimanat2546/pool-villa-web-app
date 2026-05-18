import { connection, NextResponse } from "next/server";
import {
  getPublicAreaActivitiesForArea,
  toAreaActivityApiData,
} from "@/lib/area-activities";

function getPositiveInteger(value: string | null, fallback: number) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

export async function GET(request: Request) {
  await connection();

  try {
    const url = new URL(request.url);
    const areaId = url.searchParams.get("area_id")?.trim() ?? "";

    if (!areaId) {
      return NextResponse.json({ error: "area_id is required." }, { status: 400 });
    }

    const page = getPositiveInteger(url.searchParams.get("page"), 1);
    const pageSize = Math.min(
      getPositiveInteger(url.searchParams.get("page_size"), 4),
      12,
    );

    const result = await getPublicAreaActivitiesForArea({
      areaId,
      page,
      pageSize,
    });

    return NextResponse.json({
      data: result.activities.map(toAreaActivityApiData),
      meta: {
        total_count: result.totalCount,
        page: result.page,
        page_size: result.pageSize,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching area activities." },
      { status: 500 },
    );
  }
}
