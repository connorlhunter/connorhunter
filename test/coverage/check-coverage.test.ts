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
  writeFileSync(
    passingPath,
    "SF:src/example.ts\nLF:20\nLH:19\nFNF:20\nFNH:19\nBRF:20\nBRH:19\nend_of_record\n",
  );
  writeFileSync(
    failingPath,
    "SF:src/example.ts\nLF:20\nLH:18\nFNF:20\nFNH:19\nBRF:20\nBRH:19\nend_of_record\n",
  );
  const log = spyOn(console, "log").mockImplementation(() => undefined);

  expect(() => checkCoverage(passingPath)).not.toThrow();
  expect(log).toHaveBeenCalledWith("Coverage passed at 95% lines, functions, and branches.");
  expect(() => checkCoverage(failingPath)).toThrow("Coverage must be at least 95%");
});

test.each([
  "",
  "TN:empty\n",
  "SF:src/a.ts\nLF:0\nLH:0\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:1\nLH:1\nFNF:0\nFNH:0",
  "SF:src/a.ts\nLF:1\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:1\nLH:2\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:NaN\nLH:0\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:-1\nLH:0\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:1.5\nLH:0\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:1\nLF:1\nLH:1\nFNF:0\nFNH:0\nend_of_record",
  "SF:src/a.ts\nLF:1\nLH:1\nFNF:0\nFNH:0\nBRF:1\nend_of_record",
])("rejects empty or invalid LCOV: %s", (lcov) => {
  directory = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));
  const path = join(directory, "invalid.lcov");
  writeFileSync(path, lcov);
  expect(() => checkCoverage(path)).toThrow("LCOV");
});

test("accepts measured lines with no functions or branches", () => {
  directory = mkdtempSync(join(tmpdir(), "portfolio-coverage-"));
  const path = join(directory, "valid.lcov");
  writeFileSync(path, "SF:src/a.ts\r\nLF:1\r\nLH:1\r\nFNF:0\r\nFNH:0\r\nend_of_record\r\n");
  expect(() => checkCoverage(path)).not.toThrow();
});
