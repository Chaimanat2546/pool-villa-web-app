import { randomUUID } from "crypto";
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import { createClient } from "@/lib/supabase/server";

const BLOG_IMAGE_BUCKET = "blog-images";
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

function getImageExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";

  return "jpg";
}

export async function POST(request: Request) {
  await connection();

  try {
    const admin = await requireAdminApi();

    if (!admin.ok) {
      return admin.response;
    }

    const formData = await request.formData();
    const files = formData
      .getAll("files")
      .filter((value): value is File => value instanceof File);
    const legacyFile = formData.get("file");
    const uploadFiles =
      files.length > 0
        ? files
        : legacyFile instanceof File
          ? [legacyFile]
          : [];
    const folder = formData.get("folder");

    if (uploadFiles.length === 0) {
      return NextResponse.json({ error: "files are required." }, { status: 400 });
    }

    const invalidFile = uploadFiles.find(
      (file) => !ALLOWED_IMAGE_TYPES.has(file.type),
    );

    if (invalidFile) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP, and GIF images are allowed." },
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

    const safeFolder =
      typeof folder === "string" && folder.trim() ? folder.trim() : "draft";
    const supabase = await createClient();
    const uploadedFiles = [];

    for (const file of uploadFiles) {
      const filePath = `${safeFolder}/${randomUUID()}.${getImageExtension(
        file.type,
      )}`;
      const { error } = await supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from(BLOG_IMAGE_BUCKET)
        .getPublicUrl(filePath);

      uploadedFiles.push({
        path: filePath,
        url: data.publicUrl,
      });
    }

    return NextResponse.json({
      data: {
        files: uploadedFiles,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while uploading image.",
      },
      { status: 500 },
    );
  }
}
