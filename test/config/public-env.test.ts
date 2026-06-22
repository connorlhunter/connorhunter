import { describe, expect, test } from "bun:test";
import {
  absoluteSiteUrl,
  artifactUrl,
  publicConfig,
  publicAssetUrl,
  isCloudFrontDistributionIdOrigin,
  releaseAssetUrl,
  repositoryUrl,
  resolvePublicAssetHref,
} from "@/config/public-env";

const labelFor = (value: string): string => {
  const url = new URL(value);

  return `${url.hostname}${url.pathname}`.replace(/\/$/u, "");
};

describe("public env config", () => {
  test("derives contact links and labels from public env", () => {
    expect(publicConfig.contactEmailHref).toBe(`mailto:${publicConfig.contactEmail}`);
    expect(publicConfig.contactPhoneHref).toStartWith("tel:");
    expect(publicConfig.githubProfileLabel).toBe(labelFor(publicConfig.githubProfileUrl));
    expect(publicConfig.linkedinLabel).toBe(labelFor(publicConfig.linkedinUrl));
  });

  test("builds public URLs from configured origins", () => {
    expect(absoluteSiteUrl(publicConfig.githubProfileUrl)).toBe(publicConfig.githubProfileUrl);
    expect(absoluteSiteUrl("/projects/cipher")).toBe(`${publicConfig.siteOrigin}/projects/cipher`);
    expect(artifactUrl("docs/cipher/index.html")).toBe(
      `${publicConfig.artifactsOrigin}/docs/cipher/index.html`,
    );
    expect(artifactUrl(publicConfig.contentManifestPath)).toBe(
      `${publicConfig.artifactsOrigin}/manifests/content-manifest.json`,
    );
    expect(publicAssetUrl("icons/connor-hunter/app-icon-square.svg")).toBe(
      `${publicConfig.publicAssetsOrigin}/icons/connor-hunter/app-icon-square.svg`,
    );
    expect(resolvePublicAssetHref("asset://icons/connor-hunter/mark.svg")).toBe(
      `${publicConfig.publicAssetsOrigin}/icons/connor-hunter/mark.svg`,
    );
    expect(resolvePublicAssetHref(publicConfig.githubProfileUrl)).toBe(
      publicConfig.githubProfileUrl,
    );
    expect(publicConfig.siteIconPath).toBe(
      publicAssetUrl("icons/connor-hunter/app-icon-square.svg"),
    );
    expect(publicConfig.siteMaskIconPath).toBe(publicAssetUrl("icons/connor-hunter/mark.svg"));
    expect(repositoryUrl("cipher")).toBe(
      `${publicConfig.githubOrigin}/${publicConfig.githubOwner}/cipher`,
    );
    expect(releaseAssetUrl("cipher", "cipher-macos.dmg")).toBe(
      `${publicConfig.githubOrigin}/${publicConfig.githubOwner}/cipher/releases/${publicConfig.releaseDownloadChannel}/download/cipher-macos.dmg`,
    );
  });

  test("detects CloudFront distribution IDs used as public origins", () => {
    expect(isCloudFrontDistributionIdOrigin("https://E1CSMY761RI4LF.cloudfront.net")).toBe(true);
    expect(isCloudFrontDistributionIdOrigin("https://d111111abcdef8.cloudfront.net")).toBe(false);
    expect(isCloudFrontDistributionIdOrigin("https://artifacts.connorhunter.me")).toBe(false);
  });
});
