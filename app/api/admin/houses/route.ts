import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  createAdminHouse,
  parseAdminHouseCreateInput,
} from "@/lib/houses";

export async function POST(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const parsed = parseAdminHouseCreateInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const id = await createAdminHouse(parsed.data);

    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating house.",
      },
      { status: 500 },
    );
  }
}
