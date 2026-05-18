import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import { getAdminHouseForEdit } from "@/lib/houses";
import {
  createAccommodationRecommendation,
  getAdminAccommodationRecommendations,
  parseAccommodationRecommendationInput,
  toAccommodationRecommendationApiData,
} from "@/lib/accommodation-recommendations";

const VISIBLE_CONFLICT_MESSAGE =
  "This accommodation already has a visible recommendation.";

export async function GET() {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const recommendations = await getAdminAccommodationRecommendations();

    return NextResponse.json({
      data: recommendations.map(toAccommodationRecommendationApiData),
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "An unexpected error occurred while fetching recommendations." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const parsed = parseAccommodationRecommendationInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const house = await getAdminHouseForEdit(parsed.data.accommodationId);

    if (!house) {
      return NextResponse.json({ error: "House not found." }, { status: 404 });
    }

    const recommendation = await createAccommodationRecommendation(parsed.data);

    return NextResponse.json(
      { data: toAccommodationRecommendationApiData(recommendation) },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error
        ? error.message
        : "An unexpected error occurred while creating recommendation.";

    return NextResponse.json(
      {
        error: message,
      },
      { status: message === VISIBLE_CONFLICT_MESSAGE ? 409 : 500 },
    );
  }
}
