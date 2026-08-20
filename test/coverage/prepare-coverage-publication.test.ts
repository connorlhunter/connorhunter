import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { prepareCoveragePublication } from "../../scripts/coverage/prepare-coverage-publication";

const sampleLcov = `TN:
SF:src/example.ts
FNF:1
FNH:1
LF:2
LH:2
BRF:0
BRH:0
end_of_record
`;

describe("prepareCoveragePublication", () => {
  let tempDir = "";

  afterEach(() => {
    mock.restore();
    if (tempDir) rmSync(tempDir, { force: true, recursive: true });
    tempDir = "";
  });

  test("uses one UTC publication date for the HTML and PDF", async () => {
    spyOn(console, "log").mockImplementation(() => undefined);
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-publication-"));
    const coverageDir = join(tempDir, "coverage");
    const lcov = join(coverageDir, "lcov.info");
    mkdirSync(coverageDir, { recursive: true });
    writeFileSync(lcov, sampleLcov);

    const result = await prepareCoveragePublication(tempDir, "2026-08-20T14:42:31.123-04:00");

    expect(result).toEqual({
      html: join(coverageDir, "index.html"),
      pdf: join(coverageDir, "index.pdf"),
      updatedAt: "2026-08-20T18:42:31.123Z",
    });
    const html = readFileSync(result.html, "utf8");
    expect(html).toContain(
      'Updated <time datetime="2026-08-20T18:42:31.123Z">Aug 20, 2026</time>',
    );
    expect(readFileSync(result.pdf).subarray(0, 4).toString()).toBe("%PDF");
    expect(await normalizedPdfText(result.pdf)).toContain("Updated Aug 20, 2026");
  });
});

/**
 * @param path - Rendered PDF path.
 * @returns Extracted PDF text with layout whitespace normalized.
 */
async function normalizedPdfText(path: string): Promise<string> {
  const loadingTask = getDocument({
    data: new Uint8Array(readFileSync(path)),
    disableFontFace: true,
  });

  try {
    const pdf = await loadingTask.promise;
    const pages = await Promise.all(
      Array.from({ length: pdf.numPages }, async (_, index) => {
        const page = await pdf.getPage(index + 1);
        const content = await page.getTextContent();

        return content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
      }),
    );

    return pages.join(" ").replace(/\s+/gu, " ").trim();
  } finally {
    await loadingTask.destroy();
  }
}
