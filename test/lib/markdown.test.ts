import { describe, expect, test } from "bun:test";
import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  test("renders local markdown through marked", () => {
    expect(renderMarkdown("A **strong** point.")).toContain("<strong>strong</strong>");
  });
});
