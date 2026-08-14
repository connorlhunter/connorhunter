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
    const input = join(coverageDir, "index.html");
    const output = join(coverageDir, "index.pdf");
    mkdirSync(coverageDir, { recursive: true });
    writeFileSync(input, "<!doctype html><title>Coverage</title><main><h1>Coverage</h1></main>");

    expect(await renderCoveragePdf(tempDir)).toBe(output);
    expect(existsSync(output)).toBe(true);
    expect(readFileSync(output).subarray(0, 4).toString()).toBe("%PDF");
  });

  test("requires an HTML coverage report", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "portfolio-coverage-pdf-"));

    await expect(renderCoveragePdf(tempDir)).rejects.toThrow("Missing coverage report");
  });
});
