import Link from "next/link";
import type { ReactNode } from "react";
import type { BlogContentNode } from "@/lib/blog";

type BlogContentProps = {
  content: BlogContentNode[];
};

const LINK_CLASS_NAME =
  "cursor-pointer rounded-sm font-semibold text-secondary underline decoration-accent/40 decoration-2 underline-offset-4 transition hover:bg-secondary/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50";

function getTextMarks(
  text: string,
  marks: BlogContentNode["marks"] = [],
  key: string,
) {
  return marks.reduce<React.ReactNode>((children, mark, index) => {
    if (mark.type === "bold") {
      return <strong key={`${key}-${index}`}>{children}</strong>;
    }

    if (mark.type === "italic") {
      return <em key={`${key}-${index}`}>{children}</em>;
    }

    if (mark.type === "link") {
      const href = mark.attrs?.href;

      if (typeof href === "string") {
        const isInternal = href.startsWith("/");

        return isInternal ? (
          <Link key={`${key}-${index}`} href={href} className={LINK_CLASS_NAME}>
            {children}
          </Link>
        ) : (
          <a
            key={`${key}-${index}`}
            href={href}
            className={LINK_CLASS_NAME}
            target="_blank"
            rel="noreferrer"
          >
            {children}
          </a>
        );
      }
    }

    return children;
  }, text);
}

function renderNodes(
  nodes: BlogContentNode[] | undefined,
  keyPrefix: string,
): ReactNode[] | undefined {
  return nodes?.map((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.type === "text") {
      return getTextMarks(node.text ?? "", node.marks, key);
    }

    if (node.type === "heading") {
      const level = node.attrs?.level === 3 ? 3 : 2;
      const className =
        level === 3
          ? "mt-8 text-2xl font-semibold text-primary"
          : "mt-10 text-3xl font-bold text-primary";

      return level === 3 ? (
        <h3 key={key} className={className}>
          {renderNodes(node.content, key)}
        </h3>
      ) : (
        <h2 key={key} className={className}>
          {renderNodes(node.content, key)}
        </h2>
      );
    }

    if (node.type === "paragraph") {
      return (
        <p key={key} className="my-5 leading-8">
          {renderNodes(node.content, key)}
        </p>
      );
    }

    if (node.type === "blockquote") {
      return (
        <blockquote
          key={key}
          className="my-6 border-l-4 border-stone-300 pl-4 italic text-stone-600"
        >
          {renderNodes(node.content, key)}
        </blockquote>
      );
    }

    if (node.type === "bulletList") {
      return (
        <ul key={key} className="my-5 list-disc space-y-2 pl-6">
          {renderNodes(node.content, key)}
        </ul>
      );
    }

    if (node.type === "orderedList") {
      return (
        <ol key={key} className="my-5 list-decimal space-y-2 pl-6">
          {renderNodes(node.content, key)}
        </ol>
      );
    }

    if (node.type === "listItem") {
      return <li key={key}>{renderNodes(node.content, key)}</li>;
    }

    if (node.type === "image") {
      const src = node.attrs?.src;
      const alt = typeof node.attrs?.alt === "string" ? node.attrs.alt : "";

      if (typeof src !== "string") {
        return null;
      }

      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={src}
          alt={alt}
          className="my-8 w-full rounded-lg object-cover"
        />
      );
    }

    return renderNodes(node.content, key);
  });
}

export function BlogContent({ content }: BlogContentProps) {
  return (
    <div className="prose prose-stone max-w-none text-lg">
      {renderNodes(content, "blog")}
    </div>
  );
}
