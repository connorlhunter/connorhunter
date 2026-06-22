import { z } from "zod";
import type { ContentManifest } from "../manifest";
import { readArtifactText } from "../artifacts/source";
import { parseJsonFrontmatter } from "../frontmatter";
import { resolveContentHref } from "../hrefs";
import { contactLinkSchema, resumeSchema, type ContactLink, type Resume } from "../schema";

const socialLinksSchema = z.object({
  contacts: contactLinkSchema.array().min(1),
  resume: resumeSchema,
});

/**
 * @property contacts - Contact links shown in the footer and contact page.
 * @property resume - Resume link content.
 */
export interface SocialLinks {
  readonly contacts: Array<ContactLink>;
  readonly resume: Resume;
}

/**
 * @param manifest - Root content manifest with the social links content path.
 * @returns Parsed contact and resume links with href tokens resolved.
 */
export async function loadSocialLinks(manifest: ContentManifest): Promise<SocialLinks> {
  const socialLinks = socialLinksSchema.parse(
    parseJsonFrontmatter<unknown>(await readArtifactText(manifest.profile.socialLinksPath))
      .metadata,
  );

  return {
    contacts: socialLinks.contacts.map((contact) => ({
      ...contact,
      href: resolveContentHref(contact.href),
    })),
    resume: {
      ...socialLinks.resume,
      href: resolveContentHref(socialLinks.resume.href),
    },
  };
}
