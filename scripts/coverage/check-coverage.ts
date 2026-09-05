import { readFileSync } from "node:fs";

import { coverageTotals, parseLcov, minimumCoveragePercent, type CoverageMetric } from "./lcov";

function percent({ found, covered }: CoverageMetric): number {
  return found === 0 ? 100 : (covered / found) * 100;
}

/**
 * @param lcovPath - Path to the lcov report.
 * @returns Nothing; throws when any coverage metric is below 95 percent.
 */
export function checkCoverage(lcovPath = "coverage/lcov.info"): void {
  const lcov = readFileSync(lcovPath, "utf8");
  const { lines, functions, branches } = coverageTotals(parseLcov(lcov));
  const linePercent = percent(lines);
  const functionPercent = percent(functions);
  const branchPercent = percent(branches);
  const passed =
    linePercent >= minimumCoveragePercent &&
    functionPercent >= minimumCoveragePercent &&
    branchPercent >= minimumCoveragePercent;

  if (!passed) {
    throw new Error(
      `Coverage must be at least ${minimumCoveragePercent}%. Lines: ${linePercent.toFixed(2)}%, functions: ${functionPercent.toFixed(2)}%, branches: ${branchPercent.toFixed(2)}%.`,
    );
  }

  console.log(`Coverage passed at ${minimumCoveragePercent}% lines, functions, and branches.`);
}

if (import.meta.main) checkCoverage();
