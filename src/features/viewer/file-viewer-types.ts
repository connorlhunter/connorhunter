import type { ReactNode } from "react";

export interface FileViewerAction {
  readonly href?: string;
  readonly icon: ReactNode;
  readonly to?: string;
  readonly label: string;
  readonly target?: "_blank" | "_self";
}
