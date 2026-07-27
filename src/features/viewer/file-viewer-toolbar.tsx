import { Download, ExternalLink, LoaderCircle, Mail, Maximize2, Minimize2 } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TypographyH4, TypographySmall } from "@/components/ui/typography";
import { downloadFile } from "@/lib/download-file";
import { navigateInPlace } from "./file-viewer-navigation";
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

  async function handleDownload(file: FileViewerDownload): Promise<void> {
    setDownloadFailed(false);
    setDownloading(true);

    try {
      await downloadFile(file.href, file.filename);
    } catch {
      setDownloadFailed(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="file-viewer-actions">
      {actions.map((action) => {
        if (action.to) {
          const internalHref = action.to;

          return (
            <Button
              key={`${action.label}-${internalHref}`}
              onClick={() => {
                navigateInPlace(internalHref);
              }}
              size="small"
              type="button"
              variant="outline"
            >
              {action.icon}
              {action.label}
            </Button>
          );
        }

        return action.href ? (
          <Button asChild key={`${action.label}-${action.href}`} size="small" variant="outline">
            <a
              href={action.href}
              rel={action.target === "_blank" ? "noreferrer" : undefined}
              target={action.target}
            >
              {action.icon}
              {action.label}
            </a>
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
        <>
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
          {downloadFailed ? (
            <TypographySmall as="p" className="file-viewer-download-error" role="alert">
              Unable to download {download.filename}. Try again.
            </TypographySmall>
          ) : null}
        </>
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
    </div>
  );
}
