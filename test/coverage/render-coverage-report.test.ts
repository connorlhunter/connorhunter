import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import {
  coverageUpdatedAt,
  coverageUpdatedAtLabel,
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
    const html = renderCoverageHtml(files, "2026-08-20T18:42:31.123Z");

    expect(files).toEqual([
      {
        path: "src/example.ts",
        lines: { covered: 3, found: 4 },
        functions: { covered: 1, found: 2 },
        branches: { covered: 1, found: 2 },
      },
    ]);
    expect(html).toContain("Portfolio Coverage");
    expect(html).toContain('data-scheme="atlas"');
    expect(html).toContain("connorhunter.theme.scheme");
    expect(html).toContain("message.type.endsWith(messageSuffix)");
    expect(html).toContain("75.00%");
    expect(html).toContain("50.00%");
    expect(html).toContain("lcov.info");
    expect(html).toContain(
      'Updated <time datetime="2026-08-20T18:42:31.123Z">Aug 20, 2026</time>',
    );
  });

  test("normalizes the coverage publication date to ISO UTC", () => {
    expect(coverageUpdatedAt("2026-08-20T14:42:31.123-04:00")).toBe(
      "2026-08-20T18:42:31.123Z",
    );
    expect(() => coverageUpdatedAt("not-a-date")).toThrow("Invalid coverage publication date");
  });

  test("formats the UTC publication date without exposing its time", () => {
    expect(coverageUpdatedAtLabel("2026-01-02T00:05:00.000Z")).toBe("Jan 2, 2026");
    expect(coverageUpdatedAtLabel("2026-01-02T12:05:00.000Z")).toBe("Jan 2, 2026");
    expect(coverageUpdatedAtLabel("2026-08-20T18:42:31.123Z")).toBe("Aug 20, 2026");
  });

  test("writes the HTML report beside the fixed LCOV file", () => {
    spyOn(console, "log").mockImplementation(() => undefined);
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));
    const lcovPath = join(tempDir, "coverage", "lcov.info");
    const outputPath = join(tempDir, "coverage", "index.html");
    writeFixtureFile(lcovPath, sampleLcov);

    expect(renderCoverageReport(tempDir, "2026-08-20T18:42:31.123Z")).toBe(outputPath);

    const html = readFileSync(outputPath, "utf8");
    expect(html).toContain("Portfolio Coverage");
    expect(html).toContain('datetime="2026-08-20T18:42:31.123Z"');
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
