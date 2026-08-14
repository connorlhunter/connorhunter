import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  assertCodeQlVersion,
  codeQlCommands,
  deferToHostedCodeQl,
  parseCodeQlVersion,
  parseSarifFindings,
} from "../../scripts/security/run-codeql";

describe("CodeQL verification", () => {
  test("parses and enforces the configured CLI version", () => {
    const output = "CodeQL command-line toolchain release 2.26.3.\nCopyright GitHub";

    expect(parseCodeQlVersion(output)).toBe("2.26.3");
    expect(() => assertCodeQlVersion(output, "2.26.3")).not.toThrow();
    expect(() => assertCodeQlVersion(output, "2.26.2")).toThrow("2.26.2 is required");
  });

  test("builds repository-owned scan commands", () => {
    const workspace = "/workspace/portfolio";
    const cacheRoot = join(workspace, ".cache", "codeql");
    const commands = codeQlCommands(workspace, cacheRoot);

    expect(commands).toHaveLength(4);
    expect(commands[0]?.args).toContain("--language=javascript-typescript");
    expect(commands[2]?.args).toContain("--language=actions");
    expect(commands.every(({ args }) => args.join(" ").includes(cacheRoot))).toBe(true);
    expect(commands[0]?.args.some((argument) => argument.endsWith("codeql-config.yml"))).toBe(true);
    expect(commands[1]?.args.some((argument) => argument.endsWith("codeql-config.yml"))).toBe(
      false,
    );
    expect(commands[2]?.args.some((argument) => argument.endsWith("codeql-config.yml"))).toBe(true);
    expect(commands[3]?.args.some((argument) => argument.endsWith("codeql-config.yml"))).toBe(
      false,
    );
    expect(commands[1]?.args).toContain("--threat-model=local");
    expect(commands[3]?.args).toContain("--threat-model=local");
  });

  test("parses SARIF findings and defers only on GitHub Actions", () => {
    const findings = parseSarifFindings(
      JSON.stringify({
        runs: [
          {
            results: [
              {
                ruleId: "js/example",
                message: { text: "Example finding" },
                locations: [
                  {
                    physicalLocation: {
                      artifactLocation: { uri: "src/example.ts" },
                      region: { startLine: 12 },
                    },
                  },
                ],
              },
            ],
          },
        ],
      }),
    );

    expect(findings).toEqual([
      {
        location: "src/example.ts:12",
        message: "Example finding",
        ruleId: "js/example",
      },
    ]);
    expect(deferToHostedCodeQl({ GITHUB_ACTIONS: "true" })).toBe(true);
    expect(deferToHostedCodeQl({ CI: "true" })).toBe(false);
  });
});
