import { absoluteSiteUrl, artifactUrl, publicAssetUrl } from "@/config/public-env";

/**
 * @param href - Raw content href using site, artifact, or absolute syntax.
 * @returns A resolved href that the UI can render directly.
 */
export function resolveContentHref(href: string): string {
  if (href === "site://") {
    return absoluteSiteUrl("/");
  }

  if (href.startsWith("site://")) {
    return absoluteSiteUrl(href.replace("site://", "/"));
  }

  if (href.startsWith("artifact://")) {
    return artifactUrl(href.replace("artifact://", ""));
  }

  if (href.startsWith("asset://")) {
    return publicAssetUrl(href.replace("asset://", ""));
  }

  return href;
}
