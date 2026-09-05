import { Download, ExternalLink, LoaderCircle, Mail, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TypographyH4, TypographySmall } from "@/components/ui/typography";
import { downloadFile } from "@/lib/download-file";
import { SiteLink } from "@/components/ui/site-link";
import type { FileViewerAction, FileViewerDownload } from "./file-viewer-types";

interface FileViewerHeadingProps {
  readonly icon: ReactNode;
  readonly title: string;
}

interface FileViewerActionsProps {
  readonly actions: ReadonlyArray<FileViewerAction>;
  readonly download?: FileViewerDownload | undefined;
  readonly emailHref?: string | undefined;
  readonly fullscreen: boolean;
  readonly onToggleFullscreen: () => void;
  readonly openHref?: string | undefined;
}

/**
 * @param props - File icon and current viewer title.
 * @returns A compact shared file viewer heading.
 */
export function FileViewerHeading({ icon, title }: FileViewerHeadingProps): ReactNode {
  return (
    <div className="file-viewer-heading">
      <span className="file-viewer-icon">{icon}</span>
      <TypographyH4 as="h1" className="truncate">
        {title}
      </TypographyH4>
    </div>
  );
}

/**
 * @param props - Navigation, file actions, and fullscreen state.
 * @returns Shared file viewer action controls.
 */
export function FileViewerActions({
  actions,
  download,
  emailHref,
  fullscreen,
  onToggleFullscreen,
  openHref,
}: FileViewerActionsProps): ReactNode {
  const [downloadFailed, setDownloadFailed] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const downloadRequestId = useRef(0);

  useEffect(() => {
    downloadRequestId.current += 1;
    setDownloadFailed(false);
    setDownloading(false);
  }, [download?.filename, download?.href]);

  async function handleDownload(file: FileViewerDownload): Promise<void> {
    const requestId = downloadRequestId.current + 1;
    downloadRequestId.current = requestId;
    setDownloadFailed(false);
    setDownloading(true);

    try {
      await downloadFile(file.href, file.filename);
      if (downloadRequestId.current === requestId) {
        setDownloadFailed(false);
      }
    } catch {
      if (downloadRequestId.current === requestId) {
        setDownloadFailed(true);
      }
    } finally {
      if (downloadRequestId.current === requestId) {
        setDownloading(false);
      }
    }
  }

  return (
    <div className="file-viewer-actions">
      {actions.map((action) => {
        const href = action.to ?? action.href;
        return href ? (
          <Button asChild key={`${action.label}-${href}`} size="small" variant="outline">
            <SiteLink
              href={href}
              rel={action.target === "_blank" ? "noreferrer" : undefined}
              target={action.target}
            >
              {action.icon}
              {action.label}
            </SiteLink>
          </Button>
        ) : null;
      })}
      {openHref ? (
        <Button asChild size="small" variant="outline">
          <a href={openHref} rel="noreferrer" target="_blank">
            <ExternalLink aria-hidden="true" className="size-4" />
            Open
          </a>
        </Button>
      ) : null}
      {download ? (
        <Button
          disabled={downloading}
          onClick={() => {
            void handleDownload(download);
          }}
          size="small"
          type="button"
          variant="secondary"
        >
          {downloading ? (
            <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <Download aria-hidden="true" className="size-4" />
          )}
          {downloading ? "Downloading" : "Download"}
        </Button>
      ) : null}
      {emailHref ? (
        <Button asChild size="small" variant="outline">
          <a href={emailHref}>
            <Mail aria-hidden="true" className="size-4" />
            Email
          </a>
        </Button>
      ) : null}
      <Button
        aria-pressed={fullscreen}
        className="file-viewer-fullscreen-action"
        onClick={onToggleFullscreen}
        size="small"
        type="button"
        variant="outline"
      >
        {fullscreen ? (
          <Minimize2 aria-hidden="true" className="size-4" />
        ) : (
          <Maximize2 aria-hidden="true" className="size-4" />
        )}
        {fullscreen ? "Exit" : "Full screen"}
      </Button>
      {download && downloadFailed ? (
        <TypographySmall as="p" className="file-viewer-download-error" role="alert">
          Unable to download {download.filename}. Try again.
        </TypographySmall>
      ) : null}
    </div>
  );
}
