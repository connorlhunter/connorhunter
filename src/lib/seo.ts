import { publicConfig } from "@/config/public-env";
import type { PortfolioContent, Project } from "@/content/schema";
import { absoluteUrl, baseLinks, baseMeta } from "./seo-base";
import { personJsonLd, projectListJsonLd, softwareSourceCodeJsonLd } from "./seo-json-ld";
import type { HeadConfig } from "./seo-types";

export { absoluteUrl };
export type { HeadConfig, HeadLink, HeadMeta } from "./seo-types";

/**
 * @param content - Complete portfolio content.
 * @returns Head metadata for the homepage.
 */
export function buildHomeHead(content: PortfolioContent): HeadConfig {
  const canonicalUrl = absoluteUrl("/");
  const iconUrl = absoluteUrl(publicConfig.siteIconPath);

  return {
    links: baseLinks(canonicalUrl),
    meta: [
      ...baseMeta({
        description: publicConfig.siteDescription,
        image: iconUrl,
        imageAlt: `${publicConfig.siteName} portfolio preview`,
        title: publicConfig.siteName,
        url: canonicalUrl,
      }),
      personJsonLd(content, iconUrl, canonicalUrl),
      projectListJsonLd(content),
    ],
  };
}

/**
 * @param title - Page title without the site suffix.
 * @param description - Page description for metadata.
 * @param path - Site-relative page path.
 * @returns Head metadata for a standard page.
 */
export function buildPageHead(title: string, description: string, path: string): HeadConfig {
  const canonicalUrl = absoluteUrl(path);
  const iconUrl = absoluteUrl(publicConfig.siteIconPath);
  const pageTitle = `${title} | ${publicConfig.siteName}`;

  return {
    links: baseLinks(canonicalUrl),
    meta: baseMeta({
      description,
      image: iconUrl,
      imageAlt: `${pageTitle} preview`,
      title: pageTitle,
      url: canonicalUrl,
    }),
  };
}

/**
 * @param project - Project record from dynamic content.
 * @returns Head metadata for a project detail page.
 */
export function buildProjectHead(project: Project): HeadConfig {
  const canonicalUrl = absoluteUrl(`/projects/${project.slug}`);
  const imageUrl = absoluteUrl(project.icon);
  const iconUrl = absoluteUrl(publicConfig.siteIconPath);
  const title = `${project.title} | ${publicConfig.siteName}`;

  return {
    links: baseLinks(canonicalUrl),
    meta: [
      ...baseMeta({
        description: project.summary,
        image: iconUrl,
        imageAlt: `${project.title} project preview`,
        title,
        url: canonicalUrl,
      }),
      softwareSourceCodeJsonLd(project, imageUrl, canonicalUrl),
    ],
  };
}
