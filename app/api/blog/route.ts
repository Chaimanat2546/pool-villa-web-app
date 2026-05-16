export const runtime = 'edge';
import { connection, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/api";
import {
  createBlogPost,
  getPublishedBlogPosts,
  parseBlogPostInput,
  toBlogPostApiData,
} from "@/lib/blog";

export async function GET() {
  await connection();

  try {
    const posts = await getPublishedBlogPosts();

    return NextResponse.json({ data: posts.map(toBlogPostApiData) });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "An unexpected error occurred while fetching blog posts." },
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

    const parsed = parseBlogPostInput(await request.json());

    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const post = await createBlogPost(parsed.data);

    return NextResponse.json(
      { data: toBlogPostApiData(post) },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred while creating blog post.",
      },
      { status: 500 },
    );
  }
}

