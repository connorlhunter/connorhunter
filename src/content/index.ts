import {
  loadProjectArtifactManifest,
  projectArtifactEntry,
  projectArtifactLinks,
  projectIconHref,
} from "./artifacts/loader";
import { publicConfig } from "@/config/public-env";
import { loadContentManifest } from "./manifest";
import { resolveContentHref } from "./hrefs";
import { loadSiteContent } from "./site-content";
import { portfolioContentSchema, type PortfolioContent, type Project } from "./schema";

interface PortfolioContentCache {
  readonly expiresAt: number;
  readonly promise: Promise<PortfolioContent>;
}

const portfolioContentCacheTtlMs = 30_000;

let portfolioContentCache: PortfolioContentCache | undefined;

/**
 * @returns Portfolio content assembled from profile, navigation, timeline, and project artifacts.
 */
async function loadPortfolioContent(): Promise<PortfolioContent> {
  const contentManifest = await loadContentManifest();
  const [siteContent, projectArtifactManifest] = await Promise.all([
    loadSiteContent(contentManifest.siteContentPath),
    loadProjectArtifactManifest(contentManifest.projectsManifestPath),
  ]);
  const projects = siteContent.projects
    .map((project) => {
      const entry = projectArtifactEntry(projectArtifactManifest, project.slug);
      return {
        ...project,
        artifacts: projectArtifactLinks(entry),
        icon: projectIconHref(entry),
        links: project.links.map((link) => ({ ...link, href: resolveContentHref(link.href) })),
      };
    })
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...project }) => project);

  return portfolioContentSchema.parse({
    lastUpdated: siteContent.lastUpdated ?? contentManifest.lastUpdated ?? publicConfig.lastUpdated,
    profile: siteContent.profile,
    contacts: siteContent.contacts.map((contact) => ({
      ...contact,
      href: resolveContentHref(contact.href),
    })),
    resume: { ...siteContent.resume, href: resolveContentHref(siteContent.resume.href) },
    navigation: siteContent.navigation.map((item) => ({
      ...item,
      href: resolveContentHref(item.href),
    })),
    skills: siteContent.skills,
    experience: siteContent.experience,
    education: siteContent.education,
    certifications: siteContent.certifications,
    ...(siteContent.featuredWork
      ? {
          featuredWork: {
            ...siteContent.featuredWork,
            additionalPages: siteContent.featuredWork.additionalPages.map((page) => ({
              ...page,
              items: page.items.map((item) => ({
                ...item,
                href: resolveContentHref(item.href),
                ...(item.imageHref ? { imageHref: resolveContentHref(item.imageHref) } : {}),
              })),
            })),
          },
        }
      : {}),
    projects,
  });
}

/**
 * @returns Bounded cached portfolio content loaded from the configured artifact source.
 */
export function getPortfolioContent(): Promise<PortfolioContent> {
  const now = Date.now();

  if (portfolioContentCache && portfolioContentCache.expiresAt > now) {
    return portfolioContentCache.promise;
  }

  const promise = loadPortfolioContent();
  portfolioContentCache = {
    expiresAt: now + portfolioContentCacheTtlMs,
    promise,
  };

  void promise.catch(() => {
    if (portfolioContentCache?.promise === promise) {
      portfolioContentCache = undefined;
    }
  });

  return promise;
}

/**
 * @param slug - Project slug from the route.
 * @returns The matching project, or undefined when the slug is unknown.
 */
export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const content = await getPortfolioContent();

  return content.projects.find((project) => project.slug === slug);
}

/**
 * @returns Nothing; clears the portfolio content cache for tests and reloads.
 */
export function clearPortfolioContentCache(): void {
  portfolioContentCache = undefined;
}
