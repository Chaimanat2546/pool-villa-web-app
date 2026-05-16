export const runtime = 'edge';
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  parseAdminHouseUpdateInput,
  updateAdminHouse,
} from "@/lib/houses";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await params;
    const parsed = parseAdminHouseUpdateInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const houseId = await updateAdminHouse(id, parsed.data);

    return NextResponse.json({ data: { id: houseId } });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating house.",
      },
      { status: 500 },
    );
  }
}
