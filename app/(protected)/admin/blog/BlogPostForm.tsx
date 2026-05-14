"use client";

import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  LinkIcon,
  List,
  ListOrdered,
  Quote,
  Save,
  Unlink,
} from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { BlogContent, BlogContentNode, BlogPost } from "@/lib/blog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BlogPostFormProps = {
  post?: BlogPost;
};

type UploadedFile = {
  url: string;
  path: string;
};

type ImageUploadResponse = {
  data?: {
    files?: UploadedFile[];
  };
  error?: string;
};

type PendingImage = {
  localUrl: string;
  file: File;
};

const EMPTY_CONTENT: BlogContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

function normalizeLinkHref(value: string) {
  const href = value.trim();

  if (
    href.startsWith("/") ||
    href.startsWith("#") ||
    /^[a-z][a-z0-9+.-]*:/i.test(href)
  ) {
    return href;
  }

  return `https://${href}`;
}

function createUploadFolder(post?: BlogPost) {
  if (post) return post.id;

  const id = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  return `draft-${id}`;
}

function getActiveLinkHref(editor: Editor) {
  const href = editor.getAttributes("link").href;

  return editor.isActive("link") && typeof href === "string" ? href : "";
}

async function readApiResponse<T>(response: Response) {
  const body = (await response.json().catch(() => null)) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(body?.error ?? "Request failed.");
  }

  return body;
}

function replaceImageSources(
  node: BlogContentNode,
  replacements: Map<string, string>,
): BlogContentNode {
  const attrs = node.attrs ? { ...node.attrs } : undefined;

  if (node.type === "image" && typeof attrs?.src === "string") {
    const replacement = replacements.get(attrs.src);

    if (replacement) {
      attrs.src = replacement;
    }
  }

  return {
    ...node,
    attrs,
    content: node.content?.map((child) =>
      replaceImageSources(child, replacements),
    ),
  };
}

function replaceContentImageSources(
  content: BlogContent,
  replacements: Map<string, string>,
): BlogContent {
  return {
    ...content,
    content: content.content?.map((node) =>
      replaceImageSources(node, replacements),
    ),
  };
}

export function BlogPostForm({ post }: BlogPostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploadFolder] = useState(() => createUploadFolder(post));
  const [title, setTitle] = useState(post?.title ?? "");
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImageUrl] = useState(post?.coverImageUrl ?? "");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [activeLinkHref, setActiveLinkHref] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      LinkExtension.configure({
        openOnClick: false,
      }),
      ImageExtension,
      Placeholder.configure({
        placeholder: "เขียนบทความ...",
      }),
    ],
    content: post?.contentJson ?? EMPTY_CONTENT,
    immediatelyRender: false,
    onSelectionUpdate: ({ editor }) => {
      setActiveLinkHref(getActiveLinkHref(editor));
    },
    onUpdate: ({ editor }) => {
      setActiveLinkHref(getActiveLinkHref(editor));
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[380px] rounded-md border bg-white p-4 text-base leading-7 focus:outline-none [&_a]:cursor-pointer [&_a]:rounded-sm [&_a]:font-semibold [&_a]:text-sky-700 [&_a]:underline [&_a]:decoration-sky-400 [&_a]:decoration-2 [&_a]:underline-offset-4 [&_a]:transition [&_a:hover]:bg-sky-50 [&_a:hover]:text-sky-950",
      },
      handlePaste: (_view, event) => {
        const imageFile = Array.from(event.clipboardData?.files ?? []).find(
          (file) => file.type.startsWith("image/"),
        );

        if (!imageFile) return false;

        insertPendingImage(imageFile);
        return true;
      },
    },
  });

  function insertPendingImage(file: File) {
    if (!editor) return;

    const localUrl = URL.createObjectURL(file);
    setPendingImages((current) => [...current, { localUrl, file }]);
    editor.chain().focus().setImage({ src: localUrl, alt: file.name }).run();
    setFeedback("เพิ่มรูปแล้ว รูปจะถูกอัปโหลดตอนบันทึก");
  }

  async function uploadFiles(files: File[]) {
    if (files.length === 0) return [];

    const formData = new FormData();
    formData.set("folder", uploadFolder);
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch("/api/blog/images", {
      method: "POST",
      body: formData,
    });
    const body = await readApiResponse<ImageUploadResponse>(response);

    return body.data?.files ?? [];
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setFeedback(null);

    if (!editor) {
      setError("Editor is not ready.");
      return;
    }

    try {
      const filesToUpload = [
        ...(coverFile ? [coverFile] : []),
        ...pendingImages.map((image) => image.file),
      ];
      const uploadedFiles = await uploadFiles(filesToUpload);
      const uploadedCoverImageUrl = coverFile
        ? uploadedFiles[0]?.url
        : coverImageUrl || null;
      const uploadedContentImages = coverFile
        ? uploadedFiles.slice(1)
        : uploadedFiles;
      const replacements = new Map(
        pendingImages.map((image, index) => [
          image.localUrl,
          uploadedContentImages[index]?.url ?? image.localUrl,
        ]),
      );
      const contentJson = replaceContentImageSources(
        editor.getJSON() as BlogContent,
        replacements,
      );

      const body = {
        title,
        excerpt,
        cover_image_url: uploadedCoverImageUrl,
        content_json: contentJson,
        content_text: editor.getText().trim(),
      };
      const response = await fetch(post ? `/api/blog/${post.id}` : "/api/blog", {
        method: post ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      await readApiResponse(response);
      setFeedback("บันทึกแล้ว");
      setPendingImages([]);
      setCoverFile(null);
      startTransition(() => {
        router.push("/admin/blog");
        router.refresh();
      });
    } catch (error) {
      setError(error instanceof Error ? error.message : "Save failed.");
    }
  }

  function setLink() {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", previousUrl ?? "");

    if (url === null) return;

    if (!url) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    const href = normalizeLinkHref(url);
    editor.chain().focus().setLink({ href }).run();
    setActiveLinkHref(href);
  }

  function unsetLink() {
    if (!editor) return;

    editor.chain().focus().unsetLink().run();
    setActiveLinkHref("");
  }

  const coverPreview = coverFile
    ? URL.createObjectURL(coverFile)
    : coverImageUrl || null;

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-4 rounded-lg border bg-white p-5 shadow-sm">
        {post && (
          <div className="grid gap-1">
            <Label>รหัสบทความ</Label>
            <p className="font-mono text-sm text-muted-foreground">
              {post.code}
            </p>
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="title">ชื่อบทความ</Label>
          <Input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="excerpt">คำโปรย</Label>
          <Input
            id="excerpt"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
          />
        </div>

        <div className="grid gap-3">
          <Label htmlFor="cover-image">Cover image</Label>
          {coverPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPreview}
              alt=""
              className="aspect-video w-full max-w-xl rounded-md border object-cover"
            />
          )}
          <Input
            id="cover-image"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              setCoverFile(file);
            }}
          />
        </div>
      </div>

      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="mb-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            aria-label="Bold"
          >
            <Bold aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            aria-label="Italic"
          >
            <Italic aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
            aria-label="Heading"
          >
            <Heading2 aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            aria-label="Bullet list"
          >
            <List aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            aria-label="Ordered list"
          >
            <ListOrdered aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            aria-label="Quote"
          >
            <Quote aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={activeLinkHref ? "default" : "outline"}
            onClick={setLink}
            aria-label="Link"
            title={activeLinkHref ? `Linked to ${activeLinkHref}` : "Link"}
          >
            <LinkIcon aria-hidden="true" />
          </Button>
          {activeLinkHref && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={unsetLink}
              aria-label="Remove link"
              title="Remove link"
            >
              <Unlink aria-hidden="true" />
            </Button>
          )}
          <Label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent">
            <ImagePlus className="mr-2 h-4 w-4" aria-hidden="true" />
            รูป
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) insertPendingImage(file);
                event.target.value = "";
              }}
            />
          </Label>
        </div>

        {activeLinkHref && (
          <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            <LinkIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="shrink-0 font-medium">Linked</span>
            <span className="truncate font-mono text-xs">{activeLinkHref}</span>
          </div>
        )}

        <EditorContent editor={editor} />
      </div>

      {feedback && <p className="text-sm text-green-700">{feedback}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={isPending}>
        <Save aria-hidden="true" />
        บันทึก
      </Button>
    </form>
  );
}
