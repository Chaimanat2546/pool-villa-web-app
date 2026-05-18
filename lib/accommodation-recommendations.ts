import { createClient } from "@/lib/supabase/server";

export type AccommodationRecommendationStatus = "visible" | "hidden";

export type AccommodationRecommendation = {
    id: string;
    accommodationId: string;
    startsAt: string;
    endsAt: string | null;
    status: AccommodationRecommendationStatus;
    createdBy: string | null;
    createdAt: string;
    updatedAt: string;
};

export type AccommodationRecommendationApiData = {
    id: string;
    accommodation_id: string;
    starts_at: string;
    ends_at: string | null;
    status: AccommodationRecommendationStatus;
    created_by: string | null;
    created_at: string;
    updated_at: string;
};

export type AccommodationRecommendationInput = {
    accommodationId: string;
    startsAt: string;
    endsAt: string | null;
    status: AccommodationRecommendationStatus;
};

type AccommodationRecommendationRow = {
    id: string;
    accommodation_id: string;
    starts_at: string;
    ends_at: string | null;
    status: AccommodationRecommendationStatus;
    created_by: string | null;
    created_at: string;
    updated_at: string;
};

type ParsedInput =
    | { ok: true; data: AccommodationRecommendationInput }
    | { ok: false; error: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function mapAccommodationRecommendation(
    row: AccommodationRecommendationRow,
): AccommodationRecommendation {
    return {
        id: row.id,
        accommodationId: row.accommodation_id,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        status: row.status,
        createdBy: row.created_by,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function toAccommodationRecommendationApiData(
    recommendation: AccommodationRecommendation,
): AccommodationRecommendationApiData {
    return {
        id: recommendation.id,
        accommodation_id: recommendation.accommodationId,
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
): status is AccommodationRecommendationStatus {
    return status === "visible" || status === "hidden";
}

function parseDate(value: unknown, fieldName: string) {
    if (typeof value !== "string" || !DATE_PATTERN.test(value)) {
        return { ok: false as const, error: `${fieldName} must be YYYY-MM-DD.` };
    }

    return { ok: true as const, value };
}

function parseOptionalDate(value: unknown, fieldName: string) {
    if (value === null || value === undefined || value === "") {
        return { ok: true as const, value: null };
    }

    return parseDate(value, fieldName);
}

export function parseAccommodationRecommendationInput(value: unknown): ParsedInput {
    if (!value || typeof value !== "object") {
        return { ok: false, error: "Invalid recommendation payload." };
    }

    const body = value as Record<string, unknown>;
    const accommodationId = typeof body.accommodation_id === "string" ? body.accommodation_id.trim() : "";
    const startsAt = parseDate(body.starts_at, "starts_at");
    const endsAt = parseOptionalDate(body.ends_at, "ends_at");
    const status = body.status;

    if (!accommodationId) {
        return { ok: false, error: "accommodation_id is required." };
    }

    if (!startsAt.ok) return { ok: false, error: startsAt.error };
    if (!endsAt.ok) return { ok: false, error: endsAt.error };

    if (endsAt.value !== null && endsAt.value < startsAt.value) {
        return { ok: false, error: "ends_at must be after starts_at." };
    }

    if (!isRecommendationStatus(status)) {
        return { ok: false, error: "status must be visible or hidden." };
    }

    return {
        ok: true,
        data: {
            accommodationId,
            startsAt: startsAt.value,
            endsAt: endsAt.value,
            status,
        },
    };
}

function getVisibleRecommendationConflictMessage() {
    return "This accommodation already has a visible recommendation.";
}

function getSupabaseErrorMessage(error: { code?: string; message: string }) {
    if (error.code === "23505") {
        return getVisibleRecommendationConflictMessage();
    }

    return error.message;
}

export async function getPublicAccommodationRecommendations() {
    const supabase = await createClient();
    const today = new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
        .from("accommodation_recommendations")
        .select("*")
        .eq("status", "visible")
        .lte("starts_at", today)
        .or(`ends_at.is.null,ends_at.gte.${today}`)
        .order("starts_at", { ascending: false })
        .returns<AccommodationRecommendationRow[]>();

    if (error) {
        throw new Error(error.message);
    }

    return data.map(mapAccommodationRecommendation);
}

export async function getAdminAccommodationRecommendations() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("accommodation_recommendations")
        .select("*")
        .order("created_at", { ascending: false })
        .returns<AccommodationRecommendationRow[]>();

    if (error) {
        throw new Error(error.message);
    }

    return data.map(mapAccommodationRecommendation);
}

export async function createAccommodationRecommendation(
    input: AccommodationRecommendationInput,
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("accommodation_recommendations")
        .insert({
            accommodation_id: input.accommodationId,
            starts_at: input.startsAt,
            ends_at: input.endsAt,
            status: input.status,
        })
        .select("*")
        .single<AccommodationRecommendationRow>();

    if (error) {
        throw new Error(getSupabaseErrorMessage(error));
    }

    return mapAccommodationRecommendation(data);
}

export async function updateAccommodationRecommendation(
    id: string,
    input: AccommodationRecommendationInput,
) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("accommodation_recommendations")
        .update({
            accommodation_id: input.accommodationId,
            starts_at: input.startsAt,
            ends_at: input.endsAt,
            status: input.status,
        })
        .eq("id", id)
        .select("*")
        .single<AccommodationRecommendationRow>();

    if (error) {
        throw new Error(getSupabaseErrorMessage(error));
    }

    return mapAccommodationRecommendation(data);
}

export async function deleteAccommodationRecommendation(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from("accommodation_recommendations")
        .delete()
        .eq("id", id);

    if (error) {
        throw new Error(error.message);
    }
}