import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useFileViewerDrawer } from "./hooks/use-file-viewer-drawer";

export { clampFileViewerDrawerHeight } from "./drawer/file-viewer-drawer-measure";

interface FileViewerDrawerProps {
  readonly anchorId?: string | undefined;
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly stateKey?: string | undefined;
}

/**
 * @param props - Drawer content rendered above a file viewer frame.
 * @returns A clamped, draggable drawer for file viewer controls.
 */
export function FileViewerDrawer({
  anchorId,
  ariaLabel,
  children,
  className,
  stateKey,
}: FileViewerDrawerProps): ReactNode {
  const drawerRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLButtonElement>(null);

  useFileViewerDrawer({ drawerRef, handleRef, stateKey });

  return (
    <div
      aria-label={ariaLabel}
      className={cn("file-viewer-drawer", className)}
      data-file-viewer-drawer-anchor={anchorId}
      ref={drawerRef}
      role="group"
    >
      <div className="file-viewer-drawer-content">{children}</div>
      <button
        aria-expanded="true"
        aria-label="Collapse viewer drawer"
        className="file-viewer-drawer-handle"
        ref={handleRef}
        type="button"
      >
        <span aria-hidden="true" />
      </button>
    </div>
  );
}
