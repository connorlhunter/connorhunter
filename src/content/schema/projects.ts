import { z } from "zod";
import { hrefSchema } from "./base";

/**
 * @description Project artifact child item metadata.
 */
export const artifactItemSchema = z.object({
  href: hrefSchema,
  id: z.string().min(1),
  label: z.string().min(1),
});

/**
 * @description Project artifact link metadata.
 */
export const artifactLinkSchema = z.object({
  comingSoon: z.boolean().optional(),
  label: z.enum(["Docs", "Coverage", "Diagrams"]),
  href: hrefSchema,
  items: z.array(artifactItemSchema).optional(),
});

/**
 * @description Project action link metadata.
 */
export const projectLinkSchema = z.object({
  comingSoon: z.boolean().optional(),
  href: hrefSchema,
  kind: z.enum(["live", "roadmap", "source"]),
  label: z.string().min(1),
});

/**
 * @description Desktop download metadata for projects that provide installers.
 */
export const downloadLinkSchema = z.object({
  comingSoon: z.boolean().optional(),
  href: hrefSchema,
  label: z.string().min(1),
  platform: z.enum(["mac", "windows"]),
});

/**
 * @description Full project metadata rendered by project cards and detail pages.
 */
export const projectSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  status: z.string().min(1),
  stack: z.array(z.string().min(1)).min(1),
  icon: z.string().min(1),
  kind: z.enum(["desktop", "pipeline", "service", "web"]),
  problem: z.string().min(1),
  architecture: z.string().min(1),
  links: z.array(projectLinkSchema).min(1),
  downloads: z.array(downloadLinkSchema),
  artifacts: z.array(artifactLinkSchema).min(1),
  markdown: z.string().min(1),
});
