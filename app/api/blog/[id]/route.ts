export const runtime = 'edge';
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  deleteBlogPost,
  parseBlogPostInput,
  toBlogPostApiData,
  updateBlogPost,
} from "@/lib/blog";

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

    const parsed = parseBlogPostInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { id } = await params;
    const post = await updateBlogPost(id, parsed.data);

    return NextResponse.json({ data: toBlogPostApiData(post) });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while updating blog post.",
      },
      { status: 500 },
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
    await deleteBlogPost(id);

    return NextResponse.json({ data: { id } });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "An unexpected error occurred while deleting blog post." },
      { status: 500 },
    );
  }
}
