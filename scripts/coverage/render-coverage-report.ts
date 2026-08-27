import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { coveragePaths } from "./coverage-paths";

export interface CoverageMetric {
  readonly covered: number;
  readonly found: number;
}

export interface CoverageFile {
  readonly branches: CoverageMetric;
  readonly functions: CoverageMetric;
  readonly lines: CoverageMetric;
  readonly path: string;
}

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

function emptyMetric(): CoverageMetric {
  return { covered: 0, found: 0 };
}

/** Parses LCOV into typed per-file metrics. */
export function parseLcov(lcov: string): CoverageFile[] {
  const files: CoverageFile[] = [];
  let current: CoverageFile | undefined;

  for (const line of lcov.split(/\r?\n/u)) {
    if (line.startsWith("SF:")) {
      current = {
        branches: emptyMetric(),
        functions: emptyMetric(),
        lines: emptyMetric(),
        path: line.slice(3),
      };
      continue;
    }
    if (!current) continue;
    if (line.startsWith("LF:")) current = { ...current, lines: { ...current.lines, found: value(line) } };
    if (line.startsWith("LH:")) current = { ...current, lines: { ...current.lines, covered: value(line) } };
    if (line.startsWith("FNF:")) current = { ...current, functions: { ...current.functions, found: value(line) } };
    if (line.startsWith("FNH:")) current = { ...current, functions: { ...current.functions, covered: value(line) } };
    if (line.startsWith("BRF:")) current = { ...current, branches: { ...current.branches, found: value(line) } };
    if (line.startsWith("BRH:")) current = { ...current, branches: { ...current.branches, covered: value(line) } };
    if (line === "end_of_record") {
      files.push(current);
      current = undefined;
    }
  }

  return files;
}

function value(line: string): number {
  return Number(line.split(":")[1] ?? 0);
}

function add(left: CoverageMetric, right: CoverageMetric): CoverageMetric {
  return { covered: left.covered + right.covered, found: left.found + right.found };
}

/** Aggregates records for the summary tiles. */
export function coverageTotals(files: ReadonlyArray<CoverageFile>): CoverageFile {
  return files.reduce<CoverageFile>(
    (total, file) => ({
      branches: add(total.branches, file.branches),
      functions: add(total.functions, file.functions),
      lines: add(total.lines, file.lines),
      path: "All files",
    }),
    { branches: emptyMetric(), functions: emptyMetric(), lines: emptyMetric(), path: "All files" },
  );
}

/** Normalizes an accepted publication time to UTC. */
export function coverageUpdatedAt(value: string): string {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) throw new Error(`Invalid coverage publication date: ${value}`);
  return timestamp.toISOString();
}

/** Builds the reader payload from one LCOV file. */
export function coverageArtifact(files: ReadonlyArray<CoverageFile>, updatedAt: string): CoverageArtifact {
  return {
    minimumCoverage: 95,
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
