export const runtime = 'edge';
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  createAdminHouseArea,
  createAdminHouseFacility,
  createAdminHouseProvince,
  createAdminHouseType,
  createAdminHouseZone,
  updateAdminHouseArea,
  updateAdminHouseFacility,
  updateAdminHouseProvince,
  updateAdminHouseType,
  updateAdminHouseZone,
} from "@/lib/houses";

type SettingsPayload = {
  id?: unknown;
  kind?: unknown;
  name?: unknown;
  province_id?: unknown;
  accommodation_zone_id?: unknown;
  slug?: unknown;
  icon?: unknown;
};

function getRequiredText(value: unknown, fieldName: string) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    throw new Error(`${fieldName} is required.`);
  }

  return text;
}

function getOptionalText(value: unknown) {
  const text = typeof value === "string" ? value.trim() : "";

  return text || null;
}

async function createSetting(payload: SettingsPayload) {
  const kind = getRequiredText(payload.kind, "kind");

  if (kind === "province") {
    return createAdminHouseProvince(getRequiredText(payload.name, "name"));
  }

  if (kind === "zone") {
    return createAdminHouseZone({
      provinceId: getRequiredText(payload.province_id, "province_id"),
      name: getRequiredText(payload.name, "name"),
    });
  }

  if (kind === "area") {
    return createAdminHouseArea({
      accommodationZoneId: getRequiredText(
        payload.accommodation_zone_id,
        "accommodation_zone_id",
      ),
      name: getRequiredText(payload.name, "name"),
    });
  }

  if (kind === "type") {
    return createAdminHouseType(getRequiredText(payload.name, "name"));
  }

  if (kind === "facility") {
    return createAdminHouseFacility({
      name: getRequiredText(payload.name, "name"),
      slug: getRequiredText(payload.slug, "slug").toLowerCase(),
      icon: getOptionalText(payload.icon),
    });
  }

  throw new Error("Invalid settings kind.");
}

async function updateSetting(payload: SettingsPayload) {
  const id = getRequiredText(payload.id, "id");
  const kind = getRequiredText(payload.kind, "kind");

  if (kind === "province") {
    await updateAdminHouseProvince({
      id,
      name: getRequiredText(payload.name, "name"),
    });
    return;
  }

  if (kind === "zone") {
    await updateAdminHouseZone({
      id,
      provinceId: getRequiredText(payload.province_id, "province_id"),
      name: getRequiredText(payload.name, "name"),
    });
    return;
  }

  if (kind === "area") {
    await updateAdminHouseArea({
      id,
      accommodationZoneId: getRequiredText(
        payload.accommodation_zone_id,
        "accommodation_zone_id",
      ),
      name: getRequiredText(payload.name, "name"),
    });
    return;
  }

  if (kind === "type") {
    await updateAdminHouseType({
      id,
      name: getRequiredText(payload.name, "name"),
    });
    return;
  }

  if (kind === "facility") {
    await updateAdminHouseFacility({
      id,
      name: getRequiredText(payload.name, "name"),
      slug: getRequiredText(payload.slug, "slug").toLowerCase(),
      icon: getOptionalText(payload.icon),
    });
    return;
  }

  throw new Error("Invalid settings kind.");
}

export async function POST(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const id = await createSetting((await request.json()) as SettingsPayload);

    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating house setting.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    await updateSetting((await request.json()) as SettingsPayload);
    return NextResponse.json({ data: { ok: true } });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating house setting.",
      },
      { status: 500 },
    );
  }
}

