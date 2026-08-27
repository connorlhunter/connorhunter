import { resolve } from "node:path";

/** Fixed JSON and PDF coverage artifacts beneath a workspace. */
export interface CoveragePaths {
  readonly directory: string;
  readonly json: string;
  readonly lcov: string;
  readonly pdf: string;
}

/** Resolves this project's coverage inputs and published artifacts. */
export function coveragePaths(workspaceRoot = process.cwd()): CoveragePaths {
  const directory = resolve(workspaceRoot, "coverage");

  return {
    directory,
    json: resolve(directory, "index.json"),
    lcov: resolve(directory, "lcov.info"),
    pdf: resolve(directory, "coverage.pdf"),
  };
}
