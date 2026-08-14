import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

interface PackageMetadata {
  toolchain?: {
    codeql?: unknown;
  };
}

interface SarifLocation {
  physicalLocation?: {
    artifactLocation?: {
      uri?: unknown;
    };
    region?: {
      startLine?: unknown;
    };
  };
}

interface SarifResult {
  locations?: SarifLocation[];
  message?: {
    text?: unknown;
  };
  ruleId?: unknown;
}

interface SarifLog {
  runs?: Array<{
    results?: SarifResult[];
  }>;
}

/** A CodeQL command that is safe to run from the repository root. */
export interface CodeQlCommand {
  args: string[];
  label: string;
}

/** A concise CodeQL result for terminal output. */
export interface CodeQlFinding {
  location?: string;
  message: string;
  ruleId: string;
}

/**
 * @param output - Output from `codeql version`.
 * @returns The CLI release version, when present.
 */
export function parseCodeQlVersion(output: string): string | undefined {
  return /CodeQL command-line toolchain release\s+([^\s.]+(?:\.[^\s.]+)+)\.?/u.exec(output)?.[1];
}

/**
 * @param output - Output from `codeql version`.
 * @param expected - Version required by package.json.
 * @throws When the installed CLI does not match the required version.
 */
export function assertCodeQlVersion(output: string, expected: string): void {
  const actual = parseCodeQlVersion(output);
  if (actual !== expected) {
    throw new Error(`CodeQL CLI ${expected} is required; found ${actual ?? "an unknown version"}.`);
  }
}

/**
 * @param workspace - Absolute repository root.
 * @param cacheRoot - Absolute repository-owned cache root.
 * @returns Database creation and security-extended analysis commands.
 */
export function codeQlCommands(workspace: string, cacheRoot: string): CodeQlCommand[] {
  const configPath = join(workspace, ".github", "codeql", "codeql-config.yml");
  const commonCache = join(cacheRoot, "common");
  const resultsDirectory = join(cacheRoot, "results");
  const targets = [
    { language: "javascript-typescript", name: "javascript" },
    { language: "actions", name: "actions" },
  ];

  return targets.flatMap(({ language, name }) => {
    const database = join(cacheRoot, "databases", name);
    const result = join(resultsDirectory, `${name}.sarif`);
    return [
      {
        label: `Create ${name} database`,
        args: [
          "database",
          "create",
          database,
          `--language=${language}`,
          `--source-root=${workspace}`,
          `--codescanning-config=${configPath}`,
          `--common-caches=${commonCache}`,
          "--verbosity=warnings",
        ],
      },
      {
        label: `Analyze ${name} database`,
        args: [
          "database",
          "analyze",
          database,
          "--format=sarifv2.1.0",
          `--output=${result}`,
          "--threat-model=local",
          `--common-caches=${commonCache}`,
          "--verbosity=warnings",
        ],
      },
    ];
  });
}

/**
 * @param sarif - SARIF JSON text produced by CodeQL.
 * @returns Findings across every SARIF run.
 */
export function parseSarifFindings(sarif: string): CodeQlFinding[] {
  const log = JSON.parse(sarif) as SarifLog;

  return (log.runs ?? []).flatMap((run) =>
    (run.results ?? []).map((result) => {
      const physicalLocation = result.locations?.[0]?.physicalLocation;
      const uri = physicalLocation?.artifactLocation?.uri;
      const line = physicalLocation?.region?.startLine;
      const path = typeof uri === "string" ? uri : undefined;
      const location = path ? `${path}${typeof line === "number" ? `:${line}` : ""}` : undefined;

      return {
        ...(location ? { location } : {}),
        message: typeof result.message?.text === "string" ? result.message.text : "CodeQL finding",
        ruleId: typeof result.ruleId === "string" ? result.ruleId : "unknown-rule",
      };
    }),
  );
}

/**
 * @param environment - Current process environment.
 * @returns Whether hosted CodeQL owns scanning for this GitHub Actions run.
 */
export function deferToHostedCodeQl(environment: NodeJS.ProcessEnv): boolean {
  return environment.GITHUB_ACTIONS === "true";
}

/** Runs the repository's local CodeQL gate. */
export function runCodeQlScan(): void {
  if (deferToHostedCodeQl(process.env)) {
    console.log("CodeQL CLI scan deferred to the repository's required hosted CodeQL checks.");
    return;
  }

  const workspace = fileURLToPath(new URL("../../", import.meta.url));
  const cacheRoot = resolve(workspace, ".cache", "codeql");
  if (!cacheRoot.startsWith(`${resolve(workspace)}${process.platform === "win32" ? "\\" : "/"}`)) {
    throw new Error("CodeQL cache must remain inside the repository.");
  }

  const packageMetadata = JSON.parse(
    readFileSync(join(workspace, "package.json"), "utf8"),
  ) as PackageMetadata;
  const expectedVersion = packageMetadata.toolchain?.codeql;
  if (typeof expectedVersion !== "string" || !/^\d+\.\d+\.\d+$/u.test(expectedVersion)) {
    throw new Error("package.json must define toolchain.codeql as an exact version.");
  }

  const versionResult = spawnSync("codeql", ["version"], {
    cwd: workspace,
    encoding: "utf8",
  });
  if (versionResult.error || versionResult.status !== 0) {
    throw new Error(`Unable to run CodeQL CLI. Install ${expectedVersion} and add codeql to PATH.`);
  }
  assertCodeQlVersion(`${versionResult.stdout}${versionResult.stderr}`, expectedVersion);

  rmSync(cacheRoot, { force: true, recursive: true });
  mkdirSync(join(cacheRoot, "databases"), { recursive: true });
  mkdirSync(join(cacheRoot, "results"), { recursive: true });

  for (const command of codeQlCommands(workspace, cacheRoot)) {
    console.log(`${command.label}...`);
    const result = spawnSync("codeql", command.args, { cwd: workspace, stdio: "inherit" });
    if (result.error || result.status !== 0) {
      throw new Error(`${command.label} failed.`);
    }
  }

  const findings = ["javascript", "actions"].flatMap((name) =>
    parseSarifFindings(readFileSync(join(cacheRoot, "results", `${name}.sarif`), "utf8")),
  );
  if (findings.length > 0) {
    for (const finding of findings) {
      console.error(
        `- ${finding.ruleId}${finding.location ? ` (${finding.location})` : ""}: ${finding.message}`,
      );
    }
    throw new Error(
      `CodeQL found ${findings.length} security issue${findings.length === 1 ? "" : "s"}.`,
    );
  }

  console.log("CodeQL found no security issues.");
}

if (import.meta.main) runCodeQlScan();
