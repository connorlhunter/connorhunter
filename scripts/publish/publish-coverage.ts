import { existsSync } from "node:fs";
import { coveragePaths } from "../coverage/coverage-paths";
import { prepareCoveragePublication } from "../coverage/prepare-coverage-publication";
import { defaultCommandRunner } from "./command-runner";
import {
  reportDestinations,
  reportInvalidations,
  publishReport,
  type PublishOptions,
} from "./artifact-publication";
export { defaultCommandRunner, type CommandRunner } from "./command-runner";
export type {
  PublishDestination as CoveragePublishDestination,
  ArtifactInvalidation as CoverageInvalidation,
} from "./artifact-publication";
export type PublishCoverageOptions = PublishOptions;
export interface PublishCoveragePublicationOptions extends PublishOptions {
  readonly updatedAt?: string;
}

export function coverageSource(workspaceRoot = process.cwd()): string {
  return coveragePaths(workspaceRoot).directory;
}
export function coverageProjectSlug(env: NodeJS.ProcessEnv = process.env): string {
  return env.COVERAGE_PROJECT_SLUG?.trim() || "connor-hunter";
}
export function coveragePublishDestinations(
  env: NodeJS.ProcessEnv = process.env,
  workspaceRoot = process.cwd(),
) {
  return reportDestinations(
    "coverage",
    coverageSource(workspaceRoot),
    coverageProjectSlug(env),
    env,
  );
}
export function coverageInvalidations(env: NodeJS.ProcessEnv = process.env) {
  return reportInvalidations("coverage", coverageProjectSlug(env), env);
}

/**
 * Publishes this repo's generated coverage report to configured S3 buckets.
 *
 * @param options - Publish options.
 */
export async function publishCoverage(options: PublishCoverageOptions = {}): Promise<void> {
  const env = options.env ?? process.env;
  const commandRunner = options.commandRunner ?? defaultCommandRunner;
  const paths = coveragePaths(options.workspaceRoot);
  const source = paths.directory;

  if (!existsSync(paths.json) || !existsSync(paths.pdf)) {
    throw new Error(
      `Missing coverage artifacts: ${paths.json} or ${paths.pdf}. Run \`bun run coverage:publish\` first.`,
    );
  }

  const destinations = coveragePublishDestinations(env, options.workspaceRoot);
  console.log(`Publishing coverage from ${source}`);

  await publishReport("coverage", destinations, coverageInvalidations(env), commandRunner);

  console.log("Published coverage artifacts.");
}

/**
 * Gives the JSON and PDF one project-owned publication date before uploading them.
 *
 * @param options - Publication and destination options.
 */
export async function publishCoveragePublication(
  options: PublishCoveragePublicationOptions = {},
): Promise<void> {
  await prepareCoveragePublication(options.workspaceRoot, options.updatedAt);
  await publishCoverage(options);
}

if (import.meta.main) {
  try {
    await publishCoveragePublication();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
