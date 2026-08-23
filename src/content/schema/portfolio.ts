import { z } from "zod";
import { certificationItemSchema, skillGroupSchema, timelineItemSchema } from "./experience";
import { featuredWorkSchema } from "./featured-work";
import { contactLinkSchema, navigationItemSchema, profileSchema, resumeSchema } from "./profile";
import { projectSchema } from "./projects";

/**
 * @description Complete portfolio content payload consumed by the app.
 */
export const portfolioContentSchema = z.object({
  lastUpdated: z.iso.date().optional(),
  profile: profileSchema,
  contacts: z.array(contactLinkSchema).min(1),
  resume: resumeSchema,
  navigation: z.array(navigationItemSchema).min(1),
  skills: z.array(skillGroupSchema).min(1),
  experience: z.array(timelineItemSchema).min(1),
  education: z.array(timelineItemSchema).min(1),
  certifications: z.array(certificationItemSchema),
  featuredWork: featuredWorkSchema.optional(),
  projects: z.array(projectSchema).min(1),
});
