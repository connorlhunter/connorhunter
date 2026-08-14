import { spawnSync } from "node:child_process";

const CHANGE_TYPES = ["feat", "fix", "chore", "docs", "test", "refactor"] as const;
const TYPE_PATTERN = CHANGE_TYPES.join("|");
const SEMANTIC_BRANCH = new RegExp(`^(?:${TYPE_PATTERN})/[a-z0-9]+(?:-[a-z0-9]+)*$`, "u");
const SEMANTIC_SUBJECT = new RegExp(
  `^(?:${TYPE_PATTERN})(?:\\([a-z0-9][a-z0-9.-]*\\))?!?: \\S(?:.*\\S)?$`,
  "u",
);
const SEMVER =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

/** Returns whether a value is a valid semantic version without a leading v. */
export function isSemanticVersion(value: string): boolean {
  const match = SEMVER.exec(value);
  if (!match) return false;

  return (match[4]?.split(".") ?? []).every(
    (identifier) => !/^\d+$/u.test(identifier) || identifier === "0" || !identifier.startsWith("0"),
  );
}

/** Returns whether a branch follows the repository naming rules. */
export function isAllowedBranch(branch: string): boolean {
  if (branch === "main" || /^dependabot\/.+$/u.test(branch)) return true;
  if (SEMANTIC_BRANCH.test(branch)) return true;
  return branch.startsWith("release/") && isSemanticVersion(branch.slice("release/".length));
}

/** Throws when a branch does not follow the repository naming rules. */
export function assertAllowedBranch(branch: string): void {
  if (!isAllowedBranch(branch)) {
    throw new Error(`Invalid branch "${branch}". Use <type>/<kebab-summary> or release/<version>.`);
  }
}

/** Throws when an issue, pull request, or commit subject is not semantic. */
export function assertSemanticSubject(subject: string): void {
  if (!SEMANTIC_SUBJECT.test(subject)) {
    throw new Error(`Invalid subject "${subject}". Use <type>[(scope)][!]: <summary>.`);
  }
}

/** Resolves a branch supplied by CI or the current local Git checkout. */
export function resolveBranch(environment: NodeJS.ProcessEnv = process.env): string {
  const suppliedBranch = environment.CHANGE_BRANCH?.trim();
  if (suppliedBranch) return suppliedBranch;

  const result = spawnSync("git", ["branch", "--show-current"], { encoding: "utf8" });
  const branch = result.stdout.trim();
  if (result.status !== 0 || !branch) {
    throw new Error("Unable to resolve the current branch. Set CHANGE_BRANCH explicitly.");
  }
  return branch;
}

/** Runs the requested naming check. */
export function runNamingCheck(
  mode: string | undefined,
  environment: NodeJS.ProcessEnv = process.env,
): void {
  if (mode === "branch") {
    assertAllowedBranch(resolveBranch(environment));
    return;
  }

  if (mode === "subject") {
    const subject = environment.CHANGE_SUBJECT?.trim();
    if (!subject) throw new Error("CHANGE_SUBJECT is required for subject validation.");
    assertSemanticSubject(subject);
    return;
  }

  throw new Error("Expected naming check mode: branch or subject.");
}

if (import.meta.main) runNamingCheck(Bun.argv[2]);
