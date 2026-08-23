import { z } from "zod";
import { publicConfig } from "@/config/public-env";
import { readArtifactJson } from "./artifacts/source";
import { featuredWorkSchema } from "./schema/featured-work";

const contentManifestSchema = z.object({
  lastUpdated: z.iso.date().optional(),
  profile: z.object({
    experiencePath: z.string().min(1),
    navigationPath: z.string().min(1),
    profilePath: z.string().min(1),
    skillsPath: z.string().min(1),
    socialLinksPath: z.string().min(1),
  }),
  featuredWork: featuredWorkSchema.optional(),
  projectsManifestPath: z.string().min(1),
});

/**
 * @description Root manifest that points to profile and project content files.
 */
export type ContentManifest = z.infer<typeof contentManifestSchema>;

/**
 * @returns The content manifest loaded from the configured artifact source.
 */
export async function loadContentManifest(): Promise<ContentManifest> {
  return contentManifestSchema.parse(await readArtifactJson(publicConfig.contentManifestPath));
}
