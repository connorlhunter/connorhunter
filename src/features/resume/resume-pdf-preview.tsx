import { LoaderCircle, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TypographySmall } from "@/components/ui/typography";
import type { PageViewport, PDFDocumentProxy } from "pdfjs-dist";

interface ResumePdfViewport {
  readonly height: number;
  readonly width: number;
}

interface ResumePdfRenderTask {
  readonly promise: Promise<void>;
  cancel: () => void;
}

interface ResumePdfPage {
  getViewport: (input: { readonly scale: number }) => ResumePdfViewport;
  render: (input: {
    readonly canvas: HTMLCanvasElement;
    readonly viewport: ResumePdfViewport;
  }) => ResumePdfRenderTask;
}

export interface ResumePdfDocument {
  getPage: (page: number) => Promise<ResumePdfPage>;
}

export type ResumePdfDocumentLoader = (href: string) => Promise<ResumePdfDocument>;

interface ResumePdfPreviewProps {
  readonly href: string;
  readonly loadDocument?: ResumePdfDocumentLoader | undefined;
  readonly page: number;
  readonly title: string;
}

type ResumePdfPreviewStatus = "error" | "loading" | "ready";

const loadedDocuments = new Map<string, Promise<ResumePdfDocument>>();
const resumePdfScale = 2;
const resumePdfWorkerPath = "/pdf.worker.mjs";

/**
 * @returns Nothing; clears cached PDF document promises for tests.
 */
export function clearResumePdfDocumentCache(): void {
  loadedDocuments.clear();
}

/**
 * @param pdfDocument - PDF.js document proxy.
 * @returns A narrow document adapter used by the preview component.
 */
function toResumePdfDocument(pdfDocument: PDFDocumentProxy): ResumePdfDocument {
  return {
    getPage: async (pageNumber) => {
      const pdfPage = await pdfDocument.getPage(pageNumber);

      return {
        getViewport: (input) => pdfPage.getViewport(input),
        render: ({ canvas, viewport }) =>
          pdfPage.render({ canvas, viewport: viewport as PageViewport }),
      };
    },
  };
}

/**
 * @param href - Public PDF URL to load.
 * @returns A cached PDF.js document proxy.
 */
export async function loadResumePdfDocument(href: string): Promise<ResumePdfDocument> {
  const cachedDocument = loadedDocuments.get(href);

  if (cachedDocument) {
    return cachedDocument;
  }

  const documentPromise = import("pdfjs-dist")
    .then(async (pdfjs) => {
      pdfjs.GlobalWorkerOptions.workerSrc = resumePdfWorkerPath;

      const pdfDocument = await pdfjs.getDocument({ url: href, useSystemFonts: true }).promise;

      return toResumePdfDocument(pdfDocument);
    })
    .catch((error: unknown) => {
      loadedDocuments.delete(href);
      throw error;
    });

  loadedDocuments.set(href, documentPromise);

  return documentPromise;
}

/**
 * @param props - PDF URL, selected page, and accessible preview title.
 * @returns Canvas-backed PDF page preview that does not depend on native mobile PDF viewers.
 */
export function ResumePdfPreview({
  href,
  loadDocument = loadResumePdfDocument,
  page,
  title,
}: ResumePdfPreviewProps): ReactNode {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<ResumePdfPreviewStatus>("loading");

  useEffect(() => {
    let active = true;
    let renderTask: ResumePdfRenderTask | undefined;

    setStatus("loading");

    async function renderSelectedPage(): Promise<void> {
      const pdfDocument = await loadDocument(href);
      const pdfPage = await pdfDocument.getPage(page);
      const viewport = pdfPage.getViewport({ scale: resumePdfScale });
      const canvas = canvasRef.current;

      if (!canvas) {
        throw new Error("Resume preview canvas unavailable.");
      }

      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      canvas.style.aspectRatio = `${viewport.width} / ${viewport.height}`;
      renderTask = pdfPage.render({ canvas, viewport });

      await renderTask.promise;
    }

    void renderSelectedPage()
      .then(() => {
        if (active) {
          setStatus("ready");
        }
      })
      .catch(() => {
        if (active) {
          setStatus("error");
        }
      });

    return () => {
      active = false;
      renderTask?.cancel();
    };
  }, [href, loadDocument, page]);

  return (
    <div aria-busy={status === "loading"} className="resume-pdf-preview" data-status={status}>
      <canvas
        aria-label={title}
        className="resume-pdf-canvas"
        data-loaded={status === "ready"}
        ref={canvasRef}
        role="img"
      />
      {status === "loading" ? (
        <TypographySmall as="p" className="resume-pdf-status">
          <LoaderCircle aria-hidden="true" className="resume-pdf-status-icon" />
          Loading page {page}
        </TypographySmall>
      ) : null}
      {status === "error" ? (
        <TypographySmall as="p" className="resume-pdf-status resume-pdf-status--error">
          <TriangleAlert aria-hidden="true" className="resume-pdf-status-icon" />
          Unable to preview page {page}. Use Open or Download.
        </TypographySmall>
      ) : null}
    </div>
  );
}
