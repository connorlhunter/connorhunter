import { describe, expect, test } from "bun:test";
import { bunfigWithReleaseAgeExcludes } from "../../scripts/dependencies/sync-dependency-policy";

describe("bunfigWithReleaseAgeExcludes", () => {
  test("places sorted exclusions in the install section", () => {
    const result = bunfigWithReleaseAgeExcludes(
      `[install]
minimumReleaseAge = 604800

[test]
preload = ["./test/setup.ts"]
`,
      {
        zebra: { reason: "Example." },
        alpha: { reason: "Example." },
      },
    );

    expect(result).toContain(
      `[install]
minimumReleaseAge = 604800
minimumReleaseAgeExcludes = [
  "alpha",
  "zebra",
]

[test]`,
    );
  });

  test("removes stale exclusions from other sections", () => {
    const result = bunfigWithReleaseAgeExcludes(
      `[install]
minimumReleaseAge = 604800

[test]
minimumReleaseAgeExcludes = [
  "stale",
]
`,
      { current: { reason: "Example." } },
    );

    expect(result).toContain(
      '[install]\nminimumReleaseAge = 604800\nminimumReleaseAgeExcludes = [\n  "current",\n]',
    );
    expect(result).not.toContain('"stale"');
    expect(result.indexOf("minimumReleaseAgeExcludes")).toBeLessThan(result.indexOf("[test]"));
  });
});
