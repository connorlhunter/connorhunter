import {
  drawerHeightOptions,
  setDrawerHeight,
} from "./file-viewer-drawer-geometry";

interface DrawerResizeControllerOptions {
  readonly drawer: HTMLDivElement;
  readonly handle: HTMLButtonElement;
  readonly stateKey?: string | undefined;
}

interface DrawerResizeSnapshot {
  readonly allowAnchorCollapse: boolean;
  readonly height: number | null;
}

interface DrawerResizeController {
  cancel: () => void;
  request: (height?: number | null, snap?: boolean, allowAnchorCollapse?: boolean) => void;
  snapshot: () => DrawerResizeSnapshot;
}

/**
 * @param options - Drawer nodes and optional persisted state key.
 * @returns Resize scheduler that batches drawer height writes with animation frames.
 */
export function createDrawerResizeController({
  drawer,
  handle,
  stateKey,
}: DrawerResizeControllerOptions): DrawerResizeController {
  let magnetLockHeight: number | null = null;
  let pendingFrame = 0;
  let pendingAllowAnchorCollapse = false;
  let pendingHeight: number | null = null;
  let pendingSnap = true;

  function cancel(): void {
    if (pendingFrame) {
      window.cancelAnimationFrame(pendingFrame);
      pendingFrame = 0;
    }

    pendingHeight = null;
    pendingAllowAnchorCollapse = false;
    pendingSnap = true;
    magnetLockHeight = null;
  }

  function snapshot(): DrawerResizeSnapshot {
    return {
      allowAnchorCollapse: pendingAllowAnchorCollapse,
      height: pendingHeight,
    };
  }

  function apply(): void {
    pendingFrame = 0;

    const nextState = setDrawerHeight(
      drawer,
      handle,
      pendingHeight ?? drawer.getBoundingClientRect().height,
      undefined,
      drawerHeightOptions(
        {
          allowAnchorCollapse: pendingAllowAnchorCollapse,
          magnet: !pendingSnap,
          magnetLockHeight,
          snap: pendingSnap,
        },
        stateKey,
      ),
    );

    magnetLockHeight = nextState.magnetized ? nextState.height : null;
    pendingHeight = null;
    pendingAllowAnchorCollapse = false;
    pendingSnap = true;
  }

  function request(
    height: number | null = null,
    snap = true,
    allowAnchorCollapse = false,
  ): void {
    pendingHeight = height;
    pendingAllowAnchorCollapse = allowAnchorCollapse;
    pendingSnap = snap;

    if (pendingFrame) {
      return;
    }

    pendingFrame = window.requestAnimationFrame(apply);
  }

  return {
    cancel,
    request,
    snapshot,
  };
}
