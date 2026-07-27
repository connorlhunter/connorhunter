import type { ReactNode } from "react";

export interface FileViewerAction {
  readonly href?: string;
  readonly icon: ReactNode;
  readonly to?: string;
  readonly label: string;
  readonly target?: "_blank" | "_self";
}

/**
 * @description A file that the viewer can download with a stable file name.
 */
export interface FileViewerDownload {
  readonly filename: string;
  readonly href: string;
}
