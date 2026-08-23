import { loadProjectArtifactManifest } from "./artifacts/loader";
import { publicConfig } from "@/config/public-env";
import { loadContentManifest } from "./manifest";
import { loadProfileTimeline } from "./profile/experience";
import { loadNavigation } from "./profile/navigation";
import { loadProfile } from "./profile/profile";
import { loadProjects } from "./profile/projects";
import { loadSkills } from "./profile/skills";
import { loadSocialLinks } from "./profile/social-links";
import { resolveContentHref } from "./hrefs";
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
  const [profile, socialLinks, navigation, skills, timeline, projectArtifactManifest] =
    await Promise.all([
      loadProfile(contentManifest),
      loadSocialLinks(contentManifest),
      loadNavigation(contentManifest),
      loadSkills(contentManifest),
      loadProfileTimeline(contentManifest),
      loadProjectArtifactManifest(contentManifest.projectsManifestPath),
    ]);
  const projects = await loadProjects(projectArtifactManifest);

  return portfolioContentSchema.parse({
    lastUpdated: contentManifest.lastUpdated ?? publicConfig.lastUpdated,
    profile,
    contacts: socialLinks.contacts,
    resume: socialLinks.resume,
    navigation,
    skills,
    experience: timeline.experience,
    education: timeline.education,
    certifications: timeline.certifications,
    ...(contentManifest.featuredWork
      ? {
          featuredWork: {
            ...contentManifest.featuredWork,
            additionalPages: contentManifest.featuredWork.additionalPages.map((page) => ({
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
