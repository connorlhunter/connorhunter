import type { ContentManifest } from "../manifest";
import { readArtifactText } from "../artifacts/source";
import { parseJsonFrontmatter } from "../frontmatter";
import { skillGroupSchema, type SkillGroup } from "../schema";

/**
 * @param manifest - Root content manifest with the skills content path.
 * @returns Parsed skill groups from profile content.
 */
export async function loadSkills(manifest: ContentManifest): Promise<Array<SkillGroup>> {
  return skillGroupSchema
    .array()
    .parse(
      parseJsonFrontmatter<unknown>(await readArtifactText(manifest.profile.skillsPath)).metadata,
    );
}
