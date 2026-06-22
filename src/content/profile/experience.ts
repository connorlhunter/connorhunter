import { z } from "zod";
import type { ContentManifest } from "../manifest";
import { readArtifactText } from "../artifacts/source";
import { parseJsonFrontmatter } from "../frontmatter";
import {
  certificationItemSchema,
  timelineItemSchema,
  type CertificationItem,
  type TimelineItem,
} from "../schema";

const profileTimelineSchema = z.object({
  certifications: certificationItemSchema.array(),
  education: timelineItemSchema.array().min(1),
  experience: timelineItemSchema.array().min(1),
});

/**
 * @property certifications - Certification records shown on the experience page.
 * @property education - Education timeline records.
 * @property experience - Work timeline records.
 */
export interface ProfileTimeline {
  readonly certifications: Array<CertificationItem>;
  readonly education: Array<TimelineItem>;
  readonly experience: Array<TimelineItem>;
}

/**
 * @param manifest - Root content manifest with the experience content path.
 * @returns Parsed work, education, and certification content.
 */
export async function loadProfileTimeline(manifest: ContentManifest): Promise<ProfileTimeline> {
  return profileTimelineSchema.parse(
    parseJsonFrontmatter<unknown>(await readArtifactText(manifest.profile.experiencePath)).metadata,
  );
}
