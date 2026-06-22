import { z } from "zod";
import { hrefSchema } from "./base";

/**
 * @description Profile identity and positioning metadata.
 */
export const profileSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1),
  location: z.string().min(1),
  intro: z.string().min(1),
  summary: z.string().min(1),
  positioning: z.string().min(1),
});

/**
 * @description Contact link metadata for email, phone, and social destinations.
 */
export const contactLinkSchema = z.object({
  label: z.string().min(1),
  href: hrefSchema,
  kind: z.enum(["email", "github", "linkedin", "phone"]),
});

/**
 * @description Resume link metadata.
 */
export const resumeSchema = z.object({
  label: z.string().min(1),
  href: hrefSchema,
});

/**
 * @description Header and landing page navigation item metadata.
 */
export const navigationItemSchema = z.object({
  href: hrefSchema,
  label: z.string().min(1),
  summary: z.string().min(1),
});
