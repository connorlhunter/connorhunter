import { absoluteSiteUrl, publicConfig } from "@/config/public-env";
import type { HeadLink, HeadMeta } from "./seo-types";

/**
 * @param pathOrUrl - Site-relative path or already absolute URL.
 * @returns An absolute URL for metadata output.
 */
export function absoluteUrl(pathOrUrl: string): string {
  return absoluteSiteUrl(pathOrUrl);
}

/**
 * @param config - Page title, description, preview image, and canonical URL.
 * @returns Shared SEO and link-preview metadata.
 */
export function baseMeta({
  description,
  image,
  imageAlt,
  title,
  url,
}: {
  readonly description: string;
  readonly image: string;
  readonly imageAlt: string;
  readonly title: string;
  readonly url: string;
}): Array<HeadMeta> {
  return [
    { title },
    { content: description, name: "description" },
    { content: title, property: "og:title" },
    { content: description, property: "og:description" },
    { content: publicConfig.siteName, property: "og:site_name" },
    { content: "website", property: "og:type" },
    { content: url, property: "og:url" },
    { content: image, property: "og:image" },
    { content: image, property: "og:image:secure_url" },
    { content: imageAlt, property: "og:image:alt" },
    { content: "summary", name: "twitter:card" },
    { content: title, name: "twitter:title" },
    { content: description, name: "twitter:description" },
    { content: image, name: "twitter:image" },
    { content: imageAlt, name: "twitter:image:alt" },
  ];
}

/**
 * @param canonicalUrl - Absolute canonical URL for the current page.
 * @returns Shared link metadata for canonical and icons.
 */
export function baseLinks(canonicalUrl: string): Array<HeadLink> {
  return [
    { href: canonicalUrl, rel: "canonical" },
    {
      crossOrigin: "anonymous",
      "data-icon-standard": publicConfig.siteIconPath,
      "data-theme-icon": "",
      href: publicConfig.siteIconPath,
      rel: "icon",
      type: "image/svg+xml",
    },
    {
      crossOrigin: "anonymous",
      "data-icon-standard": publicConfig.siteIconPath,
      "data-theme-icon": "",
      href: publicConfig.siteIconPath,
      rel: "apple-touch-icon",
    },
    {
      crossOrigin: "anonymous",
      "data-icon-standard": publicConfig.siteMaskIconPath,
      "data-theme-icon": "",
      href: publicConfig.siteMaskIconPath,
      rel: "mask-icon",
      type: "image/svg+xml",
    },
  ];
}
