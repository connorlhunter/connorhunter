import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, spyOn, test } from "bun:test";
import {
  coverageInvalidations,
  coveragePublishDestinations,
  publishCoverage,
  type CommandRunner,
} from "../../scripts/publish/publish-coverage";

describe("publish coverage", () => {
  let tempDir = "";

  afterEach(() => {
    if (tempDir) rmSync(tempDir, { force: true, recursive: true });
    tempDir = "";
  });

  test("builds source and published S3 destinations", () => {
    expect(
      coveragePublishDestinations({
        ARTIFACTS_BUCKET: "published-artifacts",
        ARTIFACTS_PREFIX: "/site/",
        COVERAGE_DIR: "coverage",
        SOURCE_ARTIFACTS_BUCKET: "source-artifacts",
        SOURCE_ARTIFACTS_PREFIX: "raw",
      }),
    ).toEqual([
      {
        label: "Source coverage copy",
        source: "coverage",
        target: "s3://source-artifacts/raw/projects/connor-hunter/coverage/",
      },
      {
        label: "Live coverage artifact",
        source: "coverage",
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
    writeFileSync(join(coverageDir, "index.html"), "<html>coverage</html>");

    await publishCoverage({
      commandRunner,
      env: {
        ARTIFACTS_BUCKET: "published-artifacts",
        ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "DISTRIBUTION",
        COVERAGE_DIR: coverageDir,
        SOURCE_ARTIFACTS_BUCKET: "source-artifacts",
      },
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

  test("requires at least one destination bucket", () => {
    expect(() => coveragePublishDestinations({})).toThrow(
      "Missing SOURCE_ARTIFACTS_BUCKET or ARTIFACTS_BUCKET",
    );
  });

  test("requires a rendered coverage report before publishing", async () => {
    tempDir = mkdtempSync(join(tmpdir(), "coverage-publish-"));

    await expect(
      publishCoverage({
        commandRunner: async () => undefined,
        env: {
          ARTIFACTS_BUCKET: "published-artifacts",
          COVERAGE_DIR: join(tempDir, "coverage"),
        },
      }),
    ).rejects.toThrow("Missing coverage report");
  });
});
