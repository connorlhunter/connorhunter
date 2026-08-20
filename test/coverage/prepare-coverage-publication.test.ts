import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
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
    expect(readFileSync(result.html, "utf8")).toContain(
      'Updated <time datetime="2026-08-20T18:42:31.123Z">Aug 20, 2026 at 6:42 PM UTC</time>',
    );
    expect(readFileSync(result.pdf).subarray(0, 4).toString()).toBe("%PDF");
  });
});
