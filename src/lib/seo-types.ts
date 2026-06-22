export interface HeadMeta {
  [key: string]: unknown;
}

export interface HeadLink {
  "data-icon-standard"?: string;
  "data-theme-icon"?: string;
  href: string;
  rel: string;
  type?: string;
}

/**
 * @property links - Link descriptors for router head output.
 * @property meta - Meta descriptors for router head output.
 */
export interface HeadConfig {
  links: Array<HeadLink>;
  meta: Array<HeadMeta>;
}
