import { existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";

const defaultCoverageReportPath = "coverage/index.html";
const defaultCoveragePdfPath = "coverage/index.pdf";

/**
 * Renders the standalone coverage report as a downloadable PDF.
 *
 * @param input - HTML coverage report to render.
 * @param output - PDF file to write beside the report.
 * @returns The generated PDF path.
 */
export async function renderCoveragePdf(
  input = process.env.COVERAGE_ARTIFACT_PATH ?? defaultCoverageReportPath,
  output = process.env.COVERAGE_PDF_PATH ?? defaultCoveragePdfPath,
): Promise<string> {
  if (!existsSync(input)) {
    throw new Error(`Missing coverage report: ${input}. Run \`bun run test:coverage\` first.`);
  }

  mkdirSync(dirname(output), { recursive: true });
  const browser = await puppeteer.launch({ headless: true });

  try {
    const page = await browser.newPage();

    await page.emulateMediaType("print");
    await page.goto(pathToFileURL(input).href, { waitUntil: "networkidle0" });
    await page.pdf({
      format: "Letter",
      landscape: true,
      margin: {
        bottom: "0.45in",
        left: "0.45in",
        right: "0.45in",
        top: "0.45in",
      },
      path: output,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

  console.log(`Rendered coverage PDF: ${output}`);

  return output;
}

if (import.meta.main) {
  try {
    await renderCoveragePdf();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}
