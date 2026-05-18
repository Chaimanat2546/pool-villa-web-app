import { createClient } from "@/lib/supabase/server";

export type AreaActivityStatus = "visible" | "hidden";

export type AreaActivityImage = {
  id: string;
  activityId: string;
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type AreaActivityArea = {
  activityId: string;
  areaId: string;
  areaName: string | null;
  zoneName: string | null;
  provinceName: string | null;
};

export type AreaActivity = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  status: AreaActivityStatus;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  areas: AreaActivityArea[];
  images: AreaActivityImage[];
};

export type AreaActivityApiData = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: AreaActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  areas: {
    activity_id: string;
    area_id: string;
    area_name: string | null;
    zone_name: string | null;
    province_name: string | null;
  }[];
  images: {
    id: string;
    activity_id: string;
    storage_path: string;
    public_url: string;
    alt_text: string | null;
    sort_order: number;
    created_at: string;
    updated_at: string;
  }[];
};

export type AreaActivityInput = {
  title: string;
  areaIds: string[];
  startsAt: string;
  endsAt: string | null;
  status: AreaActivityStatus;
};

export type AreaActivityImageInput = {
  storagePath: string;
  publicUrl: string;
  altText: string | null;
  sortOrder: number;
};

type ParsedInput =
  | { ok: true; data: AreaActivityInput }
  | { ok: false; error: string };

type AreaActivityImageRow = {
  id: string;
  activity_id: string;
  storage_path: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

type AreaActivityRow = {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string | null;
  status: AreaActivityStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  areas?: {
    activity_id: string;
    area_id: string;
    area?: {
      name: string;
      zone?: {
        name: string;
        province?: { name: string } | null;
      } | null;
    } | null;
  }[] | null;
  images?: AreaActivityImageRow[] | null;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const AREA_ACTIVITY_SELECT = `
  id,
  title,
  starts_at,
  ends_at,
  status,
  created_by,
  created_at,
  updated_at,
  areas:area_activity_areas(
    activity_id,
    area_id,
    area:accommodation_areas(
      name,
      zone:accommodation_zones(
        name,
        province:provinces(name)
      )
    )
  ),
  images:area_activity_images(
    id,
    activity_id,
    storage_path,
    public_url,
    alt_text,
    sort_order,
    created_at,
    updated_at
  )
`;

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

function isAreaActivityStatus(status: unknown): status is AreaActivityStatus {
  return status === "visible" || status === "hidden";
}

function mapAreaActivityImage(row: AreaActivityImageRow): AreaActivityImage {
  return {
    id: row.id,
    activityId: row.activity_id,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    altText: row.alt_text,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAreaActivity(row: AreaActivityRow): AreaActivity {
  return {
    id: row.id,
    title: row.title,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    areas: (row.areas ?? []).map((area) => ({
      activityId: area.activity_id,
      areaId: area.area_id,
      areaName: area.area?.name ?? null,
      zoneName: area.area?.zone?.name ?? null,
      provinceName: area.area?.zone?.province?.name ?? null,
    })),
    images: (row.images ?? []).map(mapAreaActivityImage),
  };
}

export function toAreaActivityApiData(activity: AreaActivity): AreaActivityApiData {
  return {
    id: activity.id,
    title: activity.title,
    starts_at: activity.startsAt,
    ends_at: activity.endsAt,
    status: activity.status,
    created_by: activity.createdBy,
    created_at: activity.createdAt,
    updated_at: activity.updatedAt,
    areas: activity.areas.map((area) => ({
      activity_id: area.activityId,
      area_id: area.areaId,
      area_name: area.areaName,
      zone_name: area.zoneName,
      province_name: area.provinceName,
    })),
    images: activity.images.map((image) => ({
      id: image.id,
      activity_id: image.activityId,
      storage_path: image.storagePath,
      public_url: image.publicUrl,
      alt_text: image.altText,
      sort_order: image.sortOrder,
      created_at: image.createdAt,
      updated_at: image.updatedAt,
    })),
  };
}

export function toAreaActivityImageApiData(image: AreaActivityImage) {
  return {
    id: image.id,
    activity_id: image.activityId,
    storage_path: image.storagePath,
    public_url: image.publicUrl,
    alt_text: image.altText,
    sort_order: image.sortOrder,
    created_at: image.createdAt,
    updated_at: image.updatedAt,
  };
}

export function parseAreaActivityInput(value: unknown): ParsedInput {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid area activity payload." };
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const startsAt = parseDate(body.starts_at, "starts_at");
  const endsAt = parseOptionalDate(body.ends_at, "ends_at");
  const status = body.status;
  const areaIdsRaw = Array.isArray(body.area_ids) ? body.area_ids : [];
  const areaIds = Array.from(
    new Set(
      areaIdsRaw
        .map((areaId) => (typeof areaId === "string" ? areaId.trim() : ""))
        .filter(Boolean),
    ),
  );

  if (!title) {
    return { ok: false, error: "title is required." };
  }
  if (areaIds.length === 0) {
    return { ok: false, error: "area_ids must include at least one area id." };
  }
  if (!startsAt.ok) return { ok: false, error: startsAt.error };
  if (!endsAt.ok) return { ok: false, error: endsAt.error };
  if (!isAreaActivityStatus(status)) {
    return { ok: false, error: "status must be visible or hidden." };
  }
  if (endsAt.value !== null && endsAt.value < startsAt.value) {
    return { ok: false, error: "ends_at must be after starts_at." };
  }

  return {
    ok: true,
    data: {
      title,
      areaIds,
      startsAt: startsAt.value,
      endsAt: endsAt.value,
      status,
    },
  };
}

export async function getPublicAreaActivitiesForArea(input: {
  areaId: string;
  page: number;
  pageSize: number;
}) {
  const supabase = await createClient();
  const page = Math.max(1, input.page);
  const pageSize = Math.max(1, Math.min(input.pageSize, 12));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const today = new Date().toISOString().slice(0, 10);

  const { data: links, error: linkError } = await supabase
    .from("area_activity_areas")
    .select("activity_id")
    .eq("area_id", input.areaId)
    .returns<{ activity_id: string }[]>();

  if (linkError) throw new Error(linkError.message);

  const activityIds = links.map((link) => link.activity_id);
  if (activityIds.length === 0) {
    return { activities: [], totalCount: 0, page, pageSize };
  }

  const { data, error, count } = await supabase
    .from("area_activities")
    .select(AREA_ACTIVITY_SELECT, { count: "exact" })
    .in("id", activityIds)
    .eq("status", "visible")
    .lte("starts_at", today)
    .or(`ends_at.is.null,ends_at.gte.${today}`)
    .order("starts_at", { ascending: false })
    .order("created_at", { ascending: false })
    .order("sort_order", {
      ascending: true,
      referencedTable: "area_activity_images",
    })
    .range(from, to)
    .returns<AreaActivityRow[]>();

  if (error) throw new Error(error.message);

  return {
    activities: data.map(mapAreaActivity),
    totalCount: count ?? 0,
    page,
    pageSize,
  };
}

export async function getAdminAreaActivities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("area_activities")
    .select(AREA_ACTIVITY_SELECT)
    .order("created_at", { ascending: false })
    .order("sort_order", {
      ascending: true,
      referencedTable: "area_activity_images",
    })
    .returns<AreaActivityRow[]>();

  if (error) throw new Error(error.message);
  return data.map(mapAreaActivity);
}

export async function getAdminAreaActivityById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("area_activities")
    .select(AREA_ACTIVITY_SELECT)
    .eq("id", id)
    .limit(1)
    .returns<AreaActivityRow[]>();

  if (error) throw new Error(error.message);
  const row = data[0];
  return row ? mapAreaActivity(row) : null;
}

export async function createAreaActivity(input: AreaActivityInput) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("area_activities")
    .insert({
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) throw new Error(error.message);

  const { error: areaError } = await supabase
    .from("area_activity_areas")
    .insert(input.areaIds.map((areaId) => ({ activity_id: data.id, area_id: areaId })));

  if (areaError) throw new Error(areaError.message);

  const activity = await getAdminAreaActivityById(data.id);
  if (!activity) throw new Error("Activity not found after create.");
  return activity;
}

export async function updateAreaActivity(id: string, input: AreaActivityInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("area_activities")
    .update({
      title: input.title,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      status: input.status,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const { error: deleteError } = await supabase
    .from("area_activity_areas")
    .delete()
    .eq("activity_id", id);

  if (deleteError) throw new Error(deleteError.message);

  const { error: insertError } = await supabase
    .from("area_activity_areas")
    .insert(input.areaIds.map((areaId) => ({ activity_id: id, area_id: areaId })));

  if (insertError) throw new Error(insertError.message);

  const activity = await getAdminAreaActivityById(id);
  if (!activity) throw new Error("Activity not found.");
  return activity;
}

export async function deleteAreaActivity(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("area_activities").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function addAreaActivityImages(
  activityId: string,
  images: AreaActivityImageInput[],
) {
  const supabase = await createClient();
  const { data: existingRows, error: existingError } = await supabase
    .from("area_activity_images")
    .select("*")
    .eq("activity_id", activityId)
    .returns<AreaActivityImageRow[]>();

  if (existingError) throw new Error(existingError.message);
  if (existingRows.length + images.length > 2) {
    throw new Error("Area activity can have at most two images.");
  }

  const { data, error } = await supabase
    .from("area_activity_images")
    .insert(
      images.map((image) => ({
        activity_id: activityId,
        storage_path: image.storagePath,
        public_url: image.publicUrl,
        alt_text: image.altText,
        sort_order: image.sortOrder,
      })),
    )
    .select("*")
    .returns<AreaActivityImageRow[]>();

  if (error) throw new Error(error.message);
  return data.map(mapAreaActivityImage);
}

export async function deleteAreaActivityImages(activityId: string, ids: string[]) {
  const supabase = await createClient();
  const { data: rows, error: getError } = await supabase
    .from("area_activity_images")
    .select("*")
    .eq("activity_id", activityId)
    .in("id", ids)
    .returns<AreaActivityImageRow[]>();

  if (getError) throw new Error(getError.message);

  const { error } = await supabase
    .from("area_activity_images")
    .delete()
    .eq("activity_id", activityId)
    .in("id", ids);

  if (error) throw new Error(error.message);
  return rows.map(mapAreaActivityImage);
}
