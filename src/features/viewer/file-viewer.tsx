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

interface FileViewerFrameState {
  readonly frameLoading: boolean;
  readonly frameSourceHref: string | undefined;
  readonly setFrameLoading: (loading: boolean) => void;
}

function useFileViewerFrameSource(sourceHref: string | undefined): FileViewerFrameState {
  const [frameSourceHref, setFrameSourceHref] = useState<string | undefined>(undefined);
  const [frameLoading, setFrameLoading] = useState(Boolean(sourceHref));

  useEffect(() => {
    if (!sourceHref) {
      setFrameLoading(false);
      setFrameSourceHref(undefined);
      return;
    }

    setFrameLoading(true);
    setFrameSourceHref(sourceHref);
  }, [sourceHref]);

  return { frameLoading, frameSourceHref, setFrameLoading };
}

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
  frameSourceHref,
  fullscreenGesturesEnabled,
  iframeTitle,
  onFrameLoad,
  sourceHref,
  title,
}: {
  readonly frameLoading: boolean;
  readonly frameRef: { readonly current: HTMLIFrameElement | null };
  readonly frameSourceHref: string | undefined;
  readonly fullscreenGesturesEnabled: boolean;
  readonly iframeTitle: string | undefined;
  readonly onFrameLoad: (frame: HTMLIFrameElement, loadedHref: string) => void;
  readonly sourceHref: string;
  readonly title: string;
}): ReactNode {
  const frame =
    frameSourceHref === sourceHref ? (
      <iframe
        allowFullScreen={fullscreenGesturesEnabled}
        className="file-viewer-frame"
        data-loaded={!frameLoading}
        key={frameSourceHref}
        onLoad={(event) => onFrameLoad(event.currentTarget, frameSourceHref)}
        ref={frameRef}
        src={frameSourceHref}
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
  frameLoading,
  frameRef,
  frameSourceHref,
  frameWrapClassName,
  fullscreenGesture,
  fullscreenGesturesEnabled,
  iframeTitle,
  onFrameLoad,
  sourceHref,
  title,
}: Pick<FileViewerProps, "children" | "contentLayout" | "iframeTitle" | "sourceHref" | "title"> & {
  readonly frameLoading: boolean;
  readonly frameRef: { readonly current: HTMLIFrameElement | null };
  readonly frameSourceHref: string | undefined;
  readonly frameWrapClassName: string;
  readonly fullscreenGesture: {
    readonly onDoubleClick: (event: React.MouseEvent<HTMLElement>) => void;
    readonly onPointerUp: (event: React.PointerEvent<HTMLElement>) => void;
  };
  readonly fullscreenGesturesEnabled: boolean;
  readonly onFrameLoad: (frame: HTMLIFrameElement, loadedHref: string) => void;
}): ReactNode {
  const content = sourceHref ? (
    <FileViewerIframe
      frameLoading={frameLoading}
      frameRef={frameRef}
      frameSourceHref={frameSourceHref}
      fullscreenGesturesEnabled={fullscreenGesturesEnabled}
      iframeTitle={iframeTitle}
      onFrameLoad={onFrameLoad}
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
  const frameRef = useRef<HTMLIFrameElement>(null);
  const viewerRef = useRef<HTMLElement>(null);
  const { frameLoading, frameSourceHref, setFrameLoading } = useFileViewerFrameSource(sourceHref);
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
    if (loadedHref !== sourceHref) return;

    if (theme) {
      postThemeSchemeToFrame(frame, theme.scheme);
    }

    onFrameLoad?.(frame);
    setFrameLoading(false);
  }

  return (
    <section aria-label={ariaLabel} className={classNames.shell} ref={viewerRef}>
      <FileViewerHeader actions={actionControls} heading={heading} renderHeader={renderHeader} />
      <FileViewerContent
        contentLayout={contentLayout}
        frameLoading={frameLoading}
        frameRef={frameRef}
        frameSourceHref={frameSourceHref}
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
