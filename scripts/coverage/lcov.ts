export interface CoverageMetric {
  readonly covered: number;
  readonly found: number;
}

export interface CoverageFile {
  readonly branches: CoverageMetric;
  readonly functions: CoverageMetric;
  readonly lines: CoverageMetric;
  readonly path: string;
}

export const minimumCoveragePercent = 95;

function emptyMetric(): CoverageMetric { return { covered: 0, found: 0 }; }

function metric(values: ReadonlyMap<string, number>, foundKey: string, hitKey: string, optional = false): CoverageMetric {
  if (optional && !values.has(foundKey) && !values.has(hitKey)) return emptyMetric();
  const found = values.get(foundKey);
  const covered = values.get(hitKey);
  if (found === undefined || covered === undefined || covered > found) {
    throw new Error(`Invalid LCOV metric: ${foundKey}/${hitKey}.`);
  }
  return { covered, found };
}

/** Reads complete file records; absent branch summaries mean the file has no branches. */
export function parseLcov(lcov: string): CoverageFile[] {
  const files: CoverageFile[] = [];
  let path: string | undefined;
  const values = new Map<string, number>();
  for (const line of lcov.split(/\r?\n/u)) {
    if (line.startsWith("SF:")) {
      if (path !== undefined) throw new Error("Incomplete LCOV record.");
      path = line.slice(3).trim();
      if (!path) throw new Error("Missing LCOV file path.");
      values.clear();
    } else if (line === "end_of_record") {
      if (!path) throw new Error("Missing LCOV file path.");
      files.push({
        path,
        lines: metric(values, "LF", "LH"),
        functions: metric(values, "FNF", "FNH"),
        branches: metric(values, "BRF", "BRH", true),
      });
      path = undefined;
    } else if (/^(LF|LH|FNF|FNH|BRF|BRH):/u.test(line)) {
      const [key, raw] = line.split(":");
      const count = Number(raw);
      if (!path || !raw || !/^\d+$/u.test(raw) || !Number.isSafeInteger(count) || values.has(key!)) {
        throw new Error(`Invalid LCOV count: ${line}.`);
      }
      values.set(key!, count);
    }
  }
  if (path !== undefined) throw new Error("Incomplete LCOV record.");
  if (files.length === 0 || coverageTotals(files).lines.found === 0) {
    throw new Error("LCOV report contains no measured lines.");
  }
  return files;
}

function add(left: CoverageMetric, right: CoverageMetric): CoverageMetric {
  return { covered: left.covered + right.covered, found: left.found + right.found };
}

/** Aggregates records for the summary tiles. */
export function coverageTotals(files: ReadonlyArray<CoverageFile>): CoverageFile {
  return files.reduce<CoverageFile>(
    (total, file) => ({
      branches: add(total.branches, file.branches),
      functions: add(total.functions, file.functions),
      lines: add(total.lines, file.lines),
      path: "All files",
    }),
    { branches: emptyMetric(), functions: emptyMetric(), lines: emptyMetric(), path: "All files" },
  );
}

