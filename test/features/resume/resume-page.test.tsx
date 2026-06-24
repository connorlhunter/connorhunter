import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { ResumePage } from "@/features/resume/resume-page";
import type { ResumePdfDocumentLoader } from "@/features/resume/resume-pdf-preview";
import { mockContent } from "../../mock-content";

function createResumeDocumentLoader(): ResumePdfDocumentLoader {
  return async () => ({
    getPage: async () => ({
      getViewport: () => ({ height: 792, width: 612 }),
      render: () => ({ cancel: () => undefined, promise: Promise.resolve() }),
    }),
  });
}

describe("ResumePage", () => {
  test("renders the configured PDF with viewer actions", () => {
    render(<ResumePage content={mockContent} loadResumeDocument={createResumeDocumentLoader()} />);

    const navigation = screen.getByRole("navigation", { name: "Resume navigation" });

    expect(within(navigation).getByRole("link", { name: "Contact" }).getAttribute("href")).toBe(
      "/contact",
    );
    expect(screen.getByRole("heading", { level: 1, name: "Resume" })).toBeTruthy();
    expect(document.querySelector(".file-viewer-icon")).toBeTruthy();
    expect(screen.queryByText("PDF Viewer")).toBeNull();
    expect(screen.queryByText(/view the current pdf/i)).toBeNull();
    expect(screen.getByRole("img", { name: "Example Person resume page 1" })).toBeTruthy();
    expect(screen.getByRole("link", { name: /open/i }).getAttribute("href")).toBe(
      mockContent.resume.href,
    );
    expect(screen.getByRole("link", { name: /download/i }).getAttribute("href")).toBe(
      mockContent.resume.href,
    );
    expect(screen.getByRole("link", { name: /email/i }).getAttribute("href")).toContain(
      "mailto:example@example.com",
    );
    expect(screen.getByRole("button", { name: /full screen/i })).toBeTruthy();
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: "Previous resume page" }) as HTMLButtonElement).disabled,
    ).toBe(true);

    cleanup();
  });

  test("steps through the two resume PDF pages", async () => {
    render(<ResumePage content={mockContent} loadResumeDocument={createResumeDocumentLoader()} />);

    const previous = screen.getByRole("button", { name: "Previous resume page" });
    const next = screen.getByRole("button", { name: "Next resume page" });

    fireEvent.click(next);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Example Person resume page 2" })).toBeTruthy();
    });
    expect(screen.getByText("Page 2 of 2")).toBeTruthy();
    expect((next as HTMLButtonElement).disabled).toBe(true);
    expect((previous as HTMLButtonElement).disabled).toBe(false);

    fireEvent.click(previous);

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Example Person resume page 1" })).toBeTruthy();
    });
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    expect((previous as HTMLButtonElement).disabled).toBe(true);

    cleanup();
  });

  test("uses an email query separator when the contact link already has params", () => {
    render(
      <ResumePage
        content={{
          ...mockContent,
          contacts: [
            {
              kind: "email",
              label: "example@example.com",
              href: "mailto:example@example.com?cc=review@example.com",
            },
          ],
        }}
        loadResumeDocument={createResumeDocumentLoader()}
      />,
    );

    expect(screen.getByRole("link", { name: /email/i }).getAttribute("href")).toContain(
      "review@example.com&subject=",
    );

    cleanup();
  });

  test("toggles the viewer full screen state", async () => {
    let fullscreenElement: Element | null = null;
    const fullscreenDescriptor = Object.getOwnPropertyDescriptor(document, "fullscreenElement");
    const exitFullscreenDescriptor = Object.getOwnPropertyDescriptor(document, "exitFullscreen");
    const requestFullscreenDescriptor = Object.getOwnPropertyDescriptor(
      HTMLElement.prototype,
      "requestFullscreen",
    );

    Object.defineProperty(document, "fullscreenElement", {
      configurable: true,
      get: () => fullscreenElement,
    });
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: () => {
        fullscreenElement = null;
        document.dispatchEvent(new window.Event("fullscreenchange"));
        return Promise.resolve();
      },
    });
    Object.defineProperty(HTMLElement.prototype, "requestFullscreen", {
      configurable: true,
      value(this: Element) {
        fullscreenElement = this;
        document.dispatchEvent(new window.Event("fullscreenchange"));
        return Promise.resolve();
      },
    });

    try {
      render(
        <ResumePage content={mockContent} loadResumeDocument={createResumeDocumentLoader()} />,
      );

      fireEvent.click(screen.getByRole("button", { name: /full screen/i }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: /exit/i }).getAttribute("aria-pressed")).toBe(
          "true",
        );
      });

      fireEvent.click(screen.getByRole("button", { name: /exit/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /full screen/i }).getAttribute("aria-pressed"),
        ).toBe("false");
      });
    } finally {
      cleanup();

      if (fullscreenDescriptor) {
        Object.defineProperty(document, "fullscreenElement", fullscreenDescriptor);
      }
      if (exitFullscreenDescriptor) {
        Object.defineProperty(document, "exitFullscreen", exitFullscreenDescriptor);
      }
      if (requestFullscreenDescriptor) {
        Object.defineProperty(
          HTMLElement.prototype,
          "requestFullscreen",
          requestFullscreenDescriptor,
        );
      }
    }
  });
});
