import { readFileSync } from "node:fs";

interface LcovSummary {
  found: number;
  hit: number;
}

/**
 * @param lcov - Raw lcov report text.
 * @param foundKey - Lcov key for total items.
 * @param hitKey - Lcov key for covered items.
 * @returns Aggregated coverage counts for the metric.
 */
function parseMetric(lcov: string, foundKey: string, hitKey: string): LcovSummary {
  const summary = { found: 0, hit: 0 };

  for (const line of lcov.split("\n")) {
    if (line.startsWith(foundKey)) {
      summary.found += Number(line.slice(foundKey.length));
    }
    if (line.startsWith(hitKey)) {
      summary.hit += Number(line.slice(hitKey.length));
    }
  }

  return summary;
}

/**
 * @param summary - Coverage counts for one metric.
 * @returns Coverage percentage for the metric.
 */
function percent({ found, hit }: LcovSummary): number {
  return found === 0 ? 100 : (hit / found) * 100;
}

/**
 * @param lcovPath - Path to the lcov report.
 * @returns Nothing; throws when any coverage metric is below 100 percent.
 */
export function checkCoverage(lcovPath = "coverage/lcov.info"): void {
  const lcov = readFileSync(lcovPath, "utf8");
  const lines = parseMetric(lcov, "LF:", "LH:");
  const functions = parseMetric(lcov, "FNF:", "FNH:");
  const branches = parseMetric(lcov, "BRF:", "BRH:");
  const linePercent = percent(lines);
  const functionPercent = percent(functions);
  const branchPercent = percent(branches);
  const passed = linePercent === 100 && functionPercent === 100 && branchPercent === 100;

  if (!passed) {
    throw new Error(
      `Coverage must be 100%. Lines: ${linePercent.toFixed(2)}%, functions: ${functionPercent.toFixed(
        2,
      )}%, branches: ${branchPercent.toFixed(2)}%.`,
    );
  }

  console.log("Coverage passed at 100% lines, functions, and branches.");
}

checkCoverage();
