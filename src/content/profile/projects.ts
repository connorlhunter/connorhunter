import { z } from "zod";
import {
  projectArtifactEntry,
  projectArtifactLinks,
  projectIconHref,
  type ProjectArtifactEntry,
  type ProjectArtifactManifest,
} from "@/content/artifacts/loader";
import { readArtifactText } from "../artifacts/source";
import { parseJsonFrontmatter } from "../frontmatter";
import { resolveContentHref } from "../hrefs";
import type { Project } from "../schema";
import { projectSchema } from "../schema";

const projectMetadataSchema = projectSchema
  .omit({
    artifacts: true,
    icon: true,
    markdown: true,
  })
  .extend({
    order: z.number().int().nonnegative(),
  });

/**
 * @param entry - Project artifact manifest entry used for artifact aliases.
 * @param href - Raw project link href from markdown metadata.
 * @returns A resolved link href for the UI.
 */
function resolveProjectHref(href: string): string {
  return resolveContentHref(href);
}

/**
 * @param raw - Project markdown document with JSON frontmatter.
 * @param entry - Project artifact manifest entry.
 * @param expectedSlug - Manifest slug that must match the markdown slug.
 * @returns Parsed project content with artifact links and markdown body.
 */
function projectFromDocument(
  raw: string,
  entry: ProjectArtifactEntry,
  expectedSlug: string,
): Project & { readonly order: number } {
  const document = parseJsonFrontmatter<unknown>(raw);
  const metadata = projectMetadataSchema.parse(document.metadata);

  if (metadata.slug !== expectedSlug) {
    throw new Error(`Project slug mismatch: expected ${expectedSlug}, found ${metadata.slug}`);
  }

  return {
    ...metadata,
    artifacts: projectArtifactLinks(entry),
    icon: projectIconHref(entry),
    links: metadata.links.map((link) => ({
      ...link,
      href: resolveProjectHref(link.href),
    })),
    markdown: document.body,
  };
}

/**
 * @param artifactManifest - Parsed project artifact manifest.
 * @returns Ordered project content loaded from markdown files.
 */
export async function loadProjects(
  artifactManifest: ProjectArtifactManifest,
): Promise<Array<Project>> {
  const projects = await Promise.all(
    Object.keys(artifactManifest.projects).map(async (slug) => {
      const entry = projectArtifactEntry(artifactManifest, slug);

      return projectFromDocument(await readArtifactText(entry.markdownPath), entry, slug);
    }),
  );

  return projects
    .sort((left, right) => left.order - right.order)
    .map((project) => projectSchema.parse(project));
}
