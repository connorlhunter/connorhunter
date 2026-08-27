import { coveragePaths } from "./coverage-paths";
import { renderCoveragePdf } from "./render-coverage-pdf";
import { coverageUpdatedAt, renderCoverageReport } from "./render-coverage-report";

export interface PreparedCoveragePublication {
  readonly json: string;
  readonly pdf: string;
  readonly updatedAt: string;
}

/** Stamps, renders, and validates the JSON/PDF pair immediately before upload. */
export async function prepareCoveragePublication(
  workspaceRoot = process.cwd(),
  updatedAt = new Date().toISOString(),
): Promise<PreparedCoveragePublication> {
  const publicationDate = coverageUpdatedAt(updatedAt);
  const json = renderCoverageReport(workspaceRoot, publicationDate);
  const pdf = await renderCoveragePdf(workspaceRoot);

  return { json, pdf, updatedAt: publicationDate };
}

if (import.meta.main) {
  try {
    await prepareCoveragePublication();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
