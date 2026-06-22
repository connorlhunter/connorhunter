import { describe, expect, test } from "bun:test";
import { publicConfig } from "@/config/public-env";
import { fallbackShellContent } from "@/content/fallback-shell";

describe("fallbackShellContent", () => {
  test("provides shell content without reading the dynamic manifest", () => {
    expect(fallbackShellContent.profile.name).toBe(publicConfig.siteName);
    expect(fallbackShellContent.navigation).toEqual([]);
    expect(fallbackShellContent.contacts.some((contact) => contact.kind === "email")).toBe(true);
  });
});
