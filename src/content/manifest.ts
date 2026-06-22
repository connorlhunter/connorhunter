import { z } from "zod";
import { publicConfig } from "@/config/public-env";
import { readArtifactJson } from "./artifacts/source";

const contentManifestSchema = z.object({
  profile: z.object({
    experiencePath: z.string().min(1),
    navigationPath: z.string().min(1),
    profilePath: z.string().min(1),
    skillsPath: z.string().min(1),
    socialLinksPath: z.string().min(1),
  }),
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
