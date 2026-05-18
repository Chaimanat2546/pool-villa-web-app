import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  createAreaActivity,
  getAdminAreaActivities,
  parseAreaActivityInput,
  toAreaActivityApiData,
} from "@/lib/area-activities";

export async function GET() {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const activities = await getAdminAreaActivities();

    return NextResponse.json({
      data: activities.map(toAreaActivityApiData),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An unexpected error occurred while fetching area activities." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const parsed = parseAreaActivityInput(await request.json());
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const activity = await createAreaActivity(parsed.data);
    return NextResponse.json(
      { data: toAreaActivityApiData(activity) },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating area activity.",
      },
      { status: 500 },
    );
  }
}
