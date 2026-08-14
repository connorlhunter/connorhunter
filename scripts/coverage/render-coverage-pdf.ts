import { existsSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import puppeteer from "puppeteer";
import { coveragePaths } from "./coverage-paths";
import { pdfBrowserLaunchOptions } from "./pdf-browser";

/**
 * Renders the standalone coverage report as a downloadable PDF.
 *
 * @param workspaceRoot - Workspace containing the fixed coverage folder.
 * @returns The generated PDF path.
 */
export async function renderCoveragePdf(workspaceRoot = process.cwd()): Promise<string> {
  const paths = coveragePaths(workspaceRoot);

  if (!existsSync(paths.html)) {
    throw new Error(`Missing coverage report: ${paths.html}. Run \`bun run test:coverage\` first.`);
  }

  mkdirSync(paths.directory, { recursive: true });
  const browser = await puppeteer.launch(pdfBrowserLaunchOptions(process.env.CI === "true"));

  try {
    const page = await browser.newPage();

    await page.emulateMediaType("print");
    await page.goto(pathToFileURL(paths.html).href, { waitUntil: "networkidle0" });
    await page.pdf({
      format: "Letter",
      landscape: true,
      margin: {
        bottom: "0.45in",
        left: "0.45in",
        right: "0.45in",
        top: "0.45in",
      },
      path: paths.pdf,
      printBackground: true,
    });
  } finally {
    await browser.close();
  }

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
