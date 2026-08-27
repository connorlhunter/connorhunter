import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import {
  coverageInvalidations,
  coveragePublishDestinations,
  publishCoverage,
  publishCoveragePublication,
  type CommandRunner,
} from "../../scripts/publish/publish-coverage";

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

describe("publish coverage", () => {
  let tempDir = "";

  afterEach(() => {
    mock.restore();
    if (tempDir) rmSync(tempDir, { force: true, recursive: true });
    tempDir = "";
  });

  test("builds source and published S3 destinations", () => {
    tempDir = mkdtempSync(join(tmpdir(), "coverage-publish-"));

    expect(
      coveragePublishDestinations(
        {
          ARTIFACTS_BUCKET: "published-artifacts",
          ARTIFACTS_PREFIX: "/site/",
          COVERAGE_DIR: join(tempDir, "outside"),
          SOURCE_ARTIFACTS_BUCKET: "source-artifacts",
          SOURCE_ARTIFACTS_PREFIX: "raw",
        },
        tempDir,
      ),
    ).toEqual([
      {
        label: "Source coverage copy",
        source: join(tempDir, "coverage"),
        target: "s3://source-artifacts/raw/projects/connor-hunter/coverage/",
      },
      {
        label: "Live coverage artifact",
        source: join(tempDir, "coverage"),
        target: "s3://published-artifacts/site/projects/connor-hunter/coverage/",
      },
    ]);
  });

  test("builds CloudFront invalidation for the published coverage path", () => {
    expect(
      coverageInvalidations({
        ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "DISTRIBUTION",
        ARTIFACTS_PREFIX: "site",
        COVERAGE_PROJECT_SLUG: "example",
      }),
    ).toEqual([
      {
        distributionId: "DISTRIBUTION",
        path: "/site/projects/example/coverage/*",
      },
    ]);
  });

  test("runs S3 sync and CloudFront invalidation commands", async () => {
    const commands: Array<{
      args: ReadonlyArray<string>;
      command: string;
      subject: string;
    }> = [];
    const commandRunner: CommandRunner = async (command, args, subject) => {
      commands.push({ args, command, subject });
    };
    spyOn(console, "log").mockImplementation(() => undefined);
    tempDir = mkdtempSync(join(tmpdir(), "coverage-publish-"));
    const coverageDir = join(tempDir, "coverage");
    mkdirSync(coverageDir, { recursive: true });
    writeFileSync(join(coverageDir, "index.json"), "{}");
    writeFileSync(join(coverageDir, "coverage.pdf"), "%PDF-1.4");

    await publishCoverage({
      commandRunner,
      env: {
        ARTIFACTS_BUCKET: "published-artifacts",
        ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "DISTRIBUTION",
        SOURCE_ARTIFACTS_BUCKET: "source-artifacts",
      },
      workspaceRoot: tempDir,
    });

    expect(commands).toEqual([
      {
        args: [
          "s3",
          "sync",
          coverageDir,
          "s3://source-artifacts/projects/connor-hunter/coverage/",
          "--delete",
        ],
        command: "aws",
        subject: "Source coverage copy",
      },
      {
        args: [
          "s3",
          "sync",
          coverageDir,
          "s3://published-artifacts/projects/connor-hunter/coverage/",
          "--delete",
        ],
        command: "aws",
        subject: "Live coverage artifact",
      },
      {
        args: [
          "cloudfront",
          "create-invalidation",
          "--distribution-id",
          "DISTRIBUTION",
          "--paths",
          "/projects/connor-hunter/coverage/*",
        ],
        command: "aws",
        subject: "Coverage CloudFront invalidation",
      },
    ]);
  });

  test("stamps JSON and derives the PDF before publishing", async () => {
    const commands: Array<ReadonlyArray<string>> = [];
    spyOn(console, "log").mockImplementation(() => undefined);
    tempDir = mkdtempSync(join(tmpdir(), "coverage-publish-"));
    const coverageDir = join(tempDir, "coverage");
    mkdirSync(coverageDir, { recursive: true });
    writeFileSync(join(coverageDir, "lcov.info"), sampleLcov);

    await publishCoveragePublication({
      commandRunner: async (_command, args) => {
        commands.push(args);
      },
      env: { ARTIFACTS_BUCKET: "published-artifacts" },
      updatedAt: "2026-08-20T14:42:31.123-04:00",
      workspaceRoot: tempDir,
    });

    expect(readFileSync(join(coverageDir, "index.json"), "utf8")).toContain(
      '"updatedAt": "2026-08-20T18:42:31.123Z"',
    );
    expect(readFileSync(join(coverageDir, "coverage.pdf")).subarray(0, 4).toString()).toBe("%PDF");
    expect(commands).toEqual([
      [
        "s3",
        "sync",
        coverageDir,
        "s3://published-artifacts/projects/connor-hunter/coverage/",
        "--delete",
      ],
    ]);
  });

  test("requires at least one destination bucket", () => {
    expect(() => coveragePublishDestinations({})).toThrow(
      "Missing SOURCE_ARTIFACTS_BUCKET or ARTIFACTS_BUCKET",
    );
  });

  test("requires rendered coverage JSON and PDF files before publishing", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "coverage-publish-"));

    await expect(
      publishCoverage({
        commandRunner: async () => undefined,
        env: {
          ARTIFACTS_BUCKET: "published-artifacts",
        },
        workspaceRoot: tempDir,
      }),
    ).rejects.toThrow("Missing coverage artifacts");
  });
});
