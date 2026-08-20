import { renderCoveragePdf } from "./render-coverage-pdf";
import { coverageUpdatedAt, renderCoverageReport } from "./render-coverage-report";

export interface PreparedCoveragePublication {
  readonly html: string;
  readonly pdf: string;
  readonly updatedAt: string;
}

/**
 * Stamps and renders the coverage artifacts immediately before publication.
 *
 * @param workspaceRoot - Workspace containing the generated LCOV report.
 * @param updatedAt - ISO UTC publication time shared by the HTML and PDF.
 * @returns Paths and publication time for the prepared artifacts.
 */
export async function prepareCoveragePublication(
  workspaceRoot = process.cwd(),
  updatedAt = new Date().toISOString(),
): Promise<PreparedCoveragePublication> {
  const publicationDate = coverageUpdatedAt(updatedAt);
  const html = renderCoverageReport(workspaceRoot, publicationDate);
  const pdf = await renderCoveragePdf(workspaceRoot);

  console.log(`Prepared coverage publication: ${publicationDate}`);

  return { html, pdf, updatedAt: publicationDate };
}

if (import.meta.main) {
  try {
    await prepareCoveragePublication();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
