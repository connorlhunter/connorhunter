import { useEffect, useState, type RefObject } from "react";

interface FullscreenViewerState {
  readonly fullscreen: boolean;
  readonly toggleFullscreen: () => Promise<void>;
}

/**
 * @param viewerRef - Viewer shell element that should enter fullscreen.
 * @returns Fullscreen state and a toggle action for viewer controls.
 */
export function useFullscreenViewer(
  viewerRef: RefObject<HTMLDivElement | null>,
): FullscreenViewerState {
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    function syncFullscreen(): void {
      setFullscreen(document.fullscreenElement === viewerRef.current);
    }

    document.addEventListener("fullscreenchange", syncFullscreen);

    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [viewerRef]);

  async function toggleFullscreen(): Promise<void> {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }

    await viewerRef.current?.requestFullscreen();
  }

  return { fullscreen, toggleFullscreen };
}
