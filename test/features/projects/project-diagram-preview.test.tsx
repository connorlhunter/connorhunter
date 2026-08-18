import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ProjectDiagramPreview } from "@/features/projects/project-diagram-preview";

describe("ProjectDiagramPreview", () => {
  test("shows diagram loading, ready, changed, and error states", () => {
    const view = render(
      <ProjectDiagramPreview href="https://assets.example.com/overview.svg" title="Overview" />,
    );
    const overview = screen.getByRole("img", { name: "Overview" });

    expect(screen.getByRole("status").textContent).toContain("Loading Overview");
    expect(overview.getAttribute("data-loaded")).toBe("false");

    fireEvent.load(overview);

    expect(screen.queryByRole("status")).toBeNull();
    expect(overview.getAttribute("data-loaded")).toBe("true");

    view.rerender(
      <ProjectDiagramPreview href="https://assets.example.com/detail.svg" title="Detail" />,
    );
    const detail = screen.getByRole("img", { name: "Detail" });

    expect(screen.getByRole("status").textContent).toContain("Loading Detail");
    fireEvent.error(detail);

    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByRole("alert").textContent).toContain("Unable to open Detail");

    cleanup();
  });

  test("accepts an image that finished loading before navigation completes", () => {
    const imagePrototype = window.HTMLImageElement.prototype;
    const completeDescriptor = Object.getOwnPropertyDescriptor(imagePrototype, "complete");
    const naturalWidthDescriptor = Object.getOwnPropertyDescriptor(imagePrototype, "naturalWidth");

    Object.defineProperties(imagePrototype, {
      complete: { configurable: true, get: () => false },
      naturalWidth: { configurable: true, get: () => 0 },
    });

    try {
      render(
        <ProjectDiagramPreview href="https://assets.example.com/overview.svg" title="Overview" />,
      );

      expect(screen.getByRole("status")).toBeTruthy();
      cleanup();

      Object.defineProperties(imagePrototype, {
        complete: { configurable: true, get: () => true },
        naturalWidth: { configurable: true, get: () => 960 },
      });
      render(
        <ProjectDiagramPreview href="https://assets.example.com/overview.svg" title="Overview" />,
      );

      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.getByRole("img", { name: "Overview" }).getAttribute("data-loaded")).toBe(
        "true",
      );
    } finally {
      if (completeDescriptor) {
        Object.defineProperty(imagePrototype, "complete", completeDescriptor);
      }
      if (naturalWidthDescriptor) {
        Object.defineProperty(imagePrototype, "naturalWidth", naturalWidthDescriptor);
      }
      cleanup();
    }
  });
});
