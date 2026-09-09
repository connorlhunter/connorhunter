import type { ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { clearPortfolioContentCache } from "@/content";
import { fallbackShellContent } from "@/content/fallback-shell";
import { ErrorPage } from "@/features/error/error-page";

/**
 * @returns The route-level error fallback with a cache-clearing retry action.
 */
export function RootErrorComponent(): ReactNode {
  const router = useRouter();

  function retry(): void {
    clearPortfolioContentCache();
    void router.invalidate();
  }

  return <ErrorPage content={fallbackShellContent} onRetry={retry} />;
}
