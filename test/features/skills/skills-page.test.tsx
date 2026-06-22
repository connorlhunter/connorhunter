import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { SkillsPage } from "@/features/skills/skills-page";
import { mockContent } from "../../mock-content";

describe("SkillsPage", () => {
  test("renders icons on skill cards", () => {
    render(<SkillsPage content={mockContent} />);

    expect(screen.getByRole("heading", { level: 2, name: "Example Category" })).toBeTruthy();
    expect(document.querySelectorAll(".content-card-icon")).toHaveLength(mockContent.skills.length);

    cleanup();
  });
});
