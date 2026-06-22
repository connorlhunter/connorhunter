import { readFileSync, writeFileSync } from "node:fs";

type PinRecord = Record<string, { version: string; reason: string }>;
type ReleaseAgeRecord = Record<string, { reason: string }>;

const packageJsonPath = "package.json";
const bunfigPath = "bunfig.toml";
const pinsPath = "dependency-pins.json";
const releaseAgeExcludesPath = "dependency-release-age-excludes.json";

/**
 * @param path - JSON file path to read.
 * @returns Parsed JSON typed by the caller.
 */
function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

/**
 * @param record - Record to sort by key.
 * @returns A new record with stable key order.
 */
function sortedRecord<T>(record: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(record).sort(([a], [b]) => a.localeCompare(b)));
}

/**
 * @param packageJson - Current package JSON object.
 * @param pins - Dependency override pins.
 * @returns Package JSON text with synced overrides.
 */
function packageJsonWithPins(packageJson: Record<string, unknown>, pins: PinRecord): string {
  const nextPackageJson = { ...packageJson };
  const entries = Object.entries(sortedRecord(pins));

  if (entries.length === 0) {
    delete nextPackageJson.overrides;
  } else {
    nextPackageJson.overrides = Object.fromEntries(
      entries.map(([name, value]) => [name, value.version]),
    );
  }

  return `${JSON.stringify(nextPackageJson, null, 2)}\n`;
}

/**
 * @param current - Current bunfig text.
 * @param excludes - Dependency release-age exclusions.
 * @returns Bunfig text with synced release-age exclusions.
 */
function bunfigWithReleaseAgeExcludes(current: string, excludes: ReleaseAgeRecord): string {
  const names = Object.keys(sortedRecord(excludes));
  const withoutExisting = current
    .replace(/\nminimumReleaseAgeExcludes = \[[\s\S]*?\]\n?/m, "\n")
    .trimEnd();

  if (names.length === 0) {
    return `${withoutExisting}\n`;
  }

  const renderedNames = names.map((name) => `  "${name}",`).join("\n");
  return `${withoutExisting}\nminimumReleaseAgeExcludes = [\n${renderedNames}\n]\n`;
}

/**
 * @param options - Optional check mode flag.
 * @returns Nothing; updates policy files or throws when check mode detects drift.
 */
export function syncDependencyPolicy({ check = false }: { check?: boolean } = {}): void {
  const packageJson = readJson<Record<string, unknown>>(packageJsonPath);
  const pins = readJson<PinRecord>(pinsPath);
  const excludes = readJson<ReleaseAgeRecord>(releaseAgeExcludesPath);
  const nextPackageJson = packageJsonWithPins(packageJson, pins);
  const currentPackageJson = readFileSync(packageJsonPath, "utf8");
  const currentBunfig = readFileSync(bunfigPath, "utf8");
  const nextBunfig = bunfigWithReleaseAgeExcludes(currentBunfig, excludes);

  if (check) {
    const packageChanged = currentPackageJson !== nextPackageJson;
    const bunfigChanged = currentBunfig !== nextBunfig;
    if (packageChanged || bunfigChanged) {
      throw new Error("Dependency policy files are out of sync. Run bun run deps:policy.");
    }
    return;
  }

  writeFileSync(packageJsonPath, nextPackageJson);
  writeFileSync(bunfigPath, nextBunfig);
}

syncDependencyPolicy({ check: process.argv.includes("--check") });
