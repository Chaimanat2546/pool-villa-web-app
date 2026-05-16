export const runtime = "nodejs";
import { connection, NextResponse } from "next/server";
import {
  getVillaCalendarMonth,
  parseVillaCalendarOffset,
} from "@/lib/villa-calendar";

export async function GET(request: Request) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get("id")?.trim();
    const offset = parseVillaCalendarOffset(searchParams.get("offset"));

    if (!villaId) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const calendar = await getVillaCalendarMonth(villaId, offset);

    return NextResponse.json({
      data: {
        month: calendar.month,
        first_day_index: calendar.firstDayIndex,
        days: calendar.days,
        offset: calendar.offset,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while fetching villa calendar.",
      },
      { status: 500 },
    );
  }
}

