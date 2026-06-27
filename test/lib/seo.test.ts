import { describe, expect, test } from "bun:test";
import { publicConfig } from "@/config/public-env";
import { absoluteUrl, buildHomeHead, buildPageHead, buildProjectHead } from "@/lib/seo";
import { mockContent, projectWithoutDownloads } from "../mock-content";

describe("seo helpers", () => {
  test("keeps absolute URLs unchanged and resolves site-relative URLs", () => {
    expect(absoluteUrl(publicConfig.githubProfileUrl)).toBe(publicConfig.githubProfileUrl);
    expect(absoluteUrl("/projects/cipher")).toBe(`${publicConfig.siteOrigin}/projects/cipher`);
  });

  test("builds homepage metadata with all project icons", () => {
    const socialHref = "https://example.com/profile";
    const head = buildHomeHead({
      ...mockContent,
      contacts: [
        ...mockContent.contacts,
        {
          kind: "github",
          label: "Example social",
          href: socialHref,
        },
      ],
    });
    const projectList = head.meta.find((entry) => {
      const script = entry["script:ld+json"];

      return typeof script === "object" && script !== null && "itemListElement" in script;
    });

    expect(head.links.some((link) => link.rel === "canonical" && link.href.endsWith("/"))).toBe(
      true,
    );
    expect(head.meta).toContainEqual({
      content: absoluteUrl(publicConfig.siteIconPath),
      property: "og:image",
    });
    expect(head.meta).toContainEqual({ content: "summary", name: "twitter:card" });
    expect(
      head.links
        .filter((link) => link["data-theme-icon"] === "")
        .every((link) => {
          return link.crossOrigin === "anonymous";
        }),
    ).toBe(true);
    expect(JSON.stringify(projectList)).toContain(projectWithoutDownloads.title);
    expect(JSON.stringify(projectList)).toContain(`${publicConfig.publicAssetsOrigin}/icons/`);
    expect(JSON.stringify(head.meta)).toContain(socialHref);
  });

  test("builds homepage metadata without requiring an email contact", () => {
    const head = buildHomeHead({
      ...mockContent,
      contacts: mockContent.contacts.filter((contact) => contact.kind !== "email"),
    });

    expect(JSON.stringify(head.meta)).toContain(mockContent.profile.name);
  });

  test("builds project metadata from dynamic project records", () => {
    const head = buildProjectHead(projectWithoutDownloads);

    expect(head.meta).toContainEqual({
      title: `${projectWithoutDownloads.title} | ${publicConfig.siteName}`,
    });
    expect(JSON.stringify(head.meta)).not.toContain("github.com/connorlhunter/cipher");
    expect(head.meta).toContainEqual({
      content: absoluteUrl(publicConfig.siteIconPath),
      property: "og:image",
    });
    expect(head.links).toContainEqual({
      href: `${publicConfig.siteOrigin}/projects/${projectWithoutDownloads.slug}`,
      rel: "canonical",
    });
    expect(JSON.stringify(head.meta)).toContain("SoftwareSourceCode");
    expect(JSON.stringify(head.meta)).toContain(
      `${publicConfig.publicAssetsOrigin}/icons/example/mark.svg`,
    );
  });

  test("builds metadata for standalone pages", () => {
    const head = buildPageHead("Example", "Example description.", "/example");

    expect(head.meta).toContainEqual({ title: `Example | ${publicConfig.siteName}` });
    expect(head.links).toContainEqual({
      href: `${publicConfig.siteOrigin}/example`,
      rel: "canonical",
    });
  });
});
