import type { HTMLAttributes, ReactNode } from "react";

export type TypographyElement = "p" | "span" | "h1" | "h2" | "h3" | "h4";
export type TypographyHeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

export interface TypographyHeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly as?: TypographyHeadingElement;
  readonly children: ReactNode;
}

export interface TypographyParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children: ReactNode;
}

export interface TypographyInlineProps extends HTMLAttributes<HTMLSpanElement> {
  readonly children: ReactNode;
}

export interface TypographyPolymorphicProps extends HTMLAttributes<HTMLElement> {
  readonly as?: TypographyElement;
  readonly children: ReactNode;
}
