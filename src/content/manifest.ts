import { z } from "zod";
import { publicConfig } from "@/config/public-env";
import { readArtifactJson } from "./artifacts/source";

const contentManifestSchema = z.object({
  lastUpdated: z.iso.date().optional(),
  projectsManifestPath: z.string().min(1),
  schemaVersion: z.literal(2),
  siteContentPath: z.string().min(1),
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
