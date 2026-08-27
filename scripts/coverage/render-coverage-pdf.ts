import { createWriteStream, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname } from "node:path";
import PDFDocument from "pdfkit";
import { coveragePaths } from "./coverage-paths";
import type { CoverageArtifact, CoverageMetric } from "./render-coverage-report";

function metricLabel(metric: CoverageMetric): string {
  const percentage = metric.found === 0 ? 100 : (metric.covered / metric.found) * 100;
  return `${percentage.toFixed(2)}% (${metric.covered}/${metric.found})`;
}

function displayDate(updatedAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(updatedAt));
}

/** Renders coverage directly from JSON without a browser document. */
export async function renderCoveragePdf(workspaceRoot = process.cwd()): Promise<string> {
  const paths = coveragePaths(workspaceRoot);
  if (!existsSync(paths.json)) throw new Error(`Missing coverage artifact: ${paths.json}.`);
  const coverage = JSON.parse(readFileSync(paths.json, "utf8")) as CoverageArtifact;
  mkdirSync(dirname(paths.pdf), { recursive: true });

  await new Promise<void>((resolve, reject) => {
    const document = new PDFDocument({ info: { Title: "Portfolio Coverage" }, margin: 48, size: "LETTER" });
    const stream = createWriteStream(paths.pdf);
    document.pipe(stream);
    stream.on("finish", resolve);
    stream.on("error", reject);
    document.font("Helvetica-Bold").fontSize(22).fillColor("#17202a").text("Portfolio Coverage");
    document.moveDown(0.35).font("Helvetica").fontSize(10).fillColor("#667085").text(`Updated ${displayDate(coverage.updatedAt)}. Required minimum: ${coverage.minimumCoverage}%.`);
    for (const surface of coverage.surfaces) {
      document.moveDown(1).font("Helvetica-Bold").fontSize(14).fillColor("#0f6b7a").text(surface.label);
      document.moveDown(0.25).font("Helvetica").fontSize(10).fillColor("#17202a").text(`All files: lines ${metricLabel(surface.totals.lines)}, functions ${metricLabel(surface.totals.functions)}, branches ${metricLabel(surface.totals.branches)}`);
      for (const file of surface.files) {
        document.moveDown(0.22).fontSize(9).text(`${file.path}: lines ${metricLabel(file.lines)}, functions ${metricLabel(file.functions)}, branches ${metricLabel(file.branches)}`);
      }
    }
    document.end();
  });

  console.log(`Rendered coverage PDF: ${paths.pdf}`);
  return paths.pdf;
}

if (import.meta.main) {
  try {
    await renderCoveragePdf();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
