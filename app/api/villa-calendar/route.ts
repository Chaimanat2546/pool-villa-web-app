export const runtime = "nodejs";
import { connection, NextResponse } from "next/server";
import {
  getInternalVillaCalendarMonth,
  getVillaCalendarMonth,
  parseVillaCalendarOffset,
} from "@/lib/villa-calendar";

export async function GET(request: Request) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get("id")?.trim();
    const sourceParam = searchParams.get("source")?.trim();
    const offset = parseVillaCalendarOffset(searchParams.get("offset"));

    if (!villaId) {
      return NextResponse.json({ error: "id is required." }, { status: 400 });
    }

    const inferredSource =
      sourceParam ?? (/^[0-9a-f]{8}-/i.test(villaId) ? "internal" : "external");

    const calendar =
      inferredSource === "internal"
        ? await getInternalVillaCalendarMonth(villaId, offset)
        : await getVillaCalendarMonth(villaId, offset);

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

