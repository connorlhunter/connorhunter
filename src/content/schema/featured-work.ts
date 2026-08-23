import { z } from "zod";
import { hrefSchema } from "./base";

/**
 * @description Supported visual treatments for an optional featured-work badge.
 */
export const featuredWorkBadgeToneSchema = z.enum([
  "accent",
  "blue",
  "green",
  "neutral",
  "orange",
  "red",
]);

/**
 * @description Compact icon choices that can be safely selected from published content.
 */
export const featuredWorkBadgeIconSchema = z.enum(["clock", "shield", "sparkles", "tag"]);

/**
 * @description Optional status badge content for a featured-work item.
 */
export const featuredWorkBadgeSchema = z.object({
  icon: featuredWorkBadgeIconSchema.optional(),
  label: z.string().min(1).max(40),
  tone: featuredWorkBadgeToneSchema.default("accent"),
});

/**
 * @description One configurable card shown in an additional Featured Work page.
 */
export const featuredWorkItemSchema = z.object({
  badge: featuredWorkBadgeSchema.optional(),
  href: hrefSchema,
  id: z.string().min(1),
  imageHref: hrefSchema.optional(),
  projectSlug: z.string().min(1).max(80).optional(),
  summary: z.string().min(1).max(280),
  title: z.string().min(1).max(80),
});

/**
 * @description One full-height featured-work image page.
 */
export const featuredWorkPageSchema = z.object({
  id: z.string().min(1),
  items: z.array(featuredWorkItemSchema).length(1),
});

/**
 * @description Optional extra slides appended to the standard project highlights.
 */
export const featuredWorkSchema = z.object({
  additionalPages: z.array(featuredWorkPageSchema).max(12).default([]),
  autoAdvanceMs: z.number().int().min(5_000).max(20_000).default(9_000),
});
