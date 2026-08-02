import { LoaderCircle } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { TypographySmall } from "@/components/ui/typography";
import { postThemeSchemeToFrame, useOptionalTheme } from "@/features/theme/theme-provider";
import { FileViewerActions, FileViewerHeading } from "./file-viewer-toolbar";
import type { FileViewerAction, FileViewerDownload } from "./file-viewer-types";
import { useFullscreenViewer } from "./hooks/use-fullscreen-viewer";

export { navigateInPlace } from "./file-viewer-navigation";
export type { FileViewerAction, FileViewerDownload } from "./file-viewer-types";

interface FileViewerProps {
  readonly actions?: ReadonlyArray<FileViewerAction>;
  readonly ariaLabel: string;
  readonly children?: ReactNode;
  readonly download?: FileViewerDownload | undefined;
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
  download,
  emailHref,
  iframeTitle,
  icon,
  onFrameLoad,
  openHref,
  renderHeader,
  sourceHref,
  title,
}: FileViewerProps): ReactNode {
  const [frameSourceHref, setFrameSourceHref] = useState<string | undefined>(undefined);
  const viewerRef = useRef<HTMLDivElement>(null);
  const [frameLoading, setFrameLoading] = useState(Boolean(sourceHref));
  const theme = useOptionalTheme();
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
      download={download}
      emailHref={emailHref}
      fullscreen={fullscreen}
      onToggleFullscreen={() => {
        void toggleFullscreen();
      }}
      openHref={resolvedOpenHref}
    />
  );

  useEffect(() => {
    if (!sourceHref) {
      setFrameLoading(false);
      setFrameSourceHref(undefined);
      return;
    }

    setFrameLoading(true);
    setFrameSourceHref(sourceHref);
  }, [sourceHref]);

  function handleFrameLoad(frame: HTMLIFrameElement, loadedHref: string): void {
    if (loadedHref !== sourceHref) return;

    if (theme) {
      postThemeSchemeToFrame(frame, theme.scheme);
    }

    onFrameLoad?.(frame);
    setFrameLoading(false);
  }

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

      <div aria-busy={sourceHref ? frameLoading : undefined} className={frameWrapClassName}>
        {sourceHref ? (
          <>
            {frameSourceHref === sourceHref ? (
              <iframe
                className="file-viewer-frame"
                data-loaded={!frameLoading}
                key={frameSourceHref}
                onLoad={(event) => handleFrameLoad(event.currentTarget, frameSourceHref)}
                src={frameSourceHref}
                title={iframeTitle ?? title}
              />
            ) : null}
            {frameLoading ? (
              <TypographySmall as="p" className="file-viewer-frame-loading" role="status">
                <LoaderCircle aria-hidden="true" className="file-viewer-frame-loading-icon" />
                Loading {title}
              </TypographySmall>
            ) : null}
          </>
        ) : (
          <div className="file-viewer-content">{children}</div>
        )}
      </div>
    </section>
  );
}
