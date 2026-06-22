import { describe, expect, test } from "bun:test";
import { emailContact, mailtoHref } from "@/lib/contact";

describe("contact helpers", () => {
  test("finds the configured email contact", () => {
    expect(
      emailContact([
        { href: "https://example.com", kind: "github", label: "GitHub" },
        { href: "mailto:test@example.com", kind: "email", label: "Email" },
      ])?.href,
    ).toBe("mailto:test@example.com");
  });

  test("builds mailto hrefs while preserving existing query params", () => {
    expect(mailtoHref(undefined, "Hello there", "Line 1\nLine 2")).toBe(
      "mailto:?subject=Hello%20there&body=Line%201%0ALine%202",
    );
    expect(
      mailtoHref(
        { href: "mailto:test@example.com?cc=team@example.com", kind: "email", label: "Email" },
        "Project follow-up",
        "Viewed the project.",
      ),
    ).toContain("cc=team@example.com&subject=Project%20follow-up");
  });
});
