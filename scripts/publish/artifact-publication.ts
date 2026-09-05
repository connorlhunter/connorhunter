import { defaultCommandRunner, type CommandRunner } from "./command-runner";

export interface PublishDestination {
  readonly label: string;
  readonly source: string;
  readonly target: string;
}
export interface ArtifactInvalidation {
  readonly distributionId: string;
  readonly path: string;
}
export interface PublishOptions {
  readonly commandRunner?: CommandRunner;
  readonly env?: NodeJS.ProcessEnv;
  readonly workspaceRoot?: string;
}
export type ReportKind = "coverage" | "changelog";

/** Joins configured prefixes without widening a project's publication scope. */
function keyPath(...parts: string[]): string {
  return parts
    .map((part) => part.trim().replace(/^\/+|\/+$/gu, ""))
    .filter(Boolean)
    .join("/");
}

/** Resolves the source and live copies for one report family. */
export function reportDestinations(
  kind: ReportKind,
  source: string,
  slug: string,
  env: NodeJS.ProcessEnv,
): PublishDestination[] {
  const copies = [
    [env.SOURCE_ARTIFACTS_BUCKET, env.SOURCE_ARTIFACTS_PREFIX, `Source ${kind} copy`],
    [env.ARTIFACTS_BUCKET, env.ARTIFACTS_PREFIX, `Live ${kind} artifact`],
  ] as const;
  const destinations = copies
    .filter(([bucket]) => bucket?.trim())
    .map(([bucket, prefix, label]) => ({
      label,
      source,
      target: `s3://${bucket!.trim()}/${keyPath(prefix ?? "", "projects", slug, kind)}/`,
    }));
  if (!destinations.length) throw new Error("Missing SOURCE_ARTIFACTS_BUCKET or ARTIFACTS_BUCKET.");
  return destinations;
}

export function reportInvalidations(
  kind: ReportKind,
  slug: string,
  env: NodeJS.ProcessEnv,
): ArtifactInvalidation[] {
  const distributionId = env.ARTIFACTS_CLOUDFRONT_DISTRIBUTION_ID?.trim();
  return distributionId
    ? [
        {
          distributionId,
          path: `/${keyPath(env.ARTIFACTS_PREFIX ?? "", "projects", slug, kind, "*")}`,
        },
      ]
    : [];
}

/** Uploads every configured copy before invalidating the public report path. */
export async function publishReport(
  kind: ReportKind,
  destinations: ReadonlyArray<PublishDestination>,
  invalidations: ReadonlyArray<ArtifactInvalidation>,
  commandRunner = defaultCommandRunner,
): Promise<void> {
  for (const destination of destinations) {
    console.log(`${destination.label}: ${destination.target}`);
    await commandRunner(
      "aws",
      ["s3", "sync", destination.source, destination.target, "--delete"],
      destination.label,
    );
  }
  for (const invalidation of invalidations) {
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
      `${kind === "coverage" ? "Coverage" : "Changelog"} CloudFront invalidation`,
    );
  }
}
