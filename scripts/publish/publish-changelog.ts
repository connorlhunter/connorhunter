import { existsSync } from "node:fs";
import { buildChangelogArtifact, changelogPaths } from "../changelog/changelog-artifact";
import { defaultCommandRunner, type CommandRunner } from "./publish-coverage";

const projectSlug = "connor-hunter";

function envValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

function keyPath(...parts: ReadonlyArray<string>): string {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/gu, ""))
    .filter(Boolean)
    .join("/");
}

function s3Uri(bucket: string, key: string): string {
  return key ? `s3://${bucket}/${key}/` : `s3://${bucket}/`;
}

export interface PublishChangelogOptions {
  readonly commandRunner?: CommandRunner;
  readonly env?: NodeJS.ProcessEnv;
  readonly workspaceRoot?: string;
}

/** Publishes this repository's canonical changelog beside its coverage artifacts. */
export async function publishChangelog(options: PublishChangelogOptions = {}): Promise<void> {
  const env = options.env ?? process.env;
  const workspaceRoot = options.workspaceRoot ?? process.cwd();
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  const paths = changelogPaths(workspaceRoot);
  if (!existsSync(paths.markdown) || !existsSync(paths.pdf)) {
    throw new Error(
      "Missing changelog artifacts. Run changelog publishing from a release command.",
    );
  }
  const buckets = [
    [
      envValue(env.SOURCE_ARTIFACTS_BUCKET),
      envValue(env.SOURCE_ARTIFACTS_PREFIX),
      "Source changelog copy",
    ],
    [envValue(env.ARTIFACTS_BUCKET), envValue(env.ARTIFACTS_PREFIX), "Live changelog artifact"],
  ] as const;
  const destinations = buckets.filter(([bucket]) => Boolean(bucket));
  if (destinations.length === 0) {
    throw new Error(
      "Missing SOURCE_ARTIFACTS_BUCKET or ARTIFACTS_BUCKET for changelog publishing.",
    );
  }
  for (const [bucket, prefix, label] of destinations) {
    await commandRunner(
      "aws",
      [
        "s3",
        "sync",
        paths.directory,
        s3Uri(bucket, keyPath(prefix, "projects", projectSlug, "changelog")),
        "--delete",
      ],
      label,
    );
  }
  const distributionId = envValue(env.ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID);
  if (distributionId) {
    await commandRunner(
      "aws",
      [
        "cloudfront",
        "create-invalidation",
        "--distribution-id",
        distributionId,
        "--paths",
        `/${keyPath(envValue(env.ARTIFACTS_PREFIX), "projects", projectSlug, "changelog", "*")}`,
      ],
      "Changelog CloudFront invalidation",
    );
  }
}

/** Builds and publishes a timestamped changelog artifact pair. */
export async function publishChangelogPublication(
  options: PublishChangelogOptions = {},
): Promise<void> {
  await buildChangelogArtifact(options.workspaceRoot);
  await publishChangelog(options);
}

if (import.meta.main) {
  try {
    await publishChangelogPublication();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
