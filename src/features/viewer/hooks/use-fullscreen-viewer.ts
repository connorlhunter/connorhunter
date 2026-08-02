import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

interface FullscreenViewerState {
  readonly enterFullscreen: () => Promise<void>;
  readonly fallbackFullscreen: boolean;
  readonly fullscreen: boolean;
  readonly toggleFullscreen: () => Promise<void>;
}

/**
 * @param viewerRef - Viewer shell element that should enter fullscreen.
 * @returns Fullscreen state and a toggle action for viewer controls.
 */
export function useFullscreenViewer(
  viewerRef: RefObject<HTMLElement | null>,
): FullscreenViewerState {
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const enteringFullscreen = useRef(false);
  const fullscreen = nativeFullscreen || fallbackFullscreen;

  useEffect(() => {
    function syncFullscreen(): void {
      const viewer = viewerRef.current;
      const activeElement = document.fullscreenElement;
      const viewerIsFullscreen = Boolean(
        viewer && activeElement && (activeElement === viewer || viewer.contains(activeElement)),
      );

      setNativeFullscreen(viewerIsFullscreen);
      if (viewerIsFullscreen) setFallbackFullscreen(false);
    }

    syncFullscreen();
    document.addEventListener("fullscreenchange", syncFullscreen);

    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [viewerRef]);

  useEffect(() => {
    if (!fallbackFullscreen) return;

    const root = document.documentElement;

    function exitOnEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") setFallbackFullscreen(false);
    }

    root.classList.add("file-viewer-fullscreen-active");
    document.addEventListener("keydown", exitOnEscape);

    return () => {
      root.classList.remove("file-viewer-fullscreen-active");
      document.removeEventListener("keydown", exitOnEscape);
    };
  }, [fallbackFullscreen]);

  const enterFullscreen = useCallback(async (): Promise<void> => {
    if (fullscreen || enteringFullscreen.current) return;

    const viewer = viewerRef.current;
    if (!viewer) return;

    enteringFullscreen.current = true;

    try {
      await viewer.requestFullscreen();
      if (document.fullscreenElement !== viewer) setFallbackFullscreen(true);
    } catch {
      setFallbackFullscreen(true);
    } finally {
      enteringFullscreen.current = false;
    }
  }, [fullscreen, viewerRef]);

  const toggleFullscreen = useCallback(async (): Promise<void> => {
    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      return;
    }

    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {}
      return;
    }

    await enterFullscreen();
  }, [enterFullscreen, fallbackFullscreen]);

  return { enterFullscreen, fallbackFullscreen, fullscreen, toggleFullscreen };
}
