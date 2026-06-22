import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ExperiencePage } from "@/features/experience/experience-page";
import { mockContent } from "../../mock-content";

describe("ExperiencePage", () => {
  test("renders icons on work, education, and certification cards", () => {
    render(<ExperiencePage content={mockContent} />);

    expect(screen.getByRole("heading", { level: 2, name: "Work" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Education" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Certifications" })).toBeTruthy();
    expect(document.querySelectorAll(".content-card-icon")).toHaveLength(3);

    cleanup();
  });
});
