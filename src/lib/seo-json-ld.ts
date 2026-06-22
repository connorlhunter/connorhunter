import type { PortfolioContent, Project } from "@/content/schema";
import { publicConfig } from "@/config/public-env";
import { absoluteUrl } from "./seo-base";
import type { HeadMeta } from "./seo-types";

/**
 * @param content - Complete portfolio content.
 * @param iconUrl - Absolute icon URL used as the profile image.
 * @param canonicalUrl - Absolute homepage URL.
 * @returns Person JSON-LD metadata for the homepage.
 */
export function personJsonLd(
  content: PortfolioContent,
  iconUrl: string,
  canonicalUrl: string,
): HeadMeta {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "Person",
      email:
        content.contacts.find((contact) => contact.kind === "email")?.href.replace("mailto:", "") ??
        undefined,
      image: iconUrl,
      jobTitle: content.profile.role,
      name: content.profile.name,
      sameAs: content.contacts
        .filter((contact) => contact.href.startsWith("http"))
        .map((contact) => contact.href),
      url: canonicalUrl,
    },
  };
}

/**
 * @param content - Complete portfolio content.
 * @returns ItemList JSON-LD metadata for project cards.
 */
export function projectListJsonLd(content: PortfolioContent): HeadMeta {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: content.projects.map((project, index) => ({
        "@type": "ListItem",
        item: {
          "@type": "CreativeWork",
          image: absoluteUrl(project.icon),
          name: project.title,
          url: absoluteUrl(`/projects/${project.slug}`),
        },
        position: index + 1,
      })),
      name: `${publicConfig.siteName} projects`,
    },
  };
}

/**
 * @param project - Project record from dynamic content.
 * @param imageUrl - Absolute project image URL.
 * @param canonicalUrl - Absolute project detail URL.
 * @returns SoftwareSourceCode JSON-LD metadata for a project page.
 */
export function softwareSourceCodeJsonLd(
  project: Project,
  imageUrl: string,
  canonicalUrl: string,
): HeadMeta {
  return {
    "script:ld+json": {
      "@context": "https://schema.org",
      "@type": "SoftwareSourceCode",
      codeRepository: project.links.find((link) => link.kind === "source" && !link.comingSoon)
        ?.href,
      description: project.summary,
      image: imageUrl,
      name: project.title,
      programmingLanguage: project.stack,
      url: canonicalUrl,
    },
  };
}
