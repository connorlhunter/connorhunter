import { createElement, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { TypographyHeadingProps } from "./typography-types";

/**
 * @param props - Large page heading attributes and content.
 * @returns A semantic level-one heading using the shared page title scale.
 */
export function TypographyH1({
  as = "h1",
  children,
  className,
  ...props
}: TypographyHeadingProps): ReactNode {
  return createElement(
    as,
    { className: cn("type-page-title text-(--text)", className), ...props },
    children,
  );
}

/**
 * @param props - Section heading attributes and content.
 * @returns A semantic level-two heading using the shared section title scale.
 */
export function TypographyH2({
  as = "h2",
  children,
  className,
  ...props
}: TypographyHeadingProps): ReactNode {
  return createElement(
    as,
    { className: cn("type-section-title text-(--text)", className), ...props },
    children,
  );
}

/**
 * @param props - Subsection heading attributes and content.
 * @returns A semantic level-three heading for cards and grouped content.
 */
export function TypographyH3({
  as = "h3",
  children,
  className,
  ...props
}: TypographyHeadingProps): ReactNode {
  return createElement(
    as,
    { className: cn("text-xl font-bold text-(--text)", className), ...props },
    children,
  );
}

/**
 * @param props - Compact heading attributes and content.
 * @returns A semantic level-four heading for dense cards and tool surfaces.
 */
export function TypographyH4({
  as = "h4",
  children,
  className,
  ...props
}: TypographyHeadingProps): ReactNode {
  return createElement(
    as,
    { className: cn("text-lg font-bold text-(--text)", className), ...props },
    children,
  );
}
