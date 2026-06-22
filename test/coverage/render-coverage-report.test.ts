import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import {
  parseLcov,
  renderCoverageHtml,
  renderCoverageReport,
} from "../../scripts/coverage/render-coverage-report";

const sampleLcov = `TN:
SF:src/example.ts
FNF:2
FNH:1
LF:4
LH:3
BRF:2
BRH:1
end_of_record
`;

describe("render coverage report", () => {
  let tempDir = "";

  afterEach(() => {
    mock.restore();
    if (tempDir) rmSync(tempDir, { force: true, recursive: true });
    tempDir = "";
  });

  test("parses lcov metrics and renders portfolio coverage html", () => {
    const files = parseLcov(sampleLcov);
    const html = renderCoverageHtml(files);

    expect(files).toEqual([
      {
        path: "src/example.ts",
        lines: { covered: 3, found: 4 },
        functions: { covered: 1, found: 2 },
        branches: { covered: 1, found: 2 },
      },
    ]);
    expect(html).toContain("Portfolio Coverage");
    expect(html).toContain("--bg: #ffffff");
    expect(html).toContain("75.00%");
    expect(html).toContain("50.00%");
    expect(html).toContain("lcov.info");
  });

  test("writes the html report and lcov file to the configured coverage folder", () => {
    spyOn(console, "log").mockImplementation(() => undefined);
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));
    const lcovPath = join(tempDir, "coverage", "lcov.info");
    const outputPath = join(tempDir, "coverage", "index.html");
    writeFixtureFile(lcovPath, sampleLcov);

    expect(renderCoverageReport(lcovPath, outputPath)).toBe(outputPath);

    expect(readFileSync(outputPath, "utf8")).toContain("Portfolio Coverage");
    expect(existsSync(join(tempDir, "coverage", "lcov.info"))).toBe(true);
  });
});

/**
 * @param path - Fixture file path.
 * @param content - Fixture file contents.
 */
function writeFixtureFile(path: string, content: string): void {
  const directory = path.split("/").slice(0, -1).join("/");

  if (directory) {
    mkdirSync(directory, { recursive: true });
  }

  writeFileSync(path, content);
}
