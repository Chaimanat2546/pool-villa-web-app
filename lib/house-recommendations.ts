import { createClient } from "@/lib/supabase/server";

export type HouseRecommendationStatus = "visible" | "hidden";

export type HouseRecommendation = {
  id: string;
  hId: string;
  startsAt: string;
  endsAt: string;
  status: HouseRecommendationStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type HouseRecommendationApiData = {
  id: string;
  h_id: string;
  starts_at: string;
  ends_at: string;
  status: HouseRecommendationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type HouseRecommendationInput = {
  hId: string;
  startsAt: string;
  endsAt: string;
  status: HouseRecommendationStatus;
};

type HouseRecommendationRow = {
  id: string;
  h_id: string;
  starts_at: string;
  ends_at: string;
  status: HouseRecommendationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type ParsedInput =
  | { ok: true; data: HouseRecommendationInput }
  | { ok: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function mapHouseRecommendation(
  row: HouseRecommendationRow,
): HouseRecommendation {
  return {
    id: row.id,
    hId: row.h_id,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toHouseRecommendationApiData(
  recommendation: HouseRecommendation,
): HouseRecommendationApiData {
  return {
    id: recommendation.id,
    h_id: recommendation.hId,
    starts_at: recommendation.startsAt,
    ends_at: recommendation.endsAt,
    status: recommendation.status,
    created_by: recommendation.createdBy,
    created_at: recommendation.createdAt,
    updated_at: recommendation.updatedAt,
  };
}

function isRecommendationStatus(
  status: unknown,
): status is HouseRecommendationStatus {
  return status === "visible" || status === "hidden";
}

function parseDate(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
    return { ok: false as const, error: `${fieldName} must be YYYY-MM-DD.` };
  }

  return { ok: true as const, value };
}

export function parseHouseRecommendationInput(value: unknown): ParsedInput {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid recommendation payload." };
  }

  const body = value as Record<string, unknown>;
  const hId = typeof body.h_id === "string" ? body.h_id.trim() : "";
  const startsAt = parseDate(body.starts_at, "starts_at");
  const endsAt = parseDate(body.ends_at, "ends_at");
  const status = body.status;

  if (!hId) {
    return { ok: false, error: "h_id is required." };
  }

  if (!startsAt.ok) return { ok: false, error: startsAt.error };
  if (!endsAt.ok) return { ok: false, error: endsAt.error };

  if (endsAt.value < startsAt.value) {
    return { ok: false, error: "ends_at must be after starts_at." };
  }

  if (!isRecommendationStatus(status)) {
    return { ok: false, error: "status must be visible or hidden." };
  }

  return {
    ok: true,
    data: {
      hId,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      status,
    },
  };
}

function getVisibleRecommendationConflictMessage() {
  return "This house already has a visible recommendation.";
}

function getSupabaseErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return getVisibleRecommendationConflictMessage();
  }

  return error.message;
}

export async function getPublicHouseRecommendations() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("house_recommendations")
    .select("*")
    .eq("status", "visible")
    .lte("starts_at", today)
    .gte("ends_at", today)
    .order("starts_at", { ascending: false })
    .returns<HouseRecommendationRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapHouseRecommendation);
}

export async function getAdminHouseRecommendations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("house_recommendations")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<HouseRecommendationRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapHouseRecommendation);
}

export async function createHouseRecommendation(
  input: HouseRecommendationInput,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("house_recommendations")
    .insert({
      h_id: input.hId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status,
    })
    .select("*")
    .single<HouseRecommendationRow>();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return mapHouseRecommendation(data);
}

export async function updateHouseRecommendation(
  id: string,
  input: HouseRecommendationInput,
) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("house_recommendations")
    .update({
      h_id: input.hId,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status,
    })
    .eq("id", id)
    .select("*")
    .single<HouseRecommendationRow>();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return mapHouseRecommendation(data);
}

export async function deleteHouseRecommendation(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("house_recommendations")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
