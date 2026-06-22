import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

interface CoverageMetric {
  covered: number;
  found: number;
}

interface CoverageFile {
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
  path: string;
}

const defaultLcovPath = "coverage/lcov.info";
const defaultCoverageArtifactPath = "coverage/index.html";

/**
 * @returns An empty coverage metric.
 */
function emptyMetric(): CoverageMetric {
  return { covered: 0, found: 0 };
}

/**
 * @param lcov - Raw LCOV report.
 * @returns Per-file coverage records.
 */
export function parseLcov(lcov: string): Array<CoverageFile> {
  const files: Array<CoverageFile> = [];
  let current: CoverageFile | null = null;

  for (const line of lcov.split("\n")) {
    if (line.startsWith("SF:")) {
      current = {
        branches: emptyMetric(),
        functions: emptyMetric(),
        lines: emptyMetric(),
        path: line.slice(3),
      };
      files.push(current);
      continue;
    }

    if (!current) {
      continue;
    }

    applyMetricLine(current, line);
  }

  return files;
}

/**
 * @param file - Current coverage file record.
 * @param line - One LCOV line.
 */
function applyMetricLine(file: CoverageFile, line: string): void {
  if (line.startsWith("LF:")) {
    file.lines.found = Number(line.slice(3));
  } else if (line.startsWith("LH:")) {
    file.lines.covered = Number(line.slice(3));
  } else if (line.startsWith("FNF:")) {
    file.functions.found = Number(line.slice(4));
  } else if (line.startsWith("FNH:")) {
    file.functions.covered = Number(line.slice(4));
  } else if (line.startsWith("BRF:")) {
    file.branches.found = Number(line.slice(4));
  } else if (line.startsWith("BRH:")) {
    file.branches.covered = Number(line.slice(4));
  }
}

/**
 * @param metric - Coverage metric.
 * @returns Coverage percentage.
 */
function percent(metric: CoverageMetric): number {
  return metric.found === 0 ? 100 : (metric.covered / metric.found) * 100;
}

/**
 * @param metric - Coverage metric.
 * @returns Display-ready percentage.
 */
function percentLabel(metric: CoverageMetric): string {
  return `${percent(metric).toFixed(2)}%`;
}

/**
 * @param left - Existing aggregate metric.
 * @param right - Metric to add.
 * @returns Combined metric.
 */
function addMetric(left: CoverageMetric, right: CoverageMetric): CoverageMetric {
  return {
    covered: left.covered + right.covered,
    found: left.found + right.found,
  };
}

/**
 * @param files - Per-file coverage records.
 * @returns Aggregate coverage totals.
 */
function totals(files: ReadonlyArray<CoverageFile>): CoverageFile {
  return files.reduce<CoverageFile>(
    (total, file) => ({
      branches: addMetric(total.branches, file.branches),
      functions: addMetric(total.functions, file.functions),
      lines: addMetric(total.lines, file.lines),
      path: "Total",
    }),
    {
      branches: emptyMetric(),
      functions: emptyMetric(),
      lines: emptyMetric(),
      path: "Total",
    },
  );
}

/**
 * @param value - Text to escape for HTML output.
 * @returns HTML-safe text.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;");
}

/**
 * @param metric - Coverage metric.
 * @returns HTML table cell for the metric.
 */
function metricCell(metric: CoverageMetric): string {
  return `<td>${percentLabel(metric)} <span>${metric.covered}/${metric.found}</span></td>`;
}

/**
 * @param file - Coverage row data.
 * @returns HTML table row.
 */
function fileRow(file: CoverageFile): string {
  return `<tr>
    <th scope="row">${escapeHtml(file.path)}</th>
    ${metricCell(file.lines)}
    ${metricCell(file.functions)}
    ${metricCell(file.branches)}
  </tr>`;
}

/**
 * @param files - Per-file coverage records.
 * @returns Standalone HTML coverage report.
 */
export function renderCoverageHtml(files: ReadonlyArray<CoverageFile>): string {
  const total = totals(files);
  const rows = [total, ...files].map(fileRow).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Portfolio Coverage</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #ffffff;
      --panel: #ffffff;
      --text: #17202a;
      --muted: #667085;
      --border: #d8dee8;
      --accent: #0f6b7a;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font: 0.9375rem/1.5 ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    main {
      width: min(100%, 72rem);
      margin: 0 auto;
      padding: clamp(1.25rem, 4vw, 3rem);
    }

    header {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    h1 {
      margin: 0;
      font-size: clamp(1.75rem, 4vw, 2.75rem);
      line-height: 1.05;
    }

    p {
      margin: 0.5rem 0 0;
      color: var(--muted);
    }

    a {
      color: var(--accent);
      font-weight: 700;
      text-underline-offset: 0.2em;
    }

    .table-wrap {
      overflow: auto;
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      background: var(--panel);
    }

    table {
      width: 100%;
      min-width: 46rem;
      border-collapse: collapse;
    }

    th,
    td {
      border-bottom: 1px solid var(--border);
      padding: 0.85rem 1rem;
      text-align: left;
      vertical-align: top;
    }

    thead th {
      color: var(--muted);
      font-size: 0.75rem;
      letter-spacing: 0;
      text-transform: uppercase;
    }

    tbody tr:first-child {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      font-weight: 800;
    }

    tbody tr:last-child th,
    tbody tr:last-child td {
      border-bottom: 0;
    }

    td span {
      display: block;
      color: var(--muted);
      font-size: 0.8rem;
      font-weight: 600;
    }
  </style>
</head>
<body>
  <main>
    <header>
      <div>
        <h1>Portfolio Coverage</h1>
        <p>Bun test coverage generated from the portfolio test suite.</p>
      </div>
      <a href="lcov.info" download>LCOV</a>
    </header>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">File</th>
            <th scope="col">Lines</th>
            <th scope="col">Functions</th>
            <th scope="col">Branches</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>`;
}

/**
 * @param lcovPath - Source LCOV report path.
 * @param outputPath - Target HTML artifact path.
 * @returns The generated HTML artifact path.
 */
export function renderCoverageReport(
  lcovPath = defaultLcovPath,
  outputPath = process.env.COVERAGE_ARTIFACT_PATH ?? defaultCoverageArtifactPath,
): string {
  const lcov = readFileSync(lcovPath, "utf8");
  const outputDirectory = dirname(outputPath);

  mkdirSync(outputDirectory, { recursive: true });
  writeFileSync(outputPath, renderCoverageHtml(parseLcov(lcov)));
  copyFileSync(lcovPath, join(outputDirectory, "lcov.info"));
  console.log(`Rendered coverage artifact: ${outputPath}`);

  return outputPath;
}

if (import.meta.main) {
  renderCoverageReport();
}
