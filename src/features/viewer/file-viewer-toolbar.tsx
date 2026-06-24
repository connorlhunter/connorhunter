"use client";

import { Download, ExternalLink, Mail, Maximize2, Minimize2 } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TypographyH4 } from "@/components/ui/typography";
import { navigateInPlace } from "./file-viewer-navigation";
import type { FileViewerAction } from "./file-viewer-types";

interface FileViewerHeadingProps {
  readonly icon: ReactNode;
  readonly title: string;
}

interface FileViewerActionsProps {
  readonly actions: ReadonlyArray<FileViewerAction>;
  readonly downloadHref?: string | undefined;
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
  downloadHref,
  emailHref,
  fullscreen,
  onToggleFullscreen,
  openHref,
}: FileViewerActionsProps): ReactNode {
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
      {downloadHref ? (
        <Button asChild size="small" variant="secondary">
          <a download href={downloadHref}>
            <Download aria-hidden="true" className="size-4" />
            Download
          </a>
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
    </div>
  );
}
