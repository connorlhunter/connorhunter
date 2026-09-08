import { useHydrated } from "@tanstack/react-router";
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

const emptyActions: ReadonlyArray<FileViewerAction> = [];

function useFrameFullscreenMessages(
  frameRef: { readonly current: HTMLIFrameElement | null },
  enabled: boolean,
  enterFullscreen: () => Promise<void>,
): void {
  useEffect(() => {
    function enterFromCurrentFrame(event: MessageEvent): void {
      if (!enabled) return;
      if (event.source !== frameRef.current?.contentWindow) return;
      if (!isFileViewerFullscreenMessage(event.data)) return;
      void enterFullscreen();
    }

    window.addEventListener("message", enterFromCurrentFrame);
    return () => window.removeEventListener("message", enterFromCurrentFrame);
  }, [enabled, enterFullscreen, frameRef]);
}

function fileViewerClassNames(
  sourceHref: string | undefined,
  contentLayout: "flow" | "viewport",
  fallbackFullscreen: boolean,
): { readonly frameWrap: string; readonly shell: string } {
  const viewportContent = sourceHref !== undefined || contentLayout === "viewport";

  return {
    frameWrap: cn("file-viewer-frame-wrap", !viewportContent && "file-viewer-content-wrap"),
    shell: cn(
      "file-viewer-shell",
      !viewportContent && "file-viewer-shell--content",
      fallbackFullscreen && "file-viewer-shell--fullscreen",
    ),
  };
}

function FileViewerHeader({
  actions,
  heading,
  renderHeader,
}: Pick<FileViewerProps, "renderHeader"> & {
  readonly actions: ReactNode;
  readonly heading: ReactNode;
}): ReactNode {
  if (renderHeader) {
    return renderHeader({ actions, heading });
  }

  return (
    <div className="file-viewer-toolbar">
      {heading}
      {actions}
    </div>
  );
}

function FileViewerIframe({
  frameLoading,
  frameRef,
  fullscreenGesturesEnabled,
  iframeTitle,
  onFrameLoad,
  sourceHref,
  title,
}: {
  readonly frameLoading: boolean;
  readonly frameRef: { readonly current: HTMLIFrameElement | null };
  readonly fullscreenGesturesEnabled: boolean;
  readonly iframeTitle: string | undefined;
  readonly onFrameLoad: (frame: HTMLIFrameElement, loadedHref: string) => void;
  readonly sourceHref: string;
  readonly title: string;
}): ReactNode {
  const hydrated = useHydrated();
  const frame = hydrated ? (
    <iframe
      allowFullScreen={fullscreenGesturesEnabled}
      className="file-viewer-frame"
      data-loaded={!frameLoading}
      onLoad={(event) => onFrameLoad(event.currentTarget, sourceHref)}
      ref={frameRef}
      src={sourceHref}
      sandbox="allow-scripts allow-downloads allow-popups"
      title={iframeTitle ?? title}
    />
  ) : null;
  const loading = frameLoading ? (
    <TypographySmall as="p" className="file-viewer-frame-loading" role="status">
      <LoaderCircle aria-hidden="true" className="file-viewer-frame-loading-icon" />
      Loading {title}
    </TypographySmall>
  ) : null;

  return (
    <>
      {frame}
      {loading}
    </>
  );
}

function FileViewerContent({
  children,
  contentLayout,
  frameRef,
  frameWrapClassName,
  fullscreenGesture,
  fullscreenGesturesEnabled,
  iframeTitle,
  onFrameLoad,
  sourceHref,
  title,
}: Pick<FileViewerProps, "children" | "contentLayout" | "iframeTitle" | "sourceHref" | "title"> & {
  readonly frameRef: { readonly current: HTMLIFrameElement | null };
  readonly frameWrapClassName: string;
  readonly fullscreenGesture: {
    readonly onDoubleClick: (event: React.MouseEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  };
  readonly fullscreenGesturesEnabled: boolean;
  readonly onFrameLoad: (frame: HTMLIFrameElement, loadedHref: string) => void;
}): ReactNode {
  const [frameLoading, setFrameLoading] = useState(Boolean(sourceHref));
  const content = sourceHref ? (
    <FileViewerIframe
      frameLoading={frameLoading}
      frameRef={frameRef}
      fullscreenGesturesEnabled={fullscreenGesturesEnabled}
      iframeTitle={iframeTitle}
      onFrameLoad={(frame, loadedHref) => {
        onFrameLoad(frame, loadedHref);
        setFrameLoading(false);
      }}
      sourceHref={sourceHref}
      title={title}
    />
  ) : (
    <div
      className={cn(
        "file-viewer-content",
        contentLayout === "viewport" && "file-viewer-content--viewport",
      )}
    >
      {children}
    </div>
  );

  return (
    <div
      aria-busy={sourceHref ? frameLoading : undefined}
      className={frameWrapClassName}
      onDoubleClick={fullscreenGesture.onDoubleClick}
      onPointerUp={fullscreenGesture.onPointerUp}
    >
      {content}
    </div>
  );
}

function FileViewerFullscreenExit({
  fallbackFullscreen,
  onToggleFullscreen,
}: {
  readonly fallbackFullscreen: boolean;
  readonly onToggleFullscreen: () => void;
}): ReactNode {
  if (!fallbackFullscreen) {
    return null;
  }

  return (
    <Button
      aria-label="Exit full screen"
      className="file-viewer-gesture-exit"
      onClick={onToggleFullscreen}
      size="icon"
      title="Exit full screen"
      type="button"
      variant="outline"
    >
      <Minimize2 aria-hidden="true" className="size-4" />
    </Button>
  );
}

/**
 * @param props - Shared file or document viewer content and toolbar actions.
 * @returns A reusable viewer shell with resume-style actions and fullscreen support.
 */
export function FileViewer({
  actions = emptyActions,
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const theme = useOptionalTheme();
  const { enterFullscreen, fallbackFullscreen, fullscreen, toggleFullscreen } =
    useFullscreenViewer(viewerRef);
  const mobileFullscreenGesture = useMediaQuery(mobileFullscreenGestureMediaQuery);
  const fullscreenGesturesEnabled = mobileFullscreenGesture === false;
  const fullscreenGesture = useFileViewerFullscreenGesture(
    enterFullscreen,
    fullscreenGesturesEnabled,
  );
  useFrameFullscreenMessages(frameRef, fullscreenGesturesEnabled, enterFullscreen);
  const resolvedOpenHref = openHref ?? sourceHref;
  const classNames = fileViewerClassNames(sourceHref, contentLayout, fallbackFullscreen);
  const heading = <FileViewerHeading icon={icon} title={title} />;
  const actionControls = (
    <FileViewerActions
      key={JSON.stringify([download?.href, download?.filename])}
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

  function handleFrameLoad(frame: HTMLIFrameElement, loadedHref: string): void {
    if (loadedHref !== sourceHref || frame !== frameRef.current) return;

    if (theme) {
      postThemeSchemeToFrame(frame, theme.scheme);
    }

    onFrameLoad?.(frame);
  }

  return (
    <section aria-label={ariaLabel} className={classNames.shell} ref={viewerRef}>
      <FileViewerHeader actions={actionControls} heading={heading} renderHeader={renderHeader} />
      <FileViewerContent
        key={sourceHref}
        contentLayout={contentLayout}
        frameRef={frameRef}
        frameWrapClassName={classNames.frameWrap}
        fullscreenGesture={fullscreenGesture}
        fullscreenGesturesEnabled={fullscreenGesturesEnabled}
        iframeTitle={iframeTitle}
        onFrameLoad={handleFrameLoad}
        sourceHref={sourceHref}
        title={title}
      >
        {children}
      </FileViewerContent>
      <FileViewerFullscreenExit
        fallbackFullscreen={fallbackFullscreen}
        onToggleFullscreen={() => {
          void toggleFullscreen();
        }}
      />
    </section>
  );
}
