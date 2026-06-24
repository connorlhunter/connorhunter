import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  clearResumePdfDocumentCache,
  loadResumePdfDocument,
  ResumePdfPreview,
  type ResumePdfDocument,
  type ResumePdfDocumentLoader,
} from "@/features/resume/resume-pdf-preview";

interface TestPdfDocument {
  readonly cancelCount: () => number;
  readonly document: ResumePdfDocument;
  readonly pageRequests: ReadonlyArray<number>;
  readonly renderCount: () => number;
}

const pdfWorkerOptions: { workerSrc?: string } = {};
let getDocumentCalls: Array<unknown> = [];
let getDocumentImplementation: (input: unknown) => {
  readonly promise: Promise<ResumePdfDocument>;
} = () => ({ promise: Promise.resolve(createTestPdfDocument().document) });

mock.module("pdfjs-dist", () => ({
  GlobalWorkerOptions: pdfWorkerOptions,
  getDocument: (input: unknown) => {
    getDocumentCalls.push(input);

    return getDocumentImplementation(input);
  },
}));

afterEach(() => {
  cleanup();
  clearResumePdfDocumentCache();
  getDocumentCalls = [];
  getDocumentImplementation = () => ({
    promise: Promise.resolve(createTestPdfDocument().document),
  });
  delete pdfWorkerOptions.workerSrc;
});

function createDeferred(): {
  readonly promise: Promise<void>;
  readonly resolve: () => void;
} {
  let resolvePromise: () => void = () => undefined;
  const promise = new Promise<void>((resolve) => {
    resolvePromise = resolve;
  });

  return { promise, resolve: resolvePromise };
}

function createTestPdfDocument(renderPromise: Promise<void> = Promise.resolve()): TestPdfDocument {
  const pageRequests: Array<number> = [];
  let cancelCount = 0;
  let renderCount = 0;

  return {
    cancelCount: () => cancelCount,
    document: {
      getPage: async (page) => {
        pageRequests.push(page);

        return {
          getViewport: ({ scale }) => ({ height: 792 * scale, width: 612 * scale }),
          render: () => {
            renderCount += 1;

            return {
              cancel: () => {
                cancelCount += 1;
              },
              promise: renderPromise,
            };
          },
        };
      },
    },
    pageRequests,
    renderCount: () => renderCount,
  };
}

describe("ResumePdfPreview", () => {
  test("renders the selected PDF page to a canvas", async () => {
    const pdf = createTestPdfDocument();
    const loadDocument: ResumePdfDocumentLoader = async () => pdf.document;

    render(
      <ResumePdfPreview
        href="https://assets.example/resume.pdf"
        loadDocument={loadDocument}
        page={2}
        title="Resume page 2"
      />,
    );

    expect(screen.getByText("Loading page 2")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByRole("img", { name: "Resume page 2" }).getAttribute("data-loaded")).toBe(
        "true",
      );
    });

    const canvas = screen.getByRole("img", { name: "Resume page 2" }) as HTMLCanvasElement;

    expect(canvas.width).toBe(1224);
    expect(canvas.height).toBe(1584);
    expect(canvas.style.aspectRatio).toBe("1224 / 1584");
    expect(pdf.pageRequests).toEqual([2]);
    expect(pdf.renderCount()).toBe(1);

    cleanup();

    expect(pdf.cancelCount()).toBe(1);
  });

  test("shows a preview error when the PDF cannot be rendered", async () => {
    const loadDocument: ResumePdfDocumentLoader = async () => {
      throw new Error("PDF unavailable");
    };

    render(
      <ResumePdfPreview
        href="https://assets.example/missing.pdf"
        loadDocument={loadDocument}
        page={1}
        title="Resume page 1"
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Unable to preview page 1. Use Open or Download.")).toBeTruthy();
    });

    expect(screen.getByRole("img", { name: "Resume page 1" }).getAttribute("data-loaded")).toBe(
      "false",
    );
  });

  test("cancels the active render when the preview unmounts", async () => {
    const deferred = createDeferred();
    const pdf = createTestPdfDocument(deferred.promise);
    const loadDocument: ResumePdfDocumentLoader = async () => pdf.document;

    render(
      <ResumePdfPreview
        href="https://assets.example/resume.pdf"
        loadDocument={loadDocument}
        page={1}
        title="Resume page 1"
      />,
    );

    await waitFor(() => {
      expect(pdf.renderCount()).toBe(1);
    });

    cleanup();
    deferred.resolve();
    await deferred.promise;

    expect(pdf.cancelCount()).toBe(1);
  });

  test("loads PDF.js with the static worker and caches documents by href", async () => {
    const pdf = createTestPdfDocument();
    const href = "https://assets.example/resume.pdf";

    getDocumentImplementation = () => ({ promise: Promise.resolve(pdf.document) });

    const loadedDocument = await loadResumePdfDocument(href);

    expect(await loadResumePdfDocument(href)).toBe(loadedDocument);
    expect(getDocumentCalls).toEqual([{ url: href, useSystemFonts: true }]);
    expect(pdfWorkerOptions.workerSrc).toBe("/pdf.worker.mjs");

    const loadedPage = await loadedDocument.getPage(2);
    const viewport = loadedPage.getViewport({ scale: 1 });
    const canvas = document.createElement("canvas");

    await loadedPage.render({ canvas, viewport }).promise;

    expect(viewport).toEqual({ height: 792, width: 612 });
    expect(pdf.pageRequests).toEqual([2]);
    expect(pdf.renderCount()).toBe(1);
  });

  test("drops failed PDF.js documents from the cache", async () => {
    const pdf = createTestPdfDocument();
    const href = "https://assets.example/bad.pdf";

    getDocumentImplementation = () => ({ promise: Promise.reject(new Error("Load failed")) });

    await expect(loadResumePdfDocument(href)).rejects.toThrow("Load failed");

    getDocumentImplementation = () => ({ promise: Promise.resolve(pdf.document) });

    await (await loadResumePdfDocument(href)).getPage(1);
    expect(pdf.pageRequests).toEqual([1]);
    expect(getDocumentCalls).toEqual([
      { url: href, useSystemFonts: true },
      { url: href, useSystemFonts: true },
    ]);
  });
});
