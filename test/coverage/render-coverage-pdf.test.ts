import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { renderCoveragePdf } from "../../scripts/coverage/render-coverage-pdf";

describe("renderCoveragePdf", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { force: true, recursive: true });
    tempDir = "";
  });

  test("renders a standalone coverage report as a PDF", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-pdf-"));
    const coverageDir = join(tempDir, "coverage");
    const input = join(coverageDir, "index.json");
    const output = join(coverageDir, "coverage.pdf");
    mkdirSync(coverageDir, { recursive: true });
    writeFileSync(
      input,
      JSON.stringify({
        minimumCoverage: 95,
        schemaVersion: 2,
        surfaces: [
          {
            files: [],
            id: "typescript",
            label: "TypeScript",
            totals: {
              branches: { covered: 1, found: 1 },
              functions: { covered: 1, found: 1 },
              lines: { covered: 1, found: 1 },
              path: "All files",
            },
          },
        ],
        updatedAt: "2026-08-20T18:42:31.123Z",
      }),
    );

    expect(await renderCoveragePdf(tempDir)).toBe(output);
    expect(existsSync(output)).toBe(true);
    expect(readFileSync(output).subarray(0, 4).toString()).toBe("%PDF");
  });

  test("requires a JSON coverage artifact", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-pdf-"));

    await expect(renderCoveragePdf(tempDir)).rejects.toThrow("Missing coverage artifact");
  });
});
