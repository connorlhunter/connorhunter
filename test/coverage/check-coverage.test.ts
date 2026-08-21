import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, mock, spyOn, test } from "bun:test";
import { checkCoverage } from "../../scripts/coverage/check-coverage";

let directory = "";

afterEach(() => {
  mock.restore();
  if (directory) rmSync(directory, { force: true, recursive: true });
  directory = "";
});

test("requires at least 95% lines, functions, and branches", () => {
  directory = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));
  const passingPath = join(directory, "passing.lcov");
  const failingPath = join(directory, "failing.lcov");
  writeFileSync(passingPath, "LF:20\nLH:19\nFNF:20\nFNH:19\nBRF:20\nBRH:19\n");
  writeFileSync(failingPath, "LF:20\nLH:18\nFNF:20\nFNH:19\nBRF:20\nBRH:19\n");
  const log = spyOn(console, "log").mockImplementation(() => undefined);

  expect(() => checkCoverage(passingPath)).not.toThrow();
  expect(log).toHaveBeenCalledWith("Coverage passed at 95% lines, functions, and branches.");
  expect(() => checkCoverage(failingPath)).toThrow("Coverage must be at least 95%");
});
