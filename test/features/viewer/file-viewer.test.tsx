import { describe, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { themeMessageType, themeStorageKey } from "@/features/theme/theme";
import { FileViewer, navigateInPlace } from "@/features/viewer/file-viewer";

describe("FileViewer", () => {
  test("does not mount an iframe until the client can listen for its first load", () => {
    const html = renderToStaticMarkup(
      <FileViewer
        ariaLabel="Example viewer"
        icon={<span aria-hidden="true">F</span>}
        sourceHref="https://artifacts.example.com/viewer.html"
        title="Example file"
      />,
    );

    expect(html).toContain("Loading Example file");
    expect(html).not.toContain('src="https://artifacts.example.com/viewer.html"');
    expect(html).not.toContain("<iframe");
  });

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
      expect(screen.getByRole("status").textContent).toContain("Loading Example file");
      expect(screen.getByTitle("Example file").getAttribute("data-loaded")).toBe("false");
    } finally {
      cleanup();
      window.history.pushState = originalPushState;
    }
  });

  test("does not keep the previous iframe source while changing viewers", async () => {
    const view = render(
      <FileViewer
        ariaLabel="Example viewer"
        icon={<span aria-hidden="true">F</span>}
        sourceHref="/docs.html"
        title="Docs"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTitle("Docs").getAttribute("src")).toBe("/docs.html");
    });

    view.rerender(
      <FileViewer
        ariaLabel="Example viewer"
        icon={<span aria-hidden="true">F</span>}
        sourceHref="/coverage.html"
        title="Coverage"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTitle("Coverage").getAttribute("src")).toBe("/coverage.html");
    });
    expect(screen.getByTitle("Coverage").getAttribute("src")).not.toBe("/docs.html");

    cleanup();
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

  test("downloads a viewer file through the toolbar button", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchFile = spyOn(globalThis, "fetch").mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = resolve;
      }),
    );
    const createObjectUrl = spyOn(URL, "createObjectURL").mockReturnValue("blob:example-file");
    const revokeObjectUrl = spyOn(URL, "revokeObjectURL");

    try {
      render(
        <FileViewer
          ariaLabel="Example viewer"
          download={{ filename: "example-file.pdf", href: "https://assets.example.com/file.pdf" }}
          icon={<span aria-hidden="true">F</span>}
          title="Example file"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Download" }));

      expect(
        (screen.getByRole("button", { name: "Downloading" }) as HTMLButtonElement).disabled,
      ).toBe(true);

      resolveFetch?.(new Response("file", { status: 200 }));

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Download" })).toBeTruthy();
      });

      expect(fetchFile).toHaveBeenCalledWith("https://assets.example.com/file.pdf");
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:example-file");
      expect(screen.queryByRole("alert")).toBeNull();
    } finally {
      cleanup();
      createObjectUrl.mockRestore();
      revokeObjectUrl.mockRestore();
      fetchFile.mockRestore();
    }
  });

  test("reports download failures without leaving the toolbar busy", async () => {
    const fetchFile = spyOn(globalThis, "fetch").mockRejectedValue(new Error("Unavailable."));

    try {
      render(
        <FileViewer
          ariaLabel="Example viewer"
          download={{ filename: "example-file.pdf", href: "https://assets.example.com/file.pdf" }}
          icon={<span aria-hidden="true">F</span>}
          title="Example file"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Download" }));

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toContain(
          "Unable to download example-file.pdf.",
        );
      });
      expect((screen.getByRole("button", { name: "Download" }) as HTMLButtonElement).disabled).toBe(
        false,
      );
    } finally {
      cleanup();
      fetchFile.mockRestore();
    }
  });

  test("ignores a stale download failure after the viewer file changes", async () => {
    let rejectFirstDownload: ((error: Error) => void) | undefined;
    const fetchFile = spyOn(globalThis, "fetch").mockImplementation(((input: URL | RequestInfo) => {
      if (String(input).endsWith("first.pdf")) {
        return new Promise<Response>((_resolve, reject) => {
          rejectFirstDownload = reject;
        });
      }

      return Promise.resolve(new Response("second", { status: 200 }));
    }) as typeof fetch);
    const createObjectUrl = spyOn(URL, "createObjectURL").mockReturnValue("blob:second-file");
    const revokeObjectUrl = spyOn(URL, "revokeObjectURL");

    try {
      const view = render(
        <FileViewer
          ariaLabel="Example viewer"
          download={{ filename: "first.pdf", href: "https://assets.example.com/first.pdf" }}
          icon={<span aria-hidden="true">F</span>}
          title="First file"
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Download" }));

      view.rerender(
        <FileViewer
          ariaLabel="Example viewer"
          download={{ filename: "second.pdf", href: "https://assets.example.com/second.pdf" }}
          icon={<span aria-hidden="true">F</span>}
          title="Second file"
        />,
      );

      await waitFor(() => {
        expect(
          (screen.getByRole("button", { name: "Download" }) as HTMLButtonElement).disabled,
        ).toBe(false);
      });

      fireEvent.click(screen.getByRole("button", { name: "Download" }));

      await waitFor(() => {
        expect(createObjectUrl).toHaveBeenCalledTimes(1);
      });

      rejectFirstDownload?.(new Error("First download failed."));

      await waitFor(() => {
        expect(screen.queryByRole("alert")).toBeNull();
      });
    } finally {
      cleanup();
      createObjectUrl.mockRestore();
      revokeObjectUrl.mockRestore();
      fetchFile.mockRestore();
    }
  });

  test("syncs the active theme to an iframe when it loads", async () => {
    const postedMessages: Array<ReadonlyArray<unknown>> = [];

    window.localStorage.setItem(themeStorageKey, "harbor");
    document.documentElement.dataset.scheme = "atlas";

    try {
      render(
        <ThemeProvider>
          <FileViewer
            ariaLabel="Example viewer"
            icon={<span aria-hidden="true">F</span>}
            sourceHref="/viewer.html"
            title="Example file"
          />
        </ThemeProvider>,
      );

      await waitFor(() => {
        expect(document.documentElement.dataset.scheme).toBe("harbor");
      });

      const frame = screen.getByTitle("Example file");
      Object.defineProperty(frame, "contentWindow", {
        configurable: true,
        value: {
          postMessage: (...args: Array<unknown>) => {
            postedMessages.push(args);
          },
        },
      });

      fireEvent.load(frame);

      expect(postedMessages).toContainEqual([{ scheme: "harbor", type: themeMessageType }, "*"]);
      expect(screen.queryByRole("status")).toBeNull();
      expect(frame.getAttribute("data-loaded")).toBe("true");
    } finally {
      cleanup();
      window.localStorage.removeItem(themeStorageKey);
    }
  });

  test("replaces the frame before loading a changed source", async () => {
    const { rerender } = render(
      <FileViewer
        ariaLabel="Example viewer"
        icon={<span aria-hidden="true">F</span>}
        sourceHref="/first-viewer.html"
        title="Example file"
      />,
    );

    const firstFrame = screen.getByTitle("Example file");
    fireEvent.load(firstFrame);

    rerender(
      <FileViewer
        ariaLabel="Example viewer"
        icon={<span aria-hidden="true">F</span>}
        sourceHref="/second-viewer.html"
        title="Example file"
      />,
    );

    await waitFor(() => {
      expect(screen.getByTitle("Example file").getAttribute("src")).toBe("/second-viewer.html");
    });

    fireEvent.load(screen.getByTitle("Example file"));
    expect(screen.queryByRole("status")).toBeNull();
  });
});
