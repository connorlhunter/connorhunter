import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  projectArtifactEntry,
  resolveArtifactAlias,
  type ProjectArtifactEntry,
  type ProjectArtifactManifest,
} from "@/content/artifacts/loader";
import { configuredArtifactTextSource } from "@/content/artifacts/source";
import { resolveContentHref } from "@/content/hrefs";
import { navigationPage } from "@/content/page-copy";
import { loadProjects } from "@/content/profile/projects";
import { artifactUrl, publicAssetUrl, publicConfig } from "@/config/public-env";
import { clearPortfolioContentCache, getPortfolioContent, getProjectBySlug } from "@/content";
import { parseJsonFrontmatter } from "@/content/frontmatter";

const exampleArtifactEntry: ProjectArtifactEntry = {
  coverageComingSoon: true,
  coveragePath: "projects/example/coverage/index.html",
  docsPath: "docs/example/index.html",
  iconPath: "asset://icons/example/mark.svg",
  markdownPath: "projects/cipher.md",
  overviewDiagramPath: "diagrams/example/example-overview.svg",
};

const originalFetch = globalThis.fetch;

function frontmatter(metadata: unknown, body = "Fixture body."): string {
  return `---\n${JSON.stringify(metadata, null, 2)}\n---\n\n${body}`;
}

function projectDocument({
  comingSoonSource = false,
  downloads = [],
  kind = "web",
  order,
  slug,
  title,
}: {
  readonly comingSoonSource?: boolean;
  readonly downloads?: ReadonlyArray<unknown>;
  readonly kind?: "desktop" | "pipeline" | "service" | "web";
  readonly order: number;
  readonly slug: string;
  readonly title: string;
}): string {
  return frontmatter(
    {
      order,
      slug,
      title,
      summary: `${title} summary.`,
      status: "Live",
      kind,
      stack: ["TypeScript"],
      problem: `${title} problem.`,
      architecture: `${title} architecture.`,
      links: [
        ...(slug === "connor-hunter" ? [{ kind: "live", label: "Open", href: "site://" }] : []),
        {
          kind: "source",
          label: "Source",
          href: `https://github.com/connorlhunter/${slug}`,
          comingSoon: comingSoonSource,
        },
        {
          kind: "roadmap",
          label: "Roadmap",
          href:
            slug === "connor-hunter"
              ? "https://github.com/users/connorlhunter/projects/9"
              : `https://github.com/connorlhunter/${slug}`,
        },
      ],
      downloads,
    },
    `${title} project notes.`,
  );
}

const artifactFixtures = new Map<string, string>([
  [
    "manifests/content-manifest.json",
    JSON.stringify({
      profile: {
        experiencePath: "profile/experience.md",
        navigationPath: "profile/navigation.md",
        profilePath: "profile/profile.md",
        skillsPath: "profile/skills.md",
        socialLinksPath: "profile/social-links.md",
      },
      projectsManifestPath: "manifests/project-artifacts.json",
    }),
  ],
  [
    "manifests/project-artifacts.json",
    JSON.stringify({
      projects: {
        "connor-hunter": {
          coveragePath: "projects/connor-hunter/coverage/index.html",
          docsPath: "docs/connor-hunter/index.html",
          iconPath: "asset://icons/connor-hunter/mark.svg",
          markdownPath: "projects/connor-hunter.md",
          overviewDiagramPath: "diagrams/connor-hunter/connor-hunter-overview.svg",
        },
        "artifact-generator": {
          coveragePath: "projects/artifact-generator/coverage/index.html",
          docsPath: "docs/artifact-generator/index.html",
          iconPath: "asset://icons/artifact-generator/mark.svg",
          markdownPath: "projects/artifact-generator.md",
          overviewDiagramPath: "diagrams/artifact-generator/artifact-generator-overview.svg",
        },
        cipher: {
          coverageComingSoon: true,
          coveragePath: "projects/cipher/coverage/index.html",
          diagramPaths: [
            "diagrams/cipher/cipher-overview.svg",
            "diagrams/cipher/cipher-auth-model.svg",
          ],
          docsPath: "docs/cipher/index.html",
          iconPath: "asset://icons/cipher/mark.svg",
          markdownPath: "projects/cipher.md",
          overviewDiagramPath: "diagrams/cipher/cipher-overview.svg",
        },
        "cipher-ledger": {
          coverageComingSoon: true,
          coveragePath: "projects/cipher-ledger/coverage/index.html",
          docsPath: "docs/cipher-ledger/index.html",
          iconPath: "asset://icons/cipher-ledger/mark.svg",
          markdownPath: "projects/cipher-ledger.md",
          overviewDiagramPath: "diagrams/cipher-ledger/cipher-ledger-overview.svg",
        },
        "cipher-pay": {
          coverageComingSoon: true,
          coveragePath: "projects/cipher-pay/coverage/index.html",
          docsPath: "docs/cipher-pay/index.html",
          iconPath: "asset://icons/cipher-pay/mark.svg",
          markdownPath: "projects/cipher-pay.md",
          overviewDiagramPath: "diagrams/cipher-pay/cipher-pay-overview.svg",
        },
      },
    }),
  ],
  [
    "profile/profile.md",
    frontmatter({
      name: "Connor Hunter",
      role: "Software Engineer",
      location: "Penn Yan, NY",
      intro: "Intro.",
      summary: "Summary.",
      positioning: "Positioning.",
    }),
  ],
  [
    "profile/navigation.md",
    frontmatter([
      { href: "/skills", label: "Skills", summary: "Skills summary." },
      { href: "/projects", label: "Projects", summary: "Projects summary." },
      { href: "/experience", label: "Experience", summary: "Experience summary." },
      { href: "/contact", label: "Contact", summary: "Contact summary." },
    ]),
  ],
  ["profile/skills.md", frontmatter([{ title: "Languages", skills: ["TypeScript"] }])],
  [
    "profile/experience.md",
    frontmatter({
      experience: [
        {
          title: "Engineer",
          organization: "Example",
          range: "2025",
          location: "Remote",
          bullets: ["Built software."],
        },
      ],
      education: [
        {
          title: "Degree",
          organization: "School",
          range: "2024",
          location: "NY",
          bullets: ["Studied software."],
        },
      ],
      certifications: [
        {
          title: "Cert",
          issuer: "Issuer",
          date: "2025",
          href: "https://example.com/credentials/cert",
          reissuanceDates: ["2026", "2027"],
        },
      ],
    }),
  ],
  [
    "profile/social-links.md",
    frontmatter({
      contacts: [{ kind: "email", label: "email@example.com", href: "mailto:email@example.com" }],
      resume: { label: "Resume", href: "asset://resume/connor-hunter-resume.pdf" },
    }),
  ],
  [
    "projects/connor-hunter.md",
    projectDocument({ order: 1, slug: "connor-hunter", title: "Portfolio" }),
  ],
  [
    "projects/artifact-generator.md",
    projectDocument({
      kind: "pipeline",
      order: 2,
      slug: "artifact-generator",
      title: "Artifact Generator",
    }),
  ],
  [
    "projects/cipher.md",
    projectDocument({
      comingSoonSource: true,
      downloads: [
        { platform: "mac", label: "Mac", href: "https://example.com/mac", comingSoon: true },
        {
          platform: "windows",
          label: "Windows",
          href: "https://example.com/windows",
          comingSoon: true,
        },
      ],
      kind: "desktop",
      order: 3,
      slug: "cipher",
      title: "Cipher",
    }),
  ],
  [
    "projects/cipher-ledger.md",
    projectDocument({
      comingSoonSource: true,
      kind: "service",
      order: 4,
      slug: "cipher-ledger",
      title: "Cipher Ledger",
    }),
  ],
  [
    "projects/cipher-pay.md",
    projectDocument({
      comingSoonSource: true,
      kind: "service",
      order: 5,
      slug: "cipher-pay",
      title: "Cipher Pay",
    }),
  ],
]);

function localArtifactRelativePath(href: string): string {
  const prefix = `${publicConfig.artifactsOrigin}/`;

  return href.startsWith(prefix) ? href.slice(prefix.length) : href;
}

function artifactRequestPath(input: RequestInfo | URL): string | null {
  const artifactOrigin = new URL(`${publicConfig.artifactsOrigin}/`);
  const requestUrl = new URL(String(input));

  if (requestUrl.origin !== artifactOrigin.origin) {
    return null;
  }

  if (!requestUrl.pathname.startsWith(artifactOrigin.pathname)) {
    return null;
  }

  return requestUrl.pathname.slice(artifactOrigin.pathname.length).replace(/^\/+/u, "");
}

async function localArtifactFetch(input: RequestInfo | URL): Promise<Response> {
  const artifactPath = artifactRequestPath(input);

  if (!artifactPath) {
    return new Response("Unexpected artifact request.", { status: 404, statusText: "Not Found" });
  }

  const fixture = artifactFixtures.get(artifactPath);

  return fixture === undefined
    ? new Response("Missing artifact.", { status: 404, statusText: "Not Found" })
    : new Response(fixture);
}

beforeAll(() => {
  globalThis.fetch = localArtifactFetch as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
});

describe("portfolio content", () => {
  test("parses formatted JSON frontmatter with trailing commas", () => {
    const document = parseJsonFrontmatter<{ readonly items: ReadonlyArray<string> }>(`---
{
  "items": [
    "Example",
  ],
}
---

Body content.`);

    expect(document.metadata.items).toEqual(["Example"]);
    expect(document.body).toBe("Body content.");
  });

  test("rejects documents without JSON frontmatter", () => {
    expect(() => parseJsonFrontmatter("Body content.")).toThrow(
      "Expected JSON frontmatter delimited by ---.",
    );
  });

  test("resolves supported content href token styles", () => {
    expect(resolveContentHref("site://")).toBe(`${publicConfig.siteOrigin}/`);
    expect(resolveContentHref("site://projects")).toBe(`${publicConfig.siteOrigin}/projects`);
    expect(resolveContentHref("artifact://docs/example/index.html")).toBe(
      `${publicConfig.artifactsOrigin}/docs/example/index.html`,
    );
    expect(resolveContentHref("asset://icons/example/mark.svg")).toBe(
      `${publicConfig.publicAssetsOrigin}/icons/example/mark.svg`,
    );
    expect(resolveContentHref("https://example.com")).toBe("https://example.com");
  });

  test("guards unsafe artifact paths", async () => {
    await expect(configuredArtifactTextSource.readText("../secrets.md")).rejects.toThrow(
      "Unsafe artifact path",
    );
  });

  test("fetches artifacts through a CloudFront-style origin", async () => {
    const mutableConfig = publicConfig as unknown as { artifactsOrigin: string };
    const originalOrigin = mutableConfig.artifactsOrigin;
    const previousFetch = globalThis.fetch;
    const requests: Array<string> = [];

    mutableConfig.artifactsOrigin = "https://assets.example.com/artifacts";
    globalThis.fetch = ((input: RequestInfo | URL) => {
      requests.push(String(input));
      return Promise.resolve(new Response("Fetched artifact."));
    }) as unknown as typeof fetch;

    try {
      await expect(configuredArtifactTextSource.readText("docs/example.md")).resolves.toBe(
        "Fetched artifact.",
      );
      expect(requests).toEqual(["https://assets.example.com/artifacts/docs/example.md"]);

      globalThis.fetch = (() =>
        Promise.resolve(
          new Response("Missing", { status: 404, statusText: "Not Found" }),
        )) as unknown as typeof fetch;

      await expect(configuredArtifactTextSource.readText("docs/missing.md")).rejects.toThrow(
        "Failed to fetch artifact",
      );

      globalThis.fetch = (() =>
        Promise.reject(new TypeError("fetch failed"))) as unknown as typeof fetch;

      await expect(configuredArtifactTextSource.readText("docs/network.md")).rejects.toThrow(
        "Failed to fetch artifact https://assets.example.com/artifacts/docs/network.md: fetch failed",
      );
    } finally {
      mutableConfig.artifactsOrigin = originalOrigin;
      globalThis.fetch = previousFetch;
    }
  });

  test("throws for missing page and artifact records", () => {
    expect(() => navigationPage({ navigation: [] }, "/missing")).toThrow(
      "Missing navigation content",
    );
    expect(() => projectArtifactEntry({ projects: {} }, "missing")).toThrow(
      "Missing artifact manifest entry",
    );
    expect(() => resolveArtifactAlias(exampleArtifactEntry, "unsupported")).toThrow(
      "Unsupported artifact alias",
    );
  });

  test("validates content and preserves project order", async () => {
    const content = await getPortfolioContent();
    const projectOrders = content.projects.map((project) => project.slug);

    expect(content.profile.name.length).toBeGreaterThan(0);
    expect(projectOrders).toEqual([
      "connor-hunter",
      "artifact-generator",
      "cipher",
      "cipher-ledger",
      "cipher-pay",
    ]);
    expect(content.projects.every((project) => project.artifacts.length === 3)).toBe(true);
    expect(
      content.projects
        .find((project) => project.slug === "cipher")
        ?.artifacts.find((artifact) => artifact.label === "Diagrams")?.items?.length,
    ).toBeGreaterThan(1);
    expect(
      content.projects.every((project) => project.links.some((link) => link.kind === "roadmap")),
    ).toBe(true);
    expect(
      Object.fromEntries(
        content.projects.map((project) => [
          project.slug,
          project.artifacts.find((artifact) => artifact.label === "Coverage")?.comingSoon === true,
        ]),
      ),
    ).toMatchObject({
      "artifact-generator": false,
      cipher: true,
      "cipher-ledger": true,
      "cipher-pay": true,
      "connor-hunter": false,
    });
    expect(
      Object.fromEntries(
        content.projects.flatMap((project) => {
          const coverage = project.artifacts.find((artifact) => artifact.label === "Coverage");
          if (!coverage || coverage.comingSoon) return [];

          return [[project.slug, localArtifactRelativePath(coverage.href)]];
        }),
      ),
    ).toEqual({
      "artifact-generator": "projects/artifact-generator/coverage/index.html",
      "connor-hunter": "projects/connor-hunter/coverage/index.html",
    });
    expect(
      content.projects.every(
        (project) =>
          project.links
            .find((link) => link.kind === "roadmap")
            ?.href.startsWith("https://github.com/") ?? false,
      ),
    ).toBe(true);
    expect(
      content.projects
        .find((project) => project.slug === "connor-hunter")
        ?.links.find((link) => link.kind === "roadmap")?.href,
    ).toBe("https://github.com/users/connorlhunter/projects/9");
    expect(content.certifications.length).toBeGreaterThan(0);
    expect(content.certifications[0]?.href).toBe("https://example.com/credentials/cert");
    expect(content.certifications[0]?.reissuanceDates).toEqual(["2026", "2027"]);
    expect(
      content.projects.every((project) =>
        project.icon.startsWith(`${publicConfig.publicAssetsOrigin}/icons/`),
      ),
    ).toBe(true);
    expect(
      content.projects
        .find((project) => project.slug === "connor-hunter")
        ?.links.find((link) => link.kind === "live")?.href,
    ).toBe(`${publicConfig.siteOrigin}/`);

    clearPortfolioContentCache();
    expect((await getPortfolioContent()).projects.length).toBe(content.projects.length);
  });

  test("keeps artifact links routed through the configured artifact origin", async () => {
    const content = await getPortfolioContent();
    const artifactUrls = content.projects.flatMap((project) =>
      project.artifacts.map((artifact) => artifact.href),
    );

    expect(content.resume.href).toBe(publicAssetUrl("resume/connor-hunter-resume.pdf"));
    expect(artifactUrls.every((href) => href.startsWith(`${publicConfig.artifactsOrigin}/`))).toBe(
      true,
    );
    expect(artifactUrls.every((href) => !href.includes("s3.amazonaws.com"))).toBe(true);
  });

  test("finds projects by slug", async () => {
    const project = await getProjectBySlug("artifact-generator");

    expect(project?.title).toBe("Artifact Generator");
    expect(project?.links.some((link) => link.kind === "live")).toBe(false);
    expect((await getPortfolioContent()).projects.some((item) => item.slug === project?.slug)).toBe(
      true,
    );
    expect(await getProjectBySlug("missing")).toBeUndefined();
  });

  test("reads desktop downloads from project markdown metadata", async () => {
    const content = await getPortfolioContent();
    const projectsWithDownloads = content.projects.filter(
      (project) => project.downloads.length > 0,
    );

    expect(projectsWithDownloads.map((project) => project.slug)).toEqual(["cipher"]);
    expect(projectsWithDownloads.every((project) => project.kind === "desktop")).toBe(true);
    expect(
      projectsWithDownloads
        .flatMap((project) => project.downloads)
        .every((download) => download.comingSoon),
    ).toBe(true);
  });

  test("marks private source repositories as coming soon from project markdown", async () => {
    const content = await getPortfolioContent();
    const sourceAvailability = Object.fromEntries(
      content.projects.map((project) => [
        project.slug,
        project.links.find((link) => link.kind === "source")?.comingSoon === true,
      ]),
    );

    expect(sourceAvailability).toMatchObject({
      cipher: true,
      "cipher-ledger": true,
      "cipher-pay": true,
    });
  });

  test("rejects project markdown that does not match its manifest key", async () => {
    const manifest: ProjectArtifactManifest = {
      projects: {
        mismatched: exampleArtifactEntry,
      },
    };

    await expect(loadProjects(manifest)).rejects.toThrow("Project slug mismatch");
  });
});
