import type { ContentManifest } from "../manifest";
import type { Profile } from "../schema";
import { parseJsonFrontmatter } from "../frontmatter";
import { profileSchema } from "../schema";
import { readArtifactText } from "../artifacts/source";

/**
 * @param manifest - Root content manifest with the profile content path.
 * @returns Parsed profile identity and positioning content.
 */
export async function loadProfile(manifest: ContentManifest): Promise<Profile> {
  return profileSchema.parse(
    parseJsonFrontmatter<unknown>(await readArtifactText(manifest.profile.profilePath)).metadata,
  );
}
