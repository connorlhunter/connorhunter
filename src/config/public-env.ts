import { z } from "zod";

const cloudFrontDistributionIdOriginMessage =
  "Use the CloudFront distribution domain name, usually d...cloudfront.net, not the distribution ID, usually E....";

const publicOriginSchema = z
  .string()
  .url()
  .refine((value) => !isCloudFrontDistributionIdOrigin(value), {
    message: cloudFrontDistributionIdOriginMessage,
  });
const publicAssetReferenceSchema = z
  .string()
  .min(1)
  .refine((value) => value.startsWith("asset://") || z.string().url().safeParse(value).success, {
    message: "Expected an asset:// reference or absolute URL.",
  });

const publicEnvSchema = z.object({
  VITE_PUBLIC_ARTIFACTS_ORIGIN: publicOriginSchema,
  VITE_PUBLIC_ASSETS_ORIGIN: publicOriginSchema,
  VITE_PUBLIC_CONTENT_MANIFEST_PATH: z.string().min(1),
  VITE_PUBLIC_CONTACT_EMAIL: z.string().email(),
  VITE_PUBLIC_CONTACT_PHONE: z.string().min(1),
  VITE_PUBLIC_CONTACT_PHONE_LABEL: z.string().min(1),
  VITE_PUBLIC_GITHUB_ORIGIN: z.string().url(),
  VITE_PUBLIC_GITHUB_OWNER: z.string().min(1),
  VITE_PUBLIC_GITHUB_PROFILE_URL: z.string().url(),
  VITE_PUBLIC_LINKEDIN_URL: z.string().url(),
  VITE_PUBLIC_APP_STORAGE_NAMESPACE: z.string().min(1).optional(),
  VITE_PUBLIC_RELEASE_DOWNLOAD_CHANNEL: z.string().min(1),
  VITE_PUBLIC_SITE_DESCRIPTION: z.string().min(1),
  VITE_PUBLIC_SITE_ICON: publicAssetReferenceSchema,
  VITE_PUBLIC_SITE_MASK_ICON: publicAssetReferenceSchema,
  VITE_PUBLIC_SITE_NAME: z.string().min(1),
  VITE_PUBLIC_SITE_ORIGIN: z.string().url(),
  VITE_PUBLIC_THEME_ROOT_DOMAIN: z.string().min(1).optional(),
});

/**
 * @param value - Public origin value to inspect.
 * @returns Whether the origin appears to use a CloudFront distribution ID as its hostname.
 */
export function isCloudFrontDistributionIdOrigin(value: string): boolean {
  try {
    const { hostname } = new URL(value);

    return /^e[a-z0-9]{8,}\.cloudfront\.net$/iu.test(hostname);
  } catch {
    return false;
  }
}

const env = publicEnvSchema.parse(import.meta.env);
const artifactsOrigin = trimTrailingSlash(env.VITE_PUBLIC_ARTIFACTS_ORIGIN);
const publicAssetsOrigin = trimTrailingSlash(env.VITE_PUBLIC_ASSETS_ORIGIN);

/**
 * @param value - URL or path value to normalize.
 * @returns The value without trailing slash characters.
 */
function trimTrailingSlash(value: string): string {
  if (value === "/") {
    return value;
  }

  return value.replace(/\/+$/u, "");
}

/**
 * @param origin - Absolute public URL origin.
 * @param path - Path segment or relative URL to append.
 * @returns A joined public URL.
 */
function joinUrl(origin: string, path: string): string {
  return new URL(path, `${trimTrailingSlash(origin)}/`).toString();
}

/**
 * @param value - Public env value that may use an asset URI token.
 * @returns A resolved public asset URL or the original value.
 */
export function resolvePublicAssetHref(value: string): string {
  if (value.startsWith("asset://")) {
    return joinUrl(publicAssetsOrigin, value.replace("asset://", ""));
  }

  return value;
}

/**
 * @param value - Absolute public URL.
 * @returns A compact hostname and path label.
 */
function publicUrlLabel(value: string): string {
  const url = new URL(value);

  return `${url.hostname}${url.pathname}`.replace(/\/$/u, "");
}

/**
 * @param value - Absolute site URL.
 * @returns Hostname suitable for same-site cookie domain checks.
 */
function publicUrlHostname(value: string): string {
  return new URL(value).hostname;
}

/**
 * @description Parsed public runtime configuration from Vite environment variables.
 */
export const publicConfig = {
  artifactsOrigin,
  appStorageNamespace: env.VITE_PUBLIC_APP_STORAGE_NAMESPACE ?? "portfolio",
  publicAssetsOrigin,
  contentManifestPath: env.VITE_PUBLIC_CONTENT_MANIFEST_PATH,
  contactEmail: env.VITE_PUBLIC_CONTACT_EMAIL,
  contactEmailHref: `mailto:${env.VITE_PUBLIC_CONTACT_EMAIL}`,
  contactPhoneHref: `tel:${env.VITE_PUBLIC_CONTACT_PHONE}`,
  contactPhoneLabel: env.VITE_PUBLIC_CONTACT_PHONE_LABEL,
  githubOrigin: trimTrailingSlash(env.VITE_PUBLIC_GITHUB_ORIGIN),
  githubOwner: env.VITE_PUBLIC_GITHUB_OWNER,
  githubProfileLabel: publicUrlLabel(env.VITE_PUBLIC_GITHUB_PROFILE_URL),
  githubProfileUrl: env.VITE_PUBLIC_GITHUB_PROFILE_URL,
  linkedinLabel: publicUrlLabel(env.VITE_PUBLIC_LINKEDIN_URL),
  linkedinUrl: env.VITE_PUBLIC_LINKEDIN_URL,
  releaseDownloadChannel: env.VITE_PUBLIC_RELEASE_DOWNLOAD_CHANNEL,
  siteDescription: env.VITE_PUBLIC_SITE_DESCRIPTION,
  siteIconPath: resolvePublicAssetHref(env.VITE_PUBLIC_SITE_ICON),
  siteMaskIconPath: resolvePublicAssetHref(env.VITE_PUBLIC_SITE_MASK_ICON),
  siteName: env.VITE_PUBLIC_SITE_NAME,
  siteOrigin: trimTrailingSlash(env.VITE_PUBLIC_SITE_ORIGIN),
  themeRootDomain:
    env.VITE_PUBLIC_THEME_ROOT_DOMAIN ?? publicUrlHostname(env.VITE_PUBLIC_SITE_ORIGIN),
} as const;

/**
 * @param pathOrUrl - Site-relative path or already absolute URL.
 * @returns An absolute URL on the configured site origin.
 */
export function absoluteSiteUrl(pathOrUrl: string): string {
  if (/^[a-z][a-z\d+\-.]*:/iu.test(pathOrUrl)) {
    return pathOrUrl;
  }

  return joinUrl(publicConfig.siteOrigin, pathOrUrl);
}

/**
 * @param path - Artifact path inside the CloudFront-backed artifact root.
 * @returns A public artifact URL.
 */
export function artifactUrl(path: string): string {
  return joinUrl(publicConfig.artifactsOrigin, path);
}

/**
 * @param path - Public static asset path inside the CloudFront-backed root.
 * @returns A public static asset URL.
 */
export function publicAssetUrl(path: string): string {
  return joinUrl(publicConfig.publicAssetsOrigin, path);
}

/**
 * @param repo - Repository name under the configured GitHub owner.
 * @returns The public repository URL.
 */
export function repositoryUrl(repo: string): string {
  return joinUrl(publicConfig.githubOrigin, `${publicConfig.githubOwner}/${repo}`);
}

/**
 * @param repo - Repository name under the configured GitHub owner.
 * @param asset - Release asset filename.
 * @returns The public release asset URL.
 */
export function releaseAssetUrl(repo: string, asset: string): string {
  return joinUrl(
    publicConfig.githubOrigin,
    `${publicConfig.githubOwner}/${repo}/releases/${publicConfig.releaseDownloadChannel}/download/${asset}`,
  );
}
