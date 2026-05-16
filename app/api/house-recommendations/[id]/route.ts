export const runtime = 'edge';
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import { getHouseById } from "@/lib/houses";
import {
  deleteHouseRecommendation,
  parseHouseRecommendationInput,
  toHouseRecommendationApiData,
  updateHouseRecommendation,
} from "@/lib/house-recommendations";

const VISIBLE_CONFLICT_MESSAGE =
  "This house already has a visible recommendation.";

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

    const parsed = parseHouseRecommendationInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const house = await getHouseById(parsed.data.hId);

    if (!house) {
      return NextResponse.json({ error: "House not found." }, { status: 404 });
    }

    const { id } = await params;
    const recommendation = await updateHouseRecommendation(id, parsed.data);

    return NextResponse.json({
      data: toHouseRecommendationApiData(recommendation),
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while updating recommendation.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: message === VISIBLE_CONFLICT_MESSAGE ? 409 : 500 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await params;
    await deleteHouseRecommendation(id);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "An unexpected error occurred while deleting recommendation." },
      { status: 500 },
    );
  }
}
