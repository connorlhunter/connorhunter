import { describe, expect, test } from "bun:test";
import { parseMarkdownDocument } from "@/features/projects/markdown-document";

describe("parseMarkdownDocument", () => {
  test("keeps published Markdown readable while routing local resource links", () => {
    const blocks = parseMarkdownDocument(
      "# Overview\n\nRead [details](details.md) and [diagram](example-overview.mmd).\n",
      {
        documentIdsByPath: new Map([["docs/example/details.md", "details"]]),
        projectSlug: "example",
        sourcePath: "docs/example/overview.md",
      },
    );

    expect(blocks[0]).toMatchObject({ id: "overview-1", type: "heading" });
    expect(JSON.stringify(blocks)).toContain('"kind":"document"');
    expect(JSON.stringify(blocks)).toContain('"kind":"diagram"');
  });

  test("does not render raw document markup", () => {
    const blocks = parseMarkdownDocument("# Safe\n\n<div>ignored</div>\n\nVisible text.", {
      projectSlug: "example",
      sourcePath: "docs/example/safe.md",
    });

    expect(JSON.stringify(blocks)).not.toContain("ignored");
    expect(JSON.stringify(blocks)).toContain("Visible text.");
  });
});
