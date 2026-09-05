import { Moon, Sun } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

/**
 * @returns A sun/moon button for switching between light and dark.
 */
export function ThemeSwitcher(): ReactNode {
  const { nextScheme, toggleScheme, scheme } = useTheme();
  const label = `Switch to ${nextScheme.colorScheme} theme`;

  return (
    <Button
      aria-label={label}
      className="theme-switcher"
      onClick={toggleScheme}
      size="icon"
      title={label}
      type="button"
      variant="outline"
    >
      <Moon aria-hidden="true" className="theme-switcher-moon" />
      <Sun aria-hidden="true" className="theme-switcher-sun" />
      <span className="sr-only">Current theme: {scheme.label}</span>
    </Button>
  );
}
