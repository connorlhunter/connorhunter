import { existsSync } from "node:fs";
import { buildChangelogArtifact, changelogPaths } from "../changelog/changelog-artifact";
import { defaultCommandRunner } from "./command-runner";
import {
  reportDestinations,
  reportInvalidations,
  publishReport,
  type PublishOptions,
} from "./artifact-publication";
export type PublishChangelogOptions = PublishOptions;

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
  await publishReport(
    "changelog",
    reportDestinations("changelog", paths.directory, "connor-hunter", env),
    reportInvalidations("changelog", "connor-hunter", env),
    commandRunner,
  );
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
