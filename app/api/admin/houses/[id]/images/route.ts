import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  addAdminHouseImages,
  deleteAdminHouseImages,
  getAdminHouseForEdit,
  isAdminHouseImageCategory,
  toAdminHouseImageApiData,
  type AdminHouseImageCategory,
  type AdminHouseImageInput,
} from "@/lib/houses";
import { createClient } from "@/lib/supabase/server";

const ACCOMMODATION_IMAGE_BUCKET = "accommodation-images";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
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
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);
  const legacyFile = formData.get("file");

  return files.length > 0
    ? files
    : legacyFile instanceof File
      ? [legacyFile]
      : [];
}

function getFormText(
  formData: FormData,
  singularName: string,
  pluralName: string,
  index: number,
) {
  const pluralValue = formData.getAll(pluralName)[index];
  const value = pluralValue ?? formData.get(singularName);

  return typeof value === "string" ? value.trim() : "";
}

function getImageCategory(
  formData: FormData,
  index: number,
): AdminHouseImageCategory | null {
  const category = getFormText(formData, "category", "categories", index);

  return isAdminHouseImageCategory(category) ? category : null;
}

function parseSortOrder(
  formData: FormData,
  index: number,
  fallback: number,
) {
  const value = getFormText(formData, "sort_order", "sort_orders", index);

  if (!value) return { ok: true as const, value: fallback };

  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    return { ok: false as const, error: "sort_order must be a non-negative integer." };
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

async function getAdminHouseOrResponse(id: string) {
  const house = await getAdminHouseForEdit(id);

  if (!house) {
    return {
      ok: false as const,
      response: NextResponse.json({ error: "House not found." }, { status: 404 }),
    };
  }

  return { ok: true as const, house };
}

export async function GET(_request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await params;
    const houseResult = await getAdminHouseOrResponse(id);

    if (!houseResult.ok) {
      return houseResult.response;
    }

    return NextResponse.json({
      data: {
        images: houseResult.house.images.map(toAdminHouseImageApiData),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while loading house images.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await params;
    const houseResult = await getAdminHouseOrResponse(id);

    if (!houseResult.ok) {
      return houseResult.response;
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

    const categoryCounts = new Map<AdminHouseImageCategory, number>();
    const uploadDrafts = [];

    for (const [index, file] of uploadFiles.entries()) {
      const category = getImageCategory(formData, index);

      if (!category) {
        return NextResponse.json(
          { error: "category is required and must be valid." },
          { status: 400 },
        );
      }

      const currentCategoryCount = categoryCounts.get(category) ?? 0;
      const existingCategoryCount = houseResult.house.images.filter(
        (image) => image.category === category,
      ).length;
      const sortOrder = parseSortOrder(
        formData,
        index,
        existingCategoryCount + currentCategoryCount,
      );

      if (!sortOrder.ok) {
        return NextResponse.json({ error: sortOrder.error }, { status: 400 });
      }

      categoryCounts.set(category, currentCategoryCount + 1);
      uploadDrafts.push({
        file,
        category,
        altText: getFormText(formData, "alt_text", "alt_texts", index) || null,
        sortOrder: sortOrder.value,
      });
    }

    if ((categoryCounts.get("cover") ?? 0) > 1) {
      return NextResponse.json(
        { error: "Only one cover image can be uploaded at a time." },
        { status: 400 },
      );
    }

    const hasCover = houseResult.house.images.some(
      (image) => image.category === "cover",
    );

    if (hasCover && categoryCounts.has("cover")) {
      return NextResponse.json(
        { error: "Cover image already exists. Delete it before uploading a new cover image." },
        { status: 409 },
      );
    }

    const supabase = await createClient();
    const uploadedPaths: string[] = [];
    const imageInputs: AdminHouseImageInput[] = [];

    for (const draft of uploadDrafts) {
      const storagePath = `${id}/${draft.category}/${crypto.randomUUID()}.${getImageExtension(
        draft.file.type,
      )}`;
      const { error } = await supabase.storage
        .from(ACCOMMODATION_IMAGE_BUCKET)
        .upload(storagePath, draft.file, {
          contentType: draft.file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      uploadedPaths.push(storagePath);

      const { data } = supabase.storage
        .from(ACCOMMODATION_IMAGE_BUCKET)
        .getPublicUrl(storagePath);

      imageInputs.push({
        id: null,
        category: draft.category,
        storagePath,
        publicUrl: data.publicUrl,
        altText: draft.altText,
        sortOrder: draft.sortOrder,
      });
    }

    try {
      const images = await addAdminHouseImages(id, imageInputs);

      return NextResponse.json(
        { data: { images: images.map(toAdminHouseImageApiData) } },
        { status: 201 },
      );
    } catch (error) {
      if (uploadedPaths.length > 0) {
        await supabase.storage
          .from(ACCOMMODATION_IMAGE_BUCKET)
          .remove(uploadedPaths);
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
            : "An unexpected error occurred while uploading house images.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const { id } = await params;
    const houseResult = await getAdminHouseOrResponse(id);

    if (!houseResult.ok) {
      return houseResult.response;
    }

    const payload = (await request
      .json()
      .catch(() => null)) as DeleteImagesPayload | null;
    const parsed = parseDeleteImageIds(payload);

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const deletedImages = await deleteAdminHouseImages(id, parsed.ids);
    const storagePaths = deletedImages.map((image) => image.storagePath);

    if (storagePaths.length > 0) {
      const supabase = await createClient();
      const { error } = await supabase.storage
        .from(ACCOMMODATION_IMAGE_BUCKET)
        .remove(storagePaths);

      if (error) {
        throw new Error(error.message);
      }
    }

    return NextResponse.json({
      data: {
        images: deletedImages.map(toAdminHouseImageApiData),
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while deleting house images.",
      },
      { status: 500 },
    );
  }
}
