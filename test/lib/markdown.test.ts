import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  test("renders local markdown through marked", () => {
    expect(renderMarkdown("A **strong** point.")).toContain("<strong>strong</strong>");
  });

  test("escapes raw HTML and removes unsafe link destinations", () => {
    const rendered = renderMarkdown(
      '<img src="x" onerror="alert(1)"> [unsafe](javascript:alert(1)) [safe](https://example.com)',
    );

    expect(rendered).not.toContain("<img");
    expect(rendered).not.toContain("javascript:");
    expect(rendered).toContain("&lt;img");
    expect(rendered).toContain("unsafe");
    expect(rendered).toContain('<a href="https://example.com">safe</a>');
  });

  test("renders safe local links and images without executable destinations", () => {
    const rendered = renderMarkdown(
      '[section](#details "Read details") ![diagram](https://example.com/diagram.svg "Architecture") ![unsafe](data:image/svg+xml,x) [control](https://example.com/\\bad)',
    );

    expect(rendered).toContain('<a href="#details" title="Read details">section</a>');
    expect(rendered).toContain(
      '<img src="https://example.com/diagram.svg" alt="diagram" title="Architecture">',
    );
    expect(rendered).toContain("unsafe");
    expect(rendered).not.toContain("data:image");
    expect(rendered).not.toContain("https://example.com/\\bad");
  });
});
