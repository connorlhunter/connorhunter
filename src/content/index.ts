import { loadProjectArtifactManifest } from "./artifacts/loader";
import { loadContentManifest } from "./manifest";
import { loadProfileTimeline } from "./profile/experience";
import { loadNavigation } from "./profile/navigation";
import { loadProfile } from "./profile/profile";
import { loadProjects } from "./profile/projects";
import { loadSkills } from "./profile/skills";
import { loadSocialLinks } from "./profile/social-links";
import { portfolioContentSchema, type PortfolioContent, type Project } from "./schema";

let portfolioContentPromise: Promise<PortfolioContent> | undefined;

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
    profile,
    contacts: socialLinks.contacts,
    resume: socialLinks.resume,
    navigation,
    skills,
    experience: timeline.experience,
    education: timeline.education,
    certifications: timeline.certifications,
    projects,
  });
}

/**
 * @returns Cached portfolio content loaded from the configured artifact source.
 */
export function getPortfolioContent(): Promise<PortfolioContent> {
  portfolioContentPromise ??= loadPortfolioContent();

  return portfolioContentPromise;
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
  portfolioContentPromise = undefined;
}
