import {
  useCallback,
  useRef,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

export const fileViewerFullscreenMessageType = "connorhunter.file-viewer.enter-fullscreen";

const doubleTapDelay = 360;
const doubleTapDistance = 28;
const interactiveSelector =
  'a, button, input, select, textarea, summary, [role="button"], [contenteditable="true"], [data-fullscreen-gesture-ignore]';

interface TapPoint {
  readonly at: number;
  readonly x: number;
  readonly y: number;
}

interface FileViewerFullscreenGestureHandlers {
  readonly onDoubleClick: (event: ReactMouseEvent<HTMLElement>) => void;
  readonly onPointerUp: (event: ReactPointerEvent<HTMLElement>) => void;
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof window.Element && Boolean(target.closest(interactiveSelector));
}

/**
 * @param value - Potential cross-frame fullscreen request.
 * @returns Whether the message is the viewer fullscreen gesture payload.
 */
export function isFileViewerFullscreenMessage(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  return (value as { readonly type?: unknown }).type === fileViewerFullscreenMessageType;
}

/**
 * @param enterFullscreen - Idempotent fullscreen entry action.
 * @returns Mouse and touch handlers for a host-rendered viewer surface.
 */
export function useFileViewerFullscreenGesture(
  enterFullscreen: () => Promise<void>,
): FileViewerFullscreenGestureHandlers {
  const lastTouch = useRef<TapPoint | null>(null);
  const suppressDoubleClickUntil = useRef(0);

  const onDoubleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>): void => {
      if (event.timeStamp <= suppressDoubleClickUntil.current) {
        suppressDoubleClickUntil.current = 0;
        return;
      }

      if (isInteractiveTarget(event.target)) return;

      event.preventDefault();
      void enterFullscreen();
    },
    [enterFullscreen],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>): void => {
      if (event.pointerType !== "touch") return;

      if (isInteractiveTarget(event.target)) {
        lastTouch.current = null;
        return;
      }

      const currentTouch = { at: event.timeStamp, x: event.clientX, y: event.clientY };
      const previousTouch = lastTouch.current;
      const elapsed = previousTouch ? currentTouch.at - previousTouch.at : Number.POSITIVE_INFINITY;
      const distance = previousTouch
        ? Math.hypot(currentTouch.x - previousTouch.x, currentTouch.y - previousTouch.y)
        : Number.POSITIVE_INFINITY;

      if (elapsed >= 0 && elapsed <= doubleTapDelay && distance <= doubleTapDistance) {
        lastTouch.current = null;
        suppressDoubleClickUntil.current = currentTouch.at + doubleTapDelay;
        event.preventDefault();
        void enterFullscreen();
        return;
      }

      lastTouch.current = currentTouch;
    },
    [enterFullscreen],
  );

  return { onDoubleClick, onPointerUp };
}
