export const runtime = 'edge';
import { connection, NextResponse } from "next/server";
import {
  getVillaCalendarDayDetail,
  parseVillaCalendarDay,
  parseVillaCalendarOffset,
} from "@/lib/villa-calendar";

export async function GET(request: Request) {
  await connection();

  try {
    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get("id")?.trim();
    const offset = parseVillaCalendarOffset(searchParams.get("offset"));
    const day = parseVillaCalendarDay(searchParams.get("day"));

    if (!villaId || day === null) {
      return NextResponse.json(
        { error: "id and day are required." },
        { status: 400 },
      );
    }

    const detail = await getVillaCalendarDayDetail(villaId, offset, day);

    return NextResponse.json({ data: { detail } });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while fetching villa day detail.",
      },
      { status: 500 },
    );
  }
}

