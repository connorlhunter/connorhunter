import { marked, type Token, type Tokens } from "marked";
import type { DocumentBlock, DocumentInline } from "@/content/schema";

export interface MarkdownDocumentContext {
  readonly documentIdsByPath?: ReadonlyMap<string, string> | undefined;
  readonly projectSlug: string;
  readonly sourcePath: string;
}

/** Parses published Markdown for native rendering without creating HTML. */
export function parseMarkdownDocument(
  markdown: string,
  context: MarkdownDocumentContext,
): DocumentBlock[] {
  return blockTokens(marked.lexer(markdown, { gfm: true }), context);
}

/** Returns text suitable for heading outlines and compact labels. */
export function plainInlineText(items: ReadonlyArray<DocumentInline>): string {
  return items
    .map((item) => (item.type === "link" ? plainInlineText(item.children) : item.value))
    .join("");
}

function blockTokens(
  tokens: ReadonlyArray<Token>,
  context: MarkdownDocumentContext,
): DocumentBlock[] {
  let headingIndex = 0;

  return tokens.flatMap((token): DocumentBlock[] => {
    if (token.type === "space") return [];
    if (token.type === "hr") return [{ type: "rule" }];

    if (token.type === "heading") {
      const content = inlineTokens(token.tokens, context);
      const text = tokenText(token.tokens) || token.text;
      return [
        { content, id: headingId(text, headingIndex++), level: token.depth, type: "heading" },
      ];
    }

    if (token.type === "paragraph" || token.type === "text") {
      return [{ content: inlineTokens(token.tokens, context), type: "paragraph" }];
    }

    if (token.type === "code") {
      return [{ ...(token.lang ? { language: token.lang } : {}), type: "code", value: token.text }];
    }

    if (token.type === "blockquote") {
      return [{ content: blockTokens(token.tokens ?? [], context), type: "quote" }];
    }

    if (token.type === "list") {
      return [
        {
          items: (token.items ?? []).map((item: Tokens.ListItem) =>
            blockTokens(item.tokens, context),
          ),
          ordered: token.ordered,
          type: "list",
        },
      ];
    }

    if (token.type === "table") {
      return [
        {
          rows: [token.header, ...token.rows].map((row) =>
            row.map((cell: Tokens.TableCell) => inlineTokens(cell.tokens, context)),
          ),
          type: "table",
        },
      ];
    }

    return [];
  });
}

function inlineTokens(
  tokens: ReadonlyArray<Token> | undefined,
  context: MarkdownDocumentContext,
): DocumentInline[] {
  return (tokens ?? []).flatMap((token): DocumentInline[] => {
    if (token.type === "strong" || token.type === "em") {
      return [
        { type: token.type === "strong" ? "strong" : "emphasis", value: tokenText(token.tokens) },
      ];
    }
    if (token.type === "codespan") return [{ type: "code", value: token.text }];
    if (token.type === "br") return [{ type: "text", value: "\n" }];
    if (token.type === "image") return [{ type: "text", value: token.text }];

    if (token.type === "link") {
      const children = inlineTokens(token.tokens, context);
      const documentId = localDocumentId(token.href, context);
      if (documentId)
        return [{ children, target: { id: documentId, kind: "document" }, type: "link" }];

      const diagram = diagramId(token.href, context.projectSlug);
      if (diagram) return [{ children, target: { id: diagram, kind: "diagram" }, type: "link" }];

      return [{ children, href: token.href, type: "link" }];
    }

    const value = "text" in token && typeof token.text === "string" ? token.text : token.raw;
    return value ? [{ type: "text", value }] : [];
  });
}

function localDocumentId(href: string, context: MarkdownDocumentContext): string | undefined {
  if (!context.documentIdsByPath || /^[a-z]+:/iu.test(href) || href.startsWith("#"))
    return undefined;
  const [target] = href.split("#");
  if (!target?.endsWith(".md")) return undefined;

  const path = new URL(target, `https://artifact.local/${context.sourcePath}`).pathname.slice(1);
  return context.documentIdsByPath.get(path);
}

function diagramId(href: string, projectSlug: string): string | undefined {
  const [target] = href.split("#");
  if (!target?.endsWith(".mmd") || /^[a-z]+:/iu.test(target)) return undefined;

  const name = (target.split("/").at(-1) ?? "").replace(/\.mmd$/u, "");
  const compact = name.startsWith(`${projectSlug}-`) ? name.slice(projectSlug.length + 1) : name;
  return compact.replace(/[^a-z0-9]+/giu, "-").replace(/^-+|-+$/gu, "");
}

function headingId(value: string, index: number): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/giu, "-")
    .replace(/^-+|-+$/gu, "");
  return normalized ? `${normalized}-${index + 1}` : `section-${index + 1}`;
}

function tokenText(tokens: ReadonlyArray<Token> | undefined): string {
  return (tokens ?? [])
    .map((token) => {
      if ("text" in token && typeof token.text === "string") return token.text;
      if ("raw" in token && typeof token.raw === "string") return token.raw;
      return "";
    })
    .join("")
    .replace(/\s+/gu, " ")
    .trim();
}
