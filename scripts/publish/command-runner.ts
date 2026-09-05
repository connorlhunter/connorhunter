import { spawn } from "node:child_process";

export type CommandRunner = (
  command: string,
  args: ReadonlyArray<string>,
  subject: string,
) => Promise<void>;

/** Runs an argument array without a shell and includes child output on failure. */
export const defaultCommandRunner: CommandRunner = (command, args, subject) =>
  new Promise((resolve, reject) => {
    const child = spawn(command, [...args], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.on("error", (error: Error) => {
      reject(new Error(`${subject} failed: ${error.message}`));
    });
    child.on("close", (code: number | null) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          [`${subject} failed with exit code ${code ?? "unknown"}.`, stdout.trim(), stderr.trim()]
            .filter(Boolean)
            .join("\n"),
        ),
      );
    });
  });
