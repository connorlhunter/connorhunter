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
 * @property colorScheme - Browser chrome and native control color mode.
 * @property id - CSS dataset value for the theme.
 * @property label - Theme label.
 * @property themeColor - Page background advertised to browser chrome.
 */
export interface ThemeScheme {
  readonly colorScheme: "dark" | "light";
  readonly id: ThemeSchemeId;
  readonly label: string;
  readonly themeColor: string;
}

/**
 * @description Default light theme before saved or OS preference detection.
 */
export const defaultLightThemeScheme: ThemeScheme = {
  colorScheme: "light",
  id: "atlas",
  label: "Atlas",
  themeColor: "#f4f6f8",
};

/**
 * @description Default dark theme before saved theme detection.
 */
export const defaultDarkThemeScheme: ThemeScheme = {
  colorScheme: "dark",
  id: "midnight",
  label: "Midnight",
  themeColor: "#06111a",
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
  { colorScheme: "light", id: "paper", label: "Paper", themeColor: "#f6f6f3" },
  { colorScheme: "light", id: "citrine", label: "Citrine", themeColor: "#f7f6ea" },
  { colorScheme: "dark", id: "harbor", label: "Harbor", themeColor: "#111a24" },
  defaultDarkThemeScheme,
  { colorScheme: "dark", id: "onyx", label: "Onyx", themeColor: "#0b0d10" },
  { colorScheme: "light", id: "rose", label: "Rose", themeColor: "#fbf6f7" },
  { colorScheme: "light", id: "tide", label: "Tide", themeColor: "#f2f8fb" },
  { colorScheme: "light", id: "ember", label: "Ember", themeColor: "#fff7e8" },
  { colorScheme: "light", id: "quartz", label: "Quartz", themeColor: "#f7f5fb" },
];

/**
 * @description Metadata name Safari and supporting browsers use to tint their chrome.
 */
export const themeColorMetaName = "theme-color";

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
