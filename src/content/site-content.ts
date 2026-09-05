import { z } from "zod";
import { readArtifactJson } from "./artifacts/source";
import {
  certificationItemSchema,
  contactLinkSchema,
  navigationItemSchema,
  profileSchema,
  projectSchema,
  resumeSchema,
  skillGroupSchema,
  timelineItemSchema,
} from "./schema";

const siteProjectSchema = projectSchema
  .omit({ artifacts: true, icon: true })
  .extend({ order: z.number().int().nonnegative() });

export const siteContentSchema = z.object({
  certifications: z.array(certificationItemSchema),
  contacts: z.array(contactLinkSchema).min(1),
  education: z.array(timelineItemSchema).min(1),
  experience: z.array(timelineItemSchema).min(1),
  lastUpdated: z.iso.date().optional(),
  navigation: z.array(navigationItemSchema).min(1),
  profile: profileSchema,
  projects: z.array(siteProjectSchema).min(1),
  resume: resumeSchema,
  schemaVersion: z.literal(2),
  skills: z.array(skillGroupSchema).min(1),
});

/** Compiled source content consumed by the presentation app. */
export type SiteContent = z.infer<typeof siteContentSchema>;

/** Loads the generated site content contract without reparsing source Markdown. */
export async function loadSiteContent(path: string): Promise<SiteContent> {
  return siteContentSchema.parse(await readArtifactJson(path));
}
