"use client";

import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";
import { installFileViewerDrawerDrag } from "../drawer/file-viewer-drawer-events";
import { restoreDrawerState } from "../drawer/file-viewer-drawer-geometry";

interface UseFileViewerDrawerOptions {
  readonly drawerRef: RefObject<HTMLDivElement | null>;
  readonly handleRef: RefObject<HTMLButtonElement | null>;
  readonly stateKey?: string | undefined;
}

/**
 * @param options - Drawer and handle refs plus optional persistence key.
 * @returns Nothing; restores drawer state and installs drag, click, and resize behavior.
 */
export function useFileViewerDrawer({
  drawerRef,
  handleRef,
  stateKey,
}: UseFileViewerDrawerOptions): void {
  const draggingRef = useRef(false);

  useLayoutEffect(() => {
    const drawer = drawerRef.current;
    const handle = handleRef.current;

    if (!drawer || !handle || draggingRef.current) {
      return;
    }

    restoreDrawerState(drawer, handle, stateKey);
  });

  useEffect(() => {
    const drawer = drawerRef.current;
    const handle = handleRef.current;

    if (!drawer || !handle) {
      return;
    }

    return installFileViewerDrawerDrag({ drawer, draggingRef, handle, stateKey });
  }, [drawerRef, handleRef, stateKey]);
}
