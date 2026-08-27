import { z } from "zod";

export interface DocumentLinkTarget {
  readonly id: string;
  readonly kind: "diagram" | "document";
}

export type DocumentInline =
  | { readonly type: "code"; readonly value: string }
  | { readonly type: "emphasis"; readonly value: string }
  | { readonly type: "strong"; readonly value: string }
  | { readonly type: "text"; readonly value: string }
  | {
      readonly children: ReadonlyArray<DocumentInline>;
      readonly href?: string | undefined;
      readonly target?: DocumentLinkTarget | undefined;
      readonly type: "link";
    };

export type DocumentBlock =
  | {
      readonly content: ReadonlyArray<DocumentInline>;
      readonly id?: string | undefined;
      readonly level?: number | undefined;
      readonly type: "heading";
    }
  | { readonly content: ReadonlyArray<DocumentInline>; readonly type: "paragraph" }
  | { readonly language?: string | undefined; readonly type: "code"; readonly value: string }
  | {
      readonly items: ReadonlyArray<ReadonlyArray<DocumentBlock>>;
      readonly ordered: boolean;
      readonly type: "list";
    }
  | { readonly content: ReadonlyArray<DocumentBlock>; readonly type: "quote" }
  | {
      readonly rows: ReadonlyArray<ReadonlyArray<ReadonlyArray<DocumentInline>>>;
      readonly type: "table";
    }
  | { readonly type: "rule" };

const documentLinkTargetSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["diagram", "document"]),
});

export const documentInlineSchema: z.ZodType<DocumentInline> = z.lazy(() =>
  z.union([
    z.object({ type: z.literal("code"), value: z.string() }),
    z.object({ type: z.literal("emphasis"), value: z.string() }),
    z.object({ type: z.literal("strong"), value: z.string() }),
    z.object({ type: z.literal("text"), value: z.string() }),
    z.object({
      children: z.array(documentInlineSchema),
      href: z.string().min(1).optional(),
      target: documentLinkTargetSchema.optional(),
      type: z.literal("link"),
    }),
  ]),
);

export const documentBlockSchema: z.ZodType<DocumentBlock> = z.lazy(() =>
  z.union([
    z.object({
      content: z.array(documentInlineSchema),
      id: z.string().min(1).optional(),
      level: z.number().int().min(1).max(6).optional(),
      type: z.literal("heading"),
    }),
    z.object({ content: z.array(documentInlineSchema), type: z.literal("paragraph") }),
    z.object({
      language: z.string().min(1).optional(),
      type: z.literal("code"),
      value: z.string(),
    }),
    z.object({
      items: z.array(z.array(documentBlockSchema)),
      ordered: z.boolean(),
      type: z.literal("list"),
    }),
    z.object({ content: z.array(documentBlockSchema), type: z.literal("quote") }),
    z.object({ rows: z.array(z.array(z.array(documentInlineSchema))), type: z.literal("table") }),
    z.object({ type: z.literal("rule") }),
  ]),
);
