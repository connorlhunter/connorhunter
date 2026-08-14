import { describe, expect, test } from "bun:test";
import {
  assertAllowedBranch,
  assertSemanticSubject,
  isAllowedBranch,
  isSemanticVersion,
} from "../../scripts/naming/validate-change-naming";

describe("semantic change naming", () => {
  test("accepts semantic, release, main, and Dependabot branches", () => {
    expect(isAllowedBranch("main")).toBe(true);
    expect(isAllowedBranch("feat/add-naming-check")).toBe(true);
    expect(isAllowedBranch("release/1.4.7")).toBe(true);
    expect(isAllowedBranch("release/0.2.0-rc.1")).toBe(true);
    expect(isAllowedBranch("dependabot/bun/dependencies-ab12cd34ef")).toBe(true);
  });

  test("rejects invalid branch and release names", () => {
    expect(isAllowedBranch("feature/add-naming-check")).toBe(false);
    expect(isAllowedBranch("feat/Add_Naming_Check")).toBe(false);
    expect(isAllowedBranch("dependabot/")).toBe(false);
    expect(isAllowedBranch("release/v1.4.7")).toBe(false);
    expect(isSemanticVersion("1.4.7-01")).toBe(false);
    expect(() => assertAllowedBranch("release/1.4")).toThrow("Invalid branch");
  });

  test("accepts semantic subjects including scopes and breaking changes", () => {
    expect(() => assertSemanticSubject("feat: add naming checks")).not.toThrow();
    expect(() => assertSemanticSubject("fix(viewer): keep focus in drawer")).not.toThrow();
    expect(() =>
      assertSemanticSubject("refactor(content)!: replace manifest schema"),
    ).not.toThrow();
    expect(() => assertSemanticSubject("chore(release): prepare 1.4.7")).not.toThrow();
  });

  test("rejects non-semantic subjects", () => {
    expect(() => assertSemanticSubject("Add naming checks")).toThrow("Invalid subject");
    expect(() => assertSemanticSubject("ci: update workflow")).toThrow("Invalid subject");
    expect(() => assertSemanticSubject("feat add naming checks")).toThrow("Invalid subject");
  });
});
