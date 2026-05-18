import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  deleteAreaActivity,
  parseAreaActivityInput,
  toAreaActivityApiData,
  updateAreaActivity,
} from "@/lib/area-activities";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const parsed = parseAreaActivityInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { id } = await params;
    const activity = await updateAreaActivity(id, parsed.data);

    return NextResponse.json({ data: toAreaActivityApiData(activity) });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating area activity.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    await deleteAreaActivity(id);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An unexpected error occurred while deleting area activity." },
      { status: 500 },
    );
  }
}
