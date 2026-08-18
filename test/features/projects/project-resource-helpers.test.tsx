import { describe, expect, test } from "bun:test";
import {
  artifactDownload,
  selectedCoverageItem,
  selectedDiagramItem,
} from "@/features/projects/project-resource-helpers";
import { projectWithDownloads } from "../../mock-content";

describe("artifactDownload", () => {
  const docs = projectWithDownloads.artifacts.find((artifact) => artifact.label === "Docs");

  test("does not offer downloads for the project view or an unavailable source", () => {
    expect(
      artifactDownload(projectWithDownloads, "project", undefined, undefined, undefined),
    ).toBeUndefined();
    expect(
      artifactDownload(projectWithDownloads, "coverage", undefined, undefined, undefined),
    ).toBeUndefined();
  });

  test("uses the generated PDF for docs", () => {
    expect(
      artifactDownload(
        projectWithDownloads,
        "docs",
        { ...docs!, downloadHref: "https://assets.example.com/docs/example/index.pdf" },
        "https://assets.example.com/docs/example/index.html",
        undefined,
      ),
    ).toEqual({
      filename: "desktop-tool-docs.pdf",
      href: "https://assets.example.com/docs/example/index.pdf",
    });
    expect(
      artifactDownload(
        projectWithDownloads,
        "docs",
        docs,
        "https://assets.example.com/docs/example/index.html",
        undefined,
      ),
    ).toBeUndefined();
  });

  test("uses a coverage PDF when the artifact provides one and otherwise falls back to HTML", () => {
    expect(
      artifactDownload(
        projectWithDownloads,
        "coverage",
        {
          href: "https://assets.example.com/projects/example/coverage/index.html",
          label: "Coverage",
          downloadHref: "https://assets.example.com/projects/example/coverage/index.pdf",
        },
        "https://assets.example.com/projects/example/coverage/index.html",
        undefined,
      ),
    ).toEqual({
      filename: "desktop-tool-coverage.pdf",
      href: "https://assets.example.com/projects/example/coverage/index.pdf",
    });
    expect(
      artifactDownload(
        projectWithDownloads,
        "coverage",
        undefined,
        "https://assets.example.com/projects/example/coverage/index.html",
        undefined,
      ),
    ).toEqual({
      filename: "desktop-tool-coverage.html",
      href: "https://assets.example.com/projects/example/coverage/index.html",
    });
  });

  test("uses the selected coverage page PDF when one is available", () => {
    expect(
      artifactDownload(
        projectWithDownloads,
        "coverage",
        undefined,
        "https://assets.example.com/projects/example/coverage/rust.html",
        {
          href: "https://assets.example.com/projects/example/coverage/rust.html",
          id: "rust",
          label: "Rust",
          downloadHref: "https://assets.example.com/projects/example/coverage/rust.pdf",
        },
      ),
    ).toEqual({
      filename: "desktop-tool-rust.pdf",
      href: "https://assets.example.com/projects/example/coverage/rust.pdf",
    });
  });

  test("uses artifact-specific names for diagrams", () => {
    expect(
      artifactDownload(
        projectWithDownloads,
        "diagrams",
        undefined,
        "https://assets.example.com/diagrams/example/overview.svg",
        {
          href: "https://assets.example.com/diagrams/example/overview.svg",
          id: "overview",
          label: "Overview",
        },
      ),
    ).toEqual({
      filename: "desktop-tool-overview.svg",
      href: "https://assets.example.com/diagrams/example/overview.svg",
    });
    expect(
      artifactDownload(
        projectWithDownloads,
        "diagrams",
        undefined,
        "https://assets.example.com/diagrams/example/diagram.svg",
        undefined,
      ),
    ).toEqual({
      filename: "desktop-tool-diagram.svg",
      href: "https://assets.example.com/diagrams/example/diagram.svg",
    });
  });
});

describe("selectedDiagramItem", () => {
  const diagrams = [
    {
      href: "https://assets.example.com/diagrams/key.svg",
      id: "diagram-style-key",
      label: "Diagram Style Key",
    },
    { href: "https://assets.example.com/diagrams/overview.svg", id: "overview", label: "Overview" },
  ];

  test("keeps overview as the diagrams landing page when the key is pinned first", () => {
    expect(selectedDiagramItem(diagrams, undefined)).toEqual(diagrams[1]);
    expect(selectedDiagramItem(diagrams, "diagram-style-key")).toEqual(diagrams[0]);
  });
});

describe("selectedCoverageItem", () => {
  const pages = [
    {
      href: "https://assets.example.com/coverage/typescript.html",
      id: "typescript",
      label: "TypeScript",
    },
    { href: "https://assets.example.com/coverage/rust.html", id: "rust", label: "Rust" },
  ];

  test("uses the requested coverage page and otherwise keeps the first page", () => {
    expect(selectedCoverageItem(pages, undefined)).toEqual(pages[0]);
    expect(selectedCoverageItem(pages, "rust")).toEqual(pages[1]);
  });
});
