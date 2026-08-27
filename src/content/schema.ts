import { z } from "zod";
import {
  documentBlockSchema,
  documentInlineSchema,
  type DocumentBlock,
  type DocumentInline,
  type DocumentLinkTarget,
} from "./schema/document";
import { certificationItemSchema, skillGroupSchema, timelineItemSchema } from "./schema/experience";
import {
  featuredWorkBadgeIconSchema,
  featuredWorkBadgeSchema,
  featuredWorkBadgeToneSchema,
  featuredWorkItemSchema,
  featuredWorkPageSchema,
  featuredWorkSchema,
} from "./schema/featured-work";
import { portfolioContentSchema } from "./schema/portfolio";
import {
  contactLinkSchema,
  navigationItemSchema,
  profileSchema,
  resumeSchema,
} from "./schema/profile";
import {
  artifactItemSchema,
  artifactLinkSchema,
  downloadLinkSchema,
  projectLinkSchema,
  projectSchema,
} from "./schema/projects";

export {
  certificationItemSchema,
  featuredWorkBadgeIconSchema,
  featuredWorkBadgeSchema,
  featuredWorkBadgeToneSchema,
  featuredWorkItemSchema,
  featuredWorkPageSchema,
  featuredWorkSchema,
  contactLinkSchema,
  navigationItemSchema,
  portfolioContentSchema,
  profileSchema,
  resumeSchema,
  skillGroupSchema,
  timelineItemSchema,
  artifactItemSchema,
  artifactLinkSchema,
  documentBlockSchema,
  documentInlineSchema,
  downloadLinkSchema,
  projectLinkSchema,
  projectSchema,
};

/**
 * @description Typed project artifact item record.
 */
export type ArtifactItem = z.infer<typeof artifactItemSchema>;

/**
 * @description Typed project artifact link record.
 */
export type ArtifactLink = z.infer<typeof artifactLinkSchema>;

export type { DocumentBlock, DocumentInline, DocumentLinkTarget };

/**
 * @description Typed certification record.
 */
export type CertificationItem = z.infer<typeof certificationItemSchema>;

/**
 * @description Typed contact link record.
 */
export type ContactLink = z.infer<typeof contactLinkSchema>;

/**
 * @description Typed desktop download link record.
 */
export type DownloadLink = z.infer<typeof downloadLinkSchema>;

/**
 * @description Configurable featured-work section content.
 */
export type FeaturedWork = z.infer<typeof featuredWorkSchema>;

/**
 * @description Configurable badge rendered over a featured-work image.
 */
export type FeaturedWorkBadge = z.infer<typeof featuredWorkBadgeSchema>;

/**
 * @description One configurable featured-work card.
 */
export type FeaturedWorkItem = z.infer<typeof featuredWorkItemSchema>;

/**
 * @description One configurable featured-work slide.
 */
export type FeaturedWorkPage = z.infer<typeof featuredWorkPageSchema>;

/**
 * @description Typed navigation item record.
 */
export type NavigationItem = z.infer<typeof navigationItemSchema>;

/**
 * @description Typed complete portfolio content payload.
 */
export type PortfolioContent = z.infer<typeof portfolioContentSchema>;

/**
 * @description Typed profile record.
 */
export type Profile = z.infer<typeof profileSchema>;

/**
 * @description Typed project record.
 */
export type Project = z.infer<typeof projectSchema>;

/**
 * @description Typed project action link record.
 */
export type ProjectLink = z.infer<typeof projectLinkSchema>;

/**
 * @description Typed resume link record.
 */
export type Resume = z.infer<typeof resumeSchema>;

/**
 * @description Typed skill group record.
 */
export type SkillGroup = z.infer<typeof skillGroupSchema>;

/**
 * @description Typed timeline item record.
 */
export type TimelineItem = z.infer<typeof timelineItemSchema>;
