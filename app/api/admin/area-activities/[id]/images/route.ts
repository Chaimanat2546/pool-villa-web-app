import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  addAreaActivityImages,
  deleteAreaActivityImages,
  getAdminAreaActivityById,
  toAreaActivityImageApiData,
  type AreaActivityImageInput,
} from "@/lib/area-activities";
import { createClient } from "@/lib/supabase/server";

const AREA_ACTIVITY_IMAGE_BUCKET = "area-activity-images";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type RouteContext = {
  params: Promise<{ id: string }>;
};

type DeleteImagesPayload = {
  ids?: unknown;
};

function getImageExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

function getUploadFiles(formData: FormData) {
  return formData.getAll("files").filter((value): value is File => value instanceof File);
}

function getFormText(formData: FormData, singularName: string, pluralName: string, index: number) {
  const pluralValue = formData.getAll(pluralName)[index];
  const value = pluralValue ?? formData.get(singularName);
  return typeof value === "string" ? value.trim() : "";
}

function parseSortOrder(formData: FormData, index: number, fallback: number) {
  const value = getFormText(formData, "sort_order", "sort_orders", index);
  if (!value) return { ok: true as const, value: fallback };

  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 1) {
    return { ok: false as const, error: "sort_order must be 0 or 1." };
  }
  return { ok: true as const, value: number };
}

function parseDeleteImageIds(payload: DeleteImagesPayload | null) {
  if (!payload || !Array.isArray(payload.ids)) {
    return { ok: false as const, error: "ids must be an array." };
  }

  const ids = payload.ids
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean);

  if (ids.length === 0) {
    return { ok: false as const, error: "ids must include at least one image id." };
  }

  return { ok: true as const, ids: Array.from(new Set(ids)) };
}

export async function POST(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const activity = await getAdminAreaActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }

    const formData = await request.formData();
    const uploadFiles = getUploadFiles(formData);
    if (uploadFiles.length === 0) {
      return NextResponse.json({ error: "files are required." }, { status: 400 });
    }

    const invalidFile = uploadFiles.find(
      (file) => file.size <= 0 || !ALLOWED_IMAGE_TYPES.has(file.type),
    );
    if (invalidFile) {
      return NextResponse.json(
        { error: "Only non-empty JPEG, PNG, WebP, and GIF images are allowed." },
        { status: 400 },
      );
    }

    const oversizedFile = uploadFiles.find((file) => file.size > MAX_IMAGE_SIZE);
    if (oversizedFile) {
      return NextResponse.json(
        { error: "Each image must be 10MB or smaller." },
        { status: 400 },
      );
    }

    const uploadedPaths: string[] = [];
    const supabase = await createClient();
    const imageInputs: AreaActivityImageInput[] = [];

    for (const [index, file] of uploadFiles.entries()) {
      const sortOrder = parseSortOrder(formData, index, activity.images.length + index);
      if (!sortOrder.ok) {
        return NextResponse.json({ error: sortOrder.error }, { status: 400 });
      }

      const storagePath = `${id}/${crypto.randomUUID()}.${getImageExtension(file.type)}`;
      const { error } = await supabase.storage.from(AREA_ACTIVITY_IMAGE_BUCKET).upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

      if (error) throw new Error(error.message);

      uploadedPaths.push(storagePath);
      const { data } = supabase.storage.from(AREA_ACTIVITY_IMAGE_BUCKET).getPublicUrl(storagePath);
      imageInputs.push({
        storagePath,
        publicUrl: data.publicUrl,
        altText: getFormText(formData, "alt_text", "alt_texts", index) || null,
        sortOrder: sortOrder.value,
      });
    }

    try {
      const images = await addAreaActivityImages(id, imageInputs);
      return NextResponse.json(
        { data: { images: images.map(toAreaActivityImageApiData) } },
        { status: 201 },
      );
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from(AREA_ACTIVITY_IMAGE_BUCKET).remove(uploadedPaths);
      }
      throw error;
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while uploading area activity images.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();
    if (!admin.ok) return admin.response;

    const { id } = await params;
    const activity = await getAdminAreaActivityById(id);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found." }, { status: 404 });
    }

    const payload = (await request.json().catch(() => null)) as DeleteImagesPayload | null;
    const parsed = parseDeleteImageIds(payload);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deletedImages = await deleteAreaActivityImages(id, parsed.ids);
    const storagePaths = deletedImages.map((image) => image.storagePath);

    if (storagePaths.length > 0) {
      const supabase = await createClient();
      const { error } = await supabase.storage.from(AREA_ACTIVITY_IMAGE_BUCKET).remove(storagePaths);
      if (error) throw new Error(error.message);
    }

    return NextResponse.json({
      data: { images: deletedImages.map(toAreaActivityImageApiData) },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while deleting area activity images.",
      },
      { status: 500 },
    );
  }
}
