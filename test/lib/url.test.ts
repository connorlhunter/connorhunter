import { describe, expect, test } from "bun:test";
import { publicConfig } from "@/config/public-env";
import { isExternalHref } from "@/lib/url";

describe("isExternalHref", () => {
  test("recognizes web and contact links", () => {
    expect(isExternalHref(publicConfig.siteOrigin)).toBe(true);
    expect(isExternalHref("http://localhost:3000")).toBe(true);
    expect(isExternalHref(publicConfig.contactEmailHref)).toBe(true);
    expect(isExternalHref(publicConfig.contactPhoneHref)).toBe(true);
    expect(isExternalHref("/projects")).toBe(false);
  });
});
