import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, test } from "bun:test";
import { publishChangelog } from "../../scripts/publish/publish-changelog";
import { defaultCommandRunner } from "../../scripts/publish/command-runner";

let directory = "";
afterEach(() => {
  if (directory) rmSync(directory, { force: true, recursive: true });
  directory = "";
});
function fixture() {
  directory = mkdtempSync(join(tmpdir(), "changelog-publish-"));
  const source = join(directory, "changelog");
  mkdirSync(source);
  writeFileSync(join(source, "CHANGELOG.md"), "# Changelog");
  writeFileSync(join(source, "changelog.pdf"), "%PDF-1.4");
  return source;
}

test("scopes both copies and invalidation to the changelog, independent of coverage overrides", async () => {
  const source = fixture();
  const commands: ReadonlyArray<string>[] = [];
  await publishChangelog({
    workspaceRoot: directory,
    env: {
      SOURCE_ARTIFACTS_BUCKET: " source ",
      SOURCE_ARTIFACTS_PREFIX: "/raw/",
      ARTIFACTS_BUCKET: " live ",
      ARTIFACTS_PREFIX: " /site/ ",
      ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: " CDN ",
      COVERAGE_PROJECT_SLUG: "other",
    },
    commandRunner: async (_command, args) => {
      commands.push(args);
    },
  });
  expect(commands).toEqual([
    ["s3", "sync", source, "s3://source/raw/projects/connor-hunter/changelog/", "--delete"],
    ["s3", "sync", source, "s3://live/site/projects/connor-hunter/changelog/", "--delete"],
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      "CDN",
      "--paths",
      "/site/projects/connor-hunter/changelog/*",
    ],
  ]);
});

test("stops publication when an upload fails", async () => {
  fixture();
  let calls = 0;
  await expect(
    publishChangelog({
      workspaceRoot: directory,
      env: {
        SOURCE_ARTIFACTS_BUCKET: "source",
        ARTIFACTS_BUCKET: "live",
        ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID: "CDN",
      },
      commandRunner: async () => {
        calls += 1;
        throw new Error("Upload failed");
      },
    }),
  ).rejects.toThrow("Upload failed");
  expect(calls).toBe(1);
});

test("requires artifacts and a destination before running commands", async () => {
  const source = fixture();
  await expect(publishChangelog({ workspaceRoot: directory, env: {} })).rejects.toThrow(
    "Missing SOURCE_ARTIFACTS_BUCKET",
  );
  rmSync(join(source, "changelog.pdf"));
  await expect(
    publishChangelog({ workspaceRoot: directory, env: { ARTIFACTS_BUCKET: "live" } }),
  ).rejects.toThrow("Missing changelog artifacts");
});

test("command runner reports failures and passes arguments literally", async () => {
  await defaultCommandRunner(
    process.execPath,
    ["-e", 'if (process.argv[1] !== "$(exit 1)") process.exit(2)', "$(exit 1)"],
    "Literal arguments",
  );
  await expect(
    defaultCommandRunner(
      process.execPath,
      ["-e", 'console.error("upload rejected"); process.exit(7)'],
      "Upload",
    ),
  ).rejects.toThrow("upload rejected");
  await expect(
    defaultCommandRunner("/nonexistent/portfolio-command", [], "Upload"),
  ).rejects.toThrow("Upload failed");
});
