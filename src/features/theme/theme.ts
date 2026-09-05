import { publicConfig } from "@/config/public-env";

/**
 * @description Two color modes, retaining the IDs understood by existing artifact viewers.
 */
export type ThemeSchemeId = "atlas" | "midnight";

/** Old saved preferences and viewer messages resolve to their original light or dark mode. */
export const legacyThemeSchemeIds: Readonly<Record<string, ThemeSchemeId>> = {
  paper: "atlas",
  citrine: "atlas",
  harbor: "midnight",
  onyx: "midnight",
  rose: "atlas",
  tide: "atlas",
  ember: "atlas",
  quartz: "atlas",
};

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
  label: "Light",
  themeColor: "#fafaf9",
};

/**
 * @description Default dark theme before saved theme detection.
 */
export const defaultDarkThemeScheme: ThemeScheme = {
  colorScheme: "dark",
  id: "midnight",
  label: "Dark",
  themeColor: "#171719",
};

/**
 * @description Initial light theme used during SSR before browser preference detection.
 */
export const defaultThemeScheme = defaultLightThemeScheme;

/**
 * @description The only selectable themes.
 */
export const themeSchemes: ReadonlyArray<ThemeScheme> = [
  defaultLightThemeScheme,
  defaultDarkThemeScheme,
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
 * @returns The matching light/dark scheme, including legacy preferences, or null.
 */
export function findThemeScheme(value: string | null): ThemeScheme | null {
  const id =
    value && Object.hasOwn(legacyThemeSchemeIds, value) ? legacyThemeSchemeIds[value] : value;
  return themeSchemes.find((scheme) => scheme.id === id) ?? null;
}

/**
 * @param currentScheme - Current theme scheme.
 * @returns The opposite color mode.
 */
export function oppositeThemeScheme(currentScheme: ThemeScheme): ThemeScheme {
  return currentScheme.colorScheme === "dark" ? defaultLightThemeScheme : defaultDarkThemeScheme;
}
