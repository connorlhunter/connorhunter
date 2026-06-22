import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { NotFoundPage } from "@/features/not-found/not-found-page";
import { mockContent } from "../../mock-content";

describe("NotFoundPage", () => {
  test("renders the shared header before the not found content", () => {
    render(<NotFoundPage content={mockContent} />);

    expect(screen.getByRole("link", { name: /example person/i })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 1, name: "Page not found" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Home" }).getAttribute("href")).toBe("/");
    expect(screen.getAllByRole("link", { name: "Projects" }).at(-1)?.getAttribute("href")).toBe(
      "/projects",
    );

    cleanup();
  });
});
