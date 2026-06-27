import { z } from "zod";
import { hrefSchema } from "./base";

/**
 * @description Skills grouped by display category.
 */
export const skillGroupSchema = z.object({
  title: z.string().min(1),
  skills: z.array(z.string().min(1)).min(1),
});

/**
 * @description Timeline item metadata for work and education entries.
 */
export const timelineItemSchema = z.object({
  title: z.string().min(1),
  organization: z.string().min(1),
  range: z.string().min(1),
  location: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1),
});

/**
 * @description Certification metadata for the experience page.
 */
export const certificationItemSchema = z.object({
  title: z.string().min(1),
  issuer: z.string().min(1),
  date: z.string().min(1),
  href: hrefSchema,
  reissuanceDates: z.array(z.string().min(1)).min(1).optional(),
});
