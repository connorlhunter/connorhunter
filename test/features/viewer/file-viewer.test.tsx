import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { FileViewer, navigateInPlace } from "@/features/viewer/file-viewer";

describe("FileViewer", () => {
  test("renders optional action variants in the default toolbar", () => {
    const originalPushState = window.history.pushState;
    const pushStates: Array<string | URL | null | undefined> = [];
    window.history.pushState = ((_state, _title, url) => {
      pushStates.push(url);
    }) as typeof window.history.pushState;

    try {
      render(
        <FileViewer
          actions={[
            {
              icon: <span aria-hidden="true">I</span>,
              label: "Internal",
              to: "/internal-viewer",
            },
            {
              href: "https://example.com/external",
              icon: <span aria-hidden="true">E</span>,
              label: "External",
              target: "_blank",
            },
            {
              icon: <span aria-hidden="true">N</span>,
              label: "No href",
            },
          ]}
          ariaLabel="Example viewer"
          icon={<span aria-hidden="true">F</span>}
          sourceHref="/viewer.html"
          title="Example file"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Internal" }));

      expect(pushStates).toEqual(["/internal-viewer"]);
      expect(screen.getByRole("link", { name: "External" }).getAttribute("target")).toBe("_blank");
      expect(screen.queryByText("No href")).toBeNull();
      expect(screen.getByTitle("Example file").getAttribute("src")).toBe("/viewer.html");
    } finally {
      cleanup();
      window.history.pushState = originalPushState;
    }
  });

  test("keeps same-route navigation mounted and falls back when history push fails", () => {
    const originalPushState = window.history.pushState;
    const originalHref = window.location.href;
    const pushStates: Array<string | URL | null | undefined> = [];

    try {
      window.history.pushState = ((_state, _title, url) => {
        pushStates.push(url);
      }) as typeof window.history.pushState;

      navigateInPlace(window.location.href);

      expect(pushStates).toEqual([]);

      window.history.pushState = (() => {
        throw new Error("History unavailable.");
      }) as typeof window.history.pushState;

      expect(() => {
        navigateInPlace("/fallback-viewer");
      }).not.toThrow();
    } finally {
      window.history.pushState = originalPushState;
      window.history.replaceState(window.history.state, "", originalHref);
    }
  });
});
