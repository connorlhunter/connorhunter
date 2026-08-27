import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import {
  coverageArtifact,
  coverageUpdatedAt,
  parseLcov,
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

  test("parses LCOV metrics into the portfolio coverage artifact", () => {
    const files = parseLcov(sampleLcov);
    const artifact = coverageArtifact(files, "2026-08-20T18:42:31.123Z");

    expect(files).toEqual([
      {
        path: "src/example.ts",
        lines: { covered: 3, found: 4 },
        functions: { covered: 1, found: 2 },
        branches: { covered: 1, found: 2 },
      },
    ]);
    expect(artifact).toMatchObject({
      minimumCoverage: 95,
      schemaVersion: 2,
      updatedAt: "2026-08-20T18:42:31.123Z",
    });
    expect(artifact.surfaces[0]?.totals.lines).toEqual({ covered: 3, found: 4 });
  });

  test("normalizes the coverage publication date to ISO UTC", () => {
    expect(coverageUpdatedAt("2026-08-20T14:42:31.123-04:00")).toBe(
      "2026-08-20T18:42:31.123Z",
    );
    expect(() => coverageUpdatedAt("not-a-date")).toThrow("Invalid coverage publication date");
  });

  test("writes JSON beside the fixed LCOV file", () => {
    spyOn(console, "log").mockImplementation(() => undefined);
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));
    const lcovPath = join(tempDir, "coverage", "lcov.info");
    const outputPath = join(tempDir, "coverage", "index.json");
    writeFixtureFile(lcovPath, sampleLcov);

    expect(renderCoverageReport(tempDir, "2026-08-20T18:42:31.123Z")).toBe(outputPath);

    const artifact = JSON.parse(readFileSync(outputPath, "utf8"));
    expect(artifact.updatedAt).toBe("2026-08-20T18:42:31.123Z");
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
