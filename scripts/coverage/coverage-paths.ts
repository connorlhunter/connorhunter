import { resolve } from "node:path";

export interface CoveragePaths {
  readonly directory: string;
  readonly html: string;
  readonly lcov: string;
  readonly pdf: string;
}

/**
 * Resolves the fixed coverage files beneath a workspace's coverage folder.
 *
 * @param workspaceRoot - Workspace containing the coverage folder.
 * @returns Absolute paths for the generated coverage artifacts.
 */
export function coveragePaths(workspaceRoot = process.cwd()): CoveragePaths {
  const directory = resolve(workspaceRoot, "coverage");

  return {
    directory,
    html: resolve(directory, "index.html"),
    lcov: resolve(directory, "lcov.info"),
    pdf: resolve(directory, "index.pdf"),
  };
}
