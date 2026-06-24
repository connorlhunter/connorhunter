import { Palette } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./theme-provider";

/**
 * @returns The header button that cycles through available theme schemes.
 */
export function ThemeSwitcher(): ReactNode {
  const { nextScheme, cycleScheme, scheme } = useTheme();

  return (
    <Button
      aria-label={`Use ${nextScheme.label} color scheme`}
      className="group"
      onClick={cycleScheme}
      size="icon"
      title={`Use ${nextScheme.label} color scheme`}
      type="button"
      variant="outline"
    >
      <Palette aria-hidden="true" className="size-4" />
      <span
        aria-hidden="true"
        className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-(--accent) ring-2 ring-(--panel)"
      />
      <span className="sr-only">Current scheme: {scheme.label}</span>
    </Button>
  );
}
