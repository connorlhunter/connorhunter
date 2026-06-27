import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const defaultCoverageDir = "coverage";
const defaultProjectSlug = "connor-hunter";

export interface CoveragePublishDestination {
  readonly label: string;
  readonly source: string;
  readonly target: string;
}

export interface CoverageInvalidation {
  readonly distributionId: string;
  readonly path: string;
}

export interface PublishCoverageOptions {
  readonly commandRunner?: CommandRunner;
  readonly env?: NodeJS.ProcessEnv;
}

export type CommandRunner = (
  command: string,
  args: ReadonlyArray<string>,
  subject: string,
) => Promise<void>;

interface S3DestinationInput {
  readonly bucket: string;
  readonly label: string;
  readonly prefix: string;
  readonly projectSlug: string;
  readonly source: string;
}

/**
 * @param value - Environment value to normalize.
 * @returns Trimmed environment value.
 */
function envValue(value: string | undefined): string {
  return value?.trim() ?? "";
}

/**
 * @param parts - S3 key or CloudFront path parts.
 * @returns Slash-normalized path without leading or trailing slashes.
 */
function keyPath(...parts: ReadonlyArray<string>): string {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/gu, ""))
    .filter(Boolean)
    .join("/");
}

/**
 * @param bucket - S3 bucket name.
 * @param key - S3 key prefix.
 * @returns S3 URI suitable for `aws s3 sync`.
 */
function s3Uri(bucket: string, key: string): string {
  return key ? `s3://${bucket}/${key}/` : `s3://${bucket}/`;
}

/**
 * @param input - Destination input.
 * @returns Publish destination for one S3 bucket.
 */
function s3Destination(input: S3DestinationInput): CoveragePublishDestination {
  return {
    label: input.label,
    source: input.source,
    target: s3Uri(input.bucket, keyPath(input.prefix, "projects", input.projectSlug, "coverage")),
  };
}

/**
 * @param env - Environment values.
 * @returns Coverage folder to upload.
 */
export function coverageSource(env: NodeJS.ProcessEnv = process.env): string {
  return envValue(env.COVERAGE_DIR) || defaultCoverageDir;
}

/**
 * @param env - Environment values.
 * @returns Portfolio project slug used in the S3 key.
 */
export function coverageProjectSlug(env: NodeJS.ProcessEnv = process.env): string {
  return envValue(env.COVERAGE_PROJECT_SLUG) || defaultProjectSlug;
}

/**
 * @param env - Environment values.
 * @returns S3 destinations that should receive the coverage folder.
 */
export function coveragePublishDestinations(
  env: NodeJS.ProcessEnv = process.env,
): CoveragePublishDestination[] {
  const source = coverageSource(env);
  const projectSlug = coverageProjectSlug(env);
  const sourceArtifactsBucket = envValue(env.SOURCE_ARTIFACTS_BUCKET);
  const publishedArtifactsBucket = envValue(env.ARTIFACTS_BUCKET);
  const destinations: CoveragePublishDestination[] = [];

  if (sourceArtifactsBucket) {
    destinations.push(
      s3Destination({
        bucket: sourceArtifactsBucket,
        label: "Source coverage copy",
        prefix: envValue(env.SOURCE_ARTIFACTS_PREFIX),
        projectSlug,
        source,
      }),
    );
  }

  if (publishedArtifactsBucket) {
    destinations.push(
      s3Destination({
        bucket: publishedArtifactsBucket,
        label: "Live coverage artifact",
        prefix: envValue(env.ARTIFACTS_PREFIX),
        projectSlug,
        source,
      }),
    );
  }

  if (destinations.length === 0) {
    throw new Error(
      "Missing SOURCE_ARTIFACTS_BUCKET or ARTIFACTS_BUCKET. Set SOURCE_ARTIFACTS_BUCKET for a durable source copy, ARTIFACTS_BUCKET for live coverage publishing, or both.",
    );
  }

  return destinations;
}

/**
 * @param env - Environment values.
 * @returns CloudFront invalidation for the published artifact path.
 */
export function coverageInvalidations(
  env: NodeJS.ProcessEnv = process.env,
): CoverageInvalidation[] {
  const distributionId = envValue(env.ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID);

  if (!distributionId) {
    return [];
  }

  return [
    {
      distributionId,
      path: `/${keyPath(
        envValue(env.ARTIFACTS_PREFIX),
        "projects",
        coverageProjectSlug(env),
        "coverage",
        "*",
      )}`,
    },
  ];
}

/**
 * Runs one command and streams child output into any thrown error.
 *
 * @param command - Command to run.
 * @param args - Command arguments.
 * @param subject - Human-readable command label.
 */
export const defaultCommandRunner: CommandRunner = (command, args, subject) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error: Error) => {
      reject(new Error(`${subject} failed: ${error.message}`));
    });
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          [`${subject} failed with exit code ${code ?? "unknown"}.`, stdout.trim(), stderr.trim()]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });

/**
 * Publishes this repo's generated coverage report to configured S3 buckets.
 *
 * @param options - Publish options.
 */
export async function publishCoverage(options: PublishCoverageOptions = {}): Promise<void> {
  const env = options.env ?? process.env;
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  const source = coverageSource(env);
  const report = join(source, "index.html");

  if (!existsSync(report)) {
    throw new Error(`Missing coverage report: ${report}. Run \`bun run test:coverage\` first.`);
  }

  const destinations = coveragePublishDestinations(env);
  console.log(`Publishing coverage from ${source}`);

  for (const destination of destinations) {
    console.log(`- ${destination.label}: ${destination.target}`);
    await commandRunner(
      "aws",
      ["s3", "sync", destination.source, destination.target, "--delete"],
      destination.label,
    );
  }

  for (const invalidation of coverageInvalidations(env)) {
    console.log(`- CloudFront invalidation: ${invalidation.path}`);
    await commandRunner(
      "aws",
      [
        "cloudfront",
        "create-invalidation",
        "--distribution-id",
        invalidation.distributionId,
        "--paths",
        invalidation.path,
      ],
      "Coverage CloudFront invalidation",
    );
  }

  console.log("Published coverage artifacts.");
}

if (import.meta.main) {
  try {
    await publishCoverage();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
