import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type {
  TypographyInlineProps,
  TypographyParagraphProps,
  TypographyPolymorphicProps,
} from "./typography-types";

/**
 * @param props - Lead paragraph attributes and content.
 * @returns A prominent paragraph for page introductions.
 */
export function TypographyLead({
  children,
  className,
  ...props
}: TypographyParagraphProps): ReactNode {
  return (
    <p className={cn("type-lead text-(--text)", className)} {...props}>
      {children}
    </p>
  );
}

/**
 * @param props - Body paragraph attributes and content.
 * @returns A standard paragraph using the shared body rhythm.
 */
export function TypographyP({
  children,
  className,
  ...props
}: TypographyParagraphProps): ReactNode {
  return (
    <p className={cn("type-body text-(--muted)", className)} {...props}>
      {children}
    </p>
  );
}

/**
 * @param props - Muted paragraph attributes and content.
 * @returns A compact muted paragraph for cards and metadata.
 */
export function TypographyMuted({
  as = "p",
  children,
  className,
  ...props
}: TypographyPolymorphicProps): ReactNode {
  return createElement(
    as,
    { className: cn("type-body-small text-(--muted)", className), ...props },
    children,
  );
}

/**
 * @param props - Small inline text attributes and content.
 * @returns A compact inline text node for metadata.
 */
export function TypographySmall({
  as = "span",
  children,
  className,
  ...props
}: TypographyPolymorphicProps): ReactNode {
  return createElement(
    as,
    { className: cn("text-sm font-semibold text-(--muted)", className), ...props },
    children,
  );
}

/**
 * @param props - Eyebrow text attributes, optional semantic element, and content.
 * @returns Uppercase label text that can render as the correct semantic element.
 */
export function TypographyEyebrow({
  as = "p",
  children,
  className,
  ...props
}: TypographyPolymorphicProps): ReactNode {
  return createElement(as, { className: cn("type-eyebrow", className), ...props }, children);
}

/**
 * @param props - Chip text attributes and content.
 * @returns A compact inline chip using the shared type scale.
 */
export function TypographyChip({
  children,
  className,
  ...props
}: TypographyInlineProps): ReactNode {
  return (
    <span
      className={cn(
        "type-chip rounded-md border border-(--border) bg-(--accent-soft) px-2.5 py-1 text-(--text)",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
