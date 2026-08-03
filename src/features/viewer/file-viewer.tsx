import { LoaderCircle, Minimize2 } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TypographySmall } from "@/components/ui/typography";
import { postThemeSchemeToFrame, useOptionalTheme } from "@/features/theme/theme-provider";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import { FileViewerActions, FileViewerHeading } from "./file-viewer-toolbar";
import type { FileViewerAction, FileViewerDownload } from "./file-viewer-types";
import {
  isFileViewerFullscreenMessage,
  mobileFullscreenGestureMediaQuery,
  useFileViewerFullscreenGesture,
} from "./hooks/use-file-viewer-fullscreen-gesture";
import { useFullscreenViewer } from "./hooks/use-fullscreen-viewer";

export { navigateInPlace } from "./file-viewer-navigation";
export type { FileViewerAction, FileViewerDownload } from "./file-viewer-types";
export { fileViewerFullscreenMessageType } from "./hooks/use-file-viewer-fullscreen-gesture";

interface FileViewerProps {
  readonly actions?: ReadonlyArray<FileViewerAction>;
  readonly ariaLabel: string;
  readonly children?: ReactNode;
  readonly contentLayout?: "flow" | "viewport";
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
  contentLayout = "flow",
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const [frameLoading, setFrameLoading] = useState(Boolean(sourceHref));
  const theme = useOptionalTheme();
  const { enterFullscreen, fallbackFullscreen, fullscreen, toggleFullscreen } =
    useFullscreenViewer(viewerRef);
  const mobileFullscreenGesture = useMediaQuery(mobileFullscreenGestureMediaQuery);
  const fullscreenGesturesEnabled = mobileFullscreenGesture === false;
  const fullscreenGesture = useFileViewerFullscreenGesture(
    enterFullscreen,
    fullscreenGesturesEnabled,
  );
  const resolvedOpenHref = openHref ?? sourceHref;
  const viewportContent = Boolean(sourceHref) || contentLayout === "viewport";
  const shellClassName = cn(
    "file-viewer-shell",
    !viewportContent && "file-viewer-shell--content",
    fallbackFullscreen && "file-viewer-shell--fullscreen",
  );
  const frameWrapClassName = cn(
    "file-viewer-frame-wrap",
    !viewportContent && "file-viewer-content-wrap",
  );
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

  useEffect(() => {
    function enterFromCurrentFrame(event: MessageEvent): void {
      if (!fullscreenGesturesEnabled) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isFileViewerFullscreenMessage(event.data)) return;
      void enterFullscreen();
    }

    window.addEventListener("message", enterFromCurrentFrame);
    return () => window.removeEventListener("message", enterFromCurrentFrame);
  }, [enterFullscreen, fullscreenGesturesEnabled]);

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

      <div
        aria-busy={sourceHref ? frameLoading : undefined}
        className={frameWrapClassName}
        onDoubleClick={fullscreenGesture.onDoubleClick}
        onPointerUp={fullscreenGesture.onPointerUp}
      >
        {sourceHref ? (
          <>
            {frameSourceHref === sourceHref ? (
              <iframe
                allowFullScreen={fullscreenGesturesEnabled}
                className="file-viewer-frame"
                data-loaded={!frameLoading}
                key={frameSourceHref}
                onLoad={(event) => handleFrameLoad(event.currentTarget, frameSourceHref)}
                ref={frameRef}
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
          <div
            className={cn(
              "file-viewer-content",
              contentLayout === "viewport" && "file-viewer-content--viewport",
            )}
          >
            {children}
          </div>
        )}
      </div>
      {fallbackFullscreen ? (
        <Button
          aria-label="Exit full screen"
          className="file-viewer-gesture-exit"
          onClick={() => {
            void toggleFullscreen();
          }}
          size="icon"
          title="Exit full screen"
          type="button"
          variant="outline"
        >
          <Minimize2 aria-hidden="true" className="size-4" />
        </Button>
      ) : null}
    </section>
  );
}
