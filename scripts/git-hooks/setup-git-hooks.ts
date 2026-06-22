import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

/**
 * @returns Nothing; configures the repository to use the checked-in Git hooks.
 */
export function setupGitHooks(): void {
  if (!existsSync(".git")) {
    return;
  }

  const result = spawnSync("git", ["config", "core.hooksPath", ".githooks"], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Failed to configure Git hooks path.");
  }
}

setupGitHooks();
