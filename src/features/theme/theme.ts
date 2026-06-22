import { publicConfig } from "@/config/public-env";

/**
 * @description Theme scheme identifiers shared with the Artifact Generator themes.
 */
export type ThemeSchemeId =
  | "atlas"
  | "paper"
  | "citrine"
  | "harbor"
  | "midnight"
  | "onyx"
  | "rose"
  | "tide"
  | "ember"
  | "quartz";

/**
 * @property id - CSS dataset value for the theme.
 * @property label - theme label.
 */
export interface ThemeScheme {
  readonly id: ThemeSchemeId;
  readonly label: string;
}

/**
 * @description Default light theme before saved or OS preference detection.
 */
export const defaultLightThemeScheme: ThemeScheme = {
  id: "atlas",
  label: "Atlas",
};

/**
 * @description Default dark theme before saved theme detection.
 */
export const defaultDarkThemeScheme: ThemeScheme = {
  id: "midnight",
  label: "Midnight",
};

/**
 * @description Initial light theme used during SSR before browser preference detection.
 */
export const defaultThemeScheme = defaultLightThemeScheme;

/**
 * @description Ordered theme cycle imported from the Artifact Generator theme system.
 */
export const themeSchemes: ReadonlyArray<ThemeScheme> = [
  defaultLightThemeScheme,
  { id: "paper", label: "Paper" },
  { id: "citrine", label: "Citrine" },
  { id: "harbor", label: "Harbor" },
  defaultDarkThemeScheme,
  { id: "onyx", label: "Onyx" },
  { id: "rose", label: "Rose" },
  { id: "tide", label: "Tide" },
  { id: "ember", label: "Ember" },
  { id: "quartz", label: "Quartz" },
];

/**
 * @description Canonical shared key for the selected theme scheme.
 */
export const themeStorageKey = `${publicConfig.appStorageNamespace}.theme.scheme`;

/**
 * @description Shared cookie name used by root-domain and subdomain products.
 */
export const themeCookieName = themeStorageKey;

/**
 * @description Cross-frame message type used to keep portfolio and artifact viewers in sync.
 */
export const themeMessageType = themeStorageKey;

/**
 * @description Root domain that can share a theme cookie with product subdomains.
 */
export const sharedThemeRootDomain = publicConfig.themeRootDomain;

/**
 * @description One-year cookie lifetime for an explicit theme preference.
 */
export const themeCookieMaxAgeSeconds = 31_536_000;

/**
 * @param value - Possible theme scheme id.
 * @returns The matching scheme, or null when the value is unknown.
 */
export function findThemeScheme(value: string | null): ThemeScheme | null {
  return themeSchemes.find((scheme) => scheme.id === value) ?? null;
}

/**
 * @param currentScheme - Current theme scheme.
 * @returns The next scheme in the configured theme cycle.
 */
export function nextThemeScheme(currentScheme: ThemeScheme): ThemeScheme {
  const index = themeSchemes.findIndex((scheme) => scheme.id === currentScheme.id);

  return themeSchemes[(index + 1) % themeSchemes.length] ?? defaultThemeScheme;
}
