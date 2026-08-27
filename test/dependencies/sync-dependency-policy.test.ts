import { describe, expect, test } from "bun:test";
import { bunfigWithReleaseAgeExcludes } from "../../scripts/dependencies/sync-dependency-policy";

describe("bunfigWithReleaseAgeExcludes", () => {
  test("keeps one exclusion on one line", () => {
    const result = bunfigWithReleaseAgeExcludes(
      `[install]
minimumReleaseAge = 604800
`,
      { nanoid: { reason: "Example." } },
    );

    expect(result).toContain('minimumReleaseAgeExcludes = ["nanoid"]');
  });

  test("replaces a compact exclusion list without removing later sections", () => {
    const result = bunfigWithReleaseAgeExcludes(
      `[install]
minimumReleaseAge = 604800
minimumReleaseAgeExcludes = ["stale"]

[test]
preload = ["./test/setup.ts"]
`,
      { current: { reason: "Example." } },
    );

    expect(result).toContain('minimumReleaseAgeExcludes = ["current"]');
    expect(result).toContain('[test]\npreload = ["./test/setup.ts"]');
  });

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
      '[install]\nminimumReleaseAge = 604800\nminimumReleaseAgeExcludes = ["current"]',
    );
    expect(result).not.toContain('"stale"');
    expect(result.indexOf("minimumReleaseAgeExcludes")).toBeLessThan(result.indexOf("[test]"));
  });
});
