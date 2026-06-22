"use client";

import { useRef, type ReactNode } from "react";
import { FileViewerActions, FileViewerHeading } from "./file-viewer-toolbar";
import type { FileViewerAction } from "./file-viewer-types";
import { useFullscreenViewer } from "./hooks/use-fullscreen-viewer";

export { navigateInPlace } from "./file-viewer-navigation";
export type { FileViewerAction } from "./file-viewer-types";

interface FileViewerProps {
  readonly actions?: ReadonlyArray<FileViewerAction>;
  readonly ariaLabel: string;
  readonly children?: ReactNode;
  readonly downloadHref?: string | undefined;
  readonly emailHref?: string | undefined;
  readonly iframeTitle?: string | undefined;
  readonly icon: ReactNode;
  readonly onFrameLoad?: ((frame: HTMLIFrameElement) => void) | undefined;
  readonly openHref?: string | undefined;
  readonly renderHeader?:
    | ((props: { readonly actions: ReactNode; readonly heading: ReactNode }) => ReactNode)
    | undefined;
  readonly sourceHref?: string | undefined;
  readonly title: string;
}

/**
 * @param props - Shared file or document viewer content and toolbar actions.
 * @returns A reusable viewer shell with resume-style actions and fullscreen support.
 */
export function FileViewer({
  actions = [],
  ariaLabel,
  children,
  downloadHref,
  emailHref,
  iframeTitle,
  icon,
  onFrameLoad,
  openHref,
  renderHeader,
  sourceHref,
  title,
}: FileViewerProps): ReactNode {
  const viewerRef = useRef<HTMLDivElement>(null);
  const { fullscreen, toggleFullscreen } = useFullscreenViewer(viewerRef);
  const resolvedOpenHref = openHref ?? sourceHref;
  const shellClassName = sourceHref
    ? "file-viewer-shell"
    : "file-viewer-shell file-viewer-shell--content";
  const frameWrapClassName = sourceHref
    ? "file-viewer-frame-wrap"
    : "file-viewer-frame-wrap file-viewer-content-wrap";
  const heading = <FileViewerHeading icon={icon} title={title} />;
  const actionControls = (
    <FileViewerActions
      actions={actions}
      downloadHref={downloadHref}
      emailHref={emailHref}
      fullscreen={fullscreen}
      onToggleFullscreen={() => {
        void toggleFullscreen();
      }}
      openHref={resolvedOpenHref}
    />
  );

  return (
    <section aria-label={ariaLabel} className={shellClassName} ref={viewerRef}>
      {renderHeader ? (
        renderHeader({ actions: actionControls, heading })
      ) : (
        <div className="file-viewer-toolbar">
          {heading}
          {actionControls}
        </div>
      )}

      <div className={frameWrapClassName}>
        {sourceHref ? (
          <iframe
            className="file-viewer-frame"
            onLoad={(event) => onFrameLoad?.(event.currentTarget)}
            src={sourceHref}
            title={iframeTitle ?? title}
          />
        ) : (
          <div className="file-viewer-content">{children}</div>
        )}
      </div>
    </section>
  );
}
