import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, test } from "bun:test";
import { coveragePaths } from "../../scripts/coverage/coverage-paths";

describe("coverage paths", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { force: true, recursive: true });
    tempDir = "";
  });

  test("keeps each artifact in the workspace coverage folder", () => {
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-paths-"));

    expect(coveragePaths(tempDir)).toEqual({
      directory: join(tempDir, "coverage"),
      json: join(tempDir, "coverage", "index.json"),
      lcov: join(tempDir, "coverage", "lcov.info"),
      pdf: join(tempDir, "coverage", "coverage.pdf"),
    });
  });
});
