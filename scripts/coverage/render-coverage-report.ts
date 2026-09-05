import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { coveragePaths } from "./coverage-paths";
import { coverageTotals, parseLcov, minimumCoveragePercent, type CoverageFile } from "./lcov";
export { parseLcov } from "./lcov";
export type { CoverageMetric, CoverageFile } from "./lcov";

export interface CoverageArtifact {
  readonly minimumCoverage: number;
  readonly schemaVersion: 2;
  readonly surfaces: ReadonlyArray<{
    readonly files: ReadonlyArray<CoverageFile>;
    readonly id: string;
    readonly label: string;
    readonly totals: CoverageFile;
  }>;
  readonly updatedAt: string;
}

/** Normalizes an accepted publication time to UTC. */
export function coverageUpdatedAt(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime()))
    throw new Error(`Invalid coverage publication date: ${value}`);
  return timestamp.toISOString();
}

/** Builds the reader payload from one LCOV file. */
export function coverageArtifact(
  files: ReadonlyArray<CoverageFile>,
  updatedAt: string,
): CoverageArtifact {
  return {
    minimumCoverage: minimumCoveragePercent,
    schemaVersion: 2,
    surfaces: [
      {
        files: [...files].sort((left, right) => left.path.localeCompare(right.path)),
        id: "typescript",
        label: "TypeScript",
        totals: coverageTotals(files),
      },
    ],
    updatedAt: coverageUpdatedAt(updatedAt),
  };
}

/** Writes the public coverage JSON. */
export function renderCoverageReport(
  workspaceRoot = process.cwd(),
  updatedAt = new Date().toISOString(),
): string {
  const paths = coveragePaths(workspaceRoot);
  const artifact = coverageArtifact(parseLcov(readFileSync(paths.lcov, "utf8")), updatedAt);
  mkdirSync(paths.directory, { recursive: true });
  writeFileSync(paths.json, `${JSON.stringify(artifact, null, 2)}\n`);
  console.log(`Rendered coverage artifact: ${paths.json}`);

  return paths.json;
}

if (import.meta.main) renderCoverageReport();
