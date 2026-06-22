import type { ContentManifest } from "../manifest";
import { readArtifactText } from "../artifacts/source";
import { parseJsonFrontmatter } from "../frontmatter";
import { navigationItemSchema, type NavigationItem } from "../schema";
import { resolveContentHref } from "../hrefs";

/**
 * @param manifest - Root content manifest with the navigation content path.
 * @returns Navigation items with content href tokens resolved.
 */
export async function loadNavigation(manifest: ContentManifest): Promise<Array<NavigationItem>> {
  return navigationItemSchema
    .array()
    .parse(
      parseJsonFrontmatter<unknown>(await readArtifactText(manifest.profile.navigationPath))
        .metadata,
    )
    .map((item) => ({
      ...item,
      href: resolveContentHref(item.href),
    }));
}
