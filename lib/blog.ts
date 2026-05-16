import { createClient } from "@/lib/supabase/server";

export type BlogContentNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  content?: BlogContentNode[];
  marks?: { type: string; attrs?: Record<string, unknown> }[];
};

export type BlogContent = {
  type: "doc";
  content?: BlogContentNode[];
};

export type BlogPost = {
  id: string;
  code: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentJson: BlogContent;
  contentText: string;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostApiData = {
  id: string;
  code: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_json: BlogContent;
  content_text: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostInput = {
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  contentJson: BlogContent;
  contentText: string;
};

type BlogPostRow = {
  id: string;
  code: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image_url: string | null;
  content_json: BlogContent;
  content_text: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

type ParsedInput =
  | { ok: true; data: BlogPostInput }
  | { ok: false; error: string };

const EMPTY_CONTENT: BlogContent = { type: "doc", content: [] };
const BLOG_CODE_SUFFIX_PATTERN = /(?:^|-)i\.([a-zA-Z0-9_-]+)$/;
const MAX_CREATE_ATTEMPTS = 5;

export function createRandomBlogCode() {
  return `pv${crypto.randomUUID().replace(/-/g, "").slice(0, 8)}`;
}

export function toBlogTitleSlug(value: string) {
  return value
    .trim()
    .replace(/[\\/#?%&={}[\]|^`"<>]+/g, " ")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getBlogSlug(title: string, code: string) {
  const titleSlug = toBlogTitleSlug(title);

  return `${titleSlug || "blog"}-i.${code}`;
}

export function getBlogPath(post: Pick<BlogPost, "slug">) {
  return `/blog/${post.slug}`;
}

export function extractBlogCode(slugOrCode: string) {
  const match = slugOrCode.match(BLOG_CODE_SUFFIX_PATTERN);

  return match?.[1] ?? slugOrCode;
}

function isBlogContent(value: unknown): value is BlogContent {
  return (
    !!value &&
    typeof value === "object" &&
    (value as BlogContent).type === "doc"
  );
}

function mapBlogPost(row: BlogPostRow): BlogPost {
  return {
    id: row.id,
    code: row.code,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    contentJson: row.content_json,
    contentText: row.content_text,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBlogPostApiData(post: BlogPost): BlogPostApiData {
  return {
    id: post.id,
    code: post.code,
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    cover_image_url: post.coverImageUrl,
    content_json: post.contentJson,
    content_text: post.contentText,
    author_id: post.authorId,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
}

export function parseBlogPostInput(value: unknown): ParsedInput {
  if (!value || typeof value !== "object") {
    return { ok: false, error: "Invalid blog post payload." };
  }

  const body = value as Record<string, unknown>;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const excerpt =
    typeof body.excerpt === "string" && body.excerpt.trim()
      ? body.excerpt.trim()
      : null;
  const coverImageUrl =
    typeof body.cover_image_url === "string" && body.cover_image_url.trim()
      ? body.cover_image_url.trim()
      : null;
  const contentJson = isBlogContent(body.content_json)
    ? body.content_json
    : EMPTY_CONTENT;
  const contentText =
    typeof body.content_text === "string" ? body.content_text.trim() : "";

  if (!title) {
    return { ok: false, error: "title is required." };
  }

  return {
    ok: true,
    data: {
      title,
      excerpt,
      coverImageUrl,
      contentJson,
      contentText,
    },
  };
}

function toRowInput(input: BlogPostInput, code: string) {
  return {
    code,
    slug: getBlogSlug(input.title, code),
    title: input.title,
    excerpt: input.excerpt,
    cover_image_url: input.coverImageUrl,
    content_json: input.contentJson,
    content_text: input.contentText,
  };
}

function getSupabaseErrorMessage(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "A blog post with this slug already exists.";
  }

  return error.message;
}

async function insertBlogPostWithCode(input: BlogPostInput, code: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .insert(toRowInput(input, code))
    .select("*")
    .single<BlogPostRow>();

  if (error) {
    if (error.code === "23505") {
      return null;
    }

    throw new Error(getSupabaseErrorMessage(error));
  }

  return mapBlogPost(data);
}

export async function getPublishedBlogPosts(limit?: number) {
  const supabase = await createClient();
  let query = supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BlogPostRow[]>();

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapBlogPost);
}

export async function getPublishedBlogPostBySlugOrCode(slugOrCode: string) {
  const code = extractBlogCode(slugOrCode);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("code", code)
    .maybeSingle<BlogPostRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapBlogPost(data) : null;
}

export async function getAdminBlogPosts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<BlogPostRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data.map(mapBlogPost);
}

export async function getAdminBlogPostById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle<BlogPostRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ? mapBlogPost(data) : null;
}

export async function createBlogPost(input: BlogPostInput) {
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const post = await insertBlogPostWithCode(input, createRandomBlogCode());

    if (post) {
      return post;
    }
  }

  throw new Error("Unable to generate a unique blog code.");
}

export async function updateBlogPost(id: string, input: BlogPostInput) {
  const existingPost = await getAdminBlogPostById(id);

  if (!existingPost) {
    throw new Error("Blog post not found.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .update(toRowInput(input, existingPost.code))
    .eq("id", id)
    .select("*")
    .single<BlogPostRow>();

  if (error) {
    throw new Error(getSupabaseErrorMessage(error));
  }

  return mapBlogPost(data);
}

export async function deleteBlogPost(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }
}
