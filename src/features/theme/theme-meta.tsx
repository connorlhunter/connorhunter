import { useEffect, useState, type ReactNode } from "react";
import { findThemeScheme, themeColorMetaName } from "./theme";
import { useTheme } from "./theme-provider";

/** Keeps the browser's theme metadata aligned with the selected scheme. */
export function ThemeMeta(): ReactNode {
  const { scheme } = useTheme();
  // React matches hoisted meta tags by content, which the first-paint script may have changed.
  const [bootstrapScheme, setBootstrapScheme] = useState(() =>
    typeof document === "undefined"
      ? null
      : findThemeScheme(document.documentElement.dataset.scheme ?? null),
  );
  useEffect(() => setBootstrapScheme(null), []);
  const current = bootstrapScheme ?? scheme;

  return (
    <>
      <meta content={current.themeColor} name={themeColorMetaName} />
      <meta content={current.colorScheme} name="color-scheme" />
    </>
  );
}
