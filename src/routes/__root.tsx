import type { ReactNode } from "react";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { publicConfig } from "@/config/public-env";
import { clearPortfolioContentCache, getPortfolioContent } from "@/content";
import { fallbackShellContent } from "@/content/fallback-shell";
import { ErrorPage } from "@/features/error/error-page";
import { NotFoundPage } from "@/features/not-found/not-found-page";
import { themeBootstrapScript } from "@/features/theme/theme-bootstrap-script";
import "../styles.css";

/**
 * @description Root route that provides shared head tags, content loading, and route fallbacks.
 */
export const Route = createRootRoute({
  loader: () => getPortfolioContent(),
  head: () => ({
    links: [
      {
        "data-icon-standard": publicConfig.siteIconPath,
        "data-theme-icon": "",
        href: publicConfig.siteIconPath,
        rel: "icon",
        type: "image/svg+xml",
      },
      {
        "data-icon-standard": publicConfig.siteIconPath,
        "data-theme-icon": "",
        href: publicConfig.siteIconPath,
        rel: "apple-touch-icon",
      },
      {
        "data-icon-standard": publicConfig.siteMaskIconPath,
        "data-theme-icon": "",
        href: publicConfig.siteMaskIconPath,
        rel: "mask-icon",
        type: "image/svg+xml",
      },
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1", name: "viewport" },
    ],
  }),
  component: RootComponent,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});

/**
 * @returns The root outlet wrapped in the shared HTML document shell.
 */
function RootComponent(): ReactNode {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

/**
 * @returns The route-level not-found fallback inside the root document shell.
 */
function RootNotFoundComponent(): ReactNode {
  const content = Route.useLoaderData();

  return (
    <RootDocument>
      <NotFoundPage content={content} />
    </RootDocument>
  );
}

/**
 * @returns The route-level error fallback with a cache-clearing retry action.
 */
function RootErrorComponent(): ReactNode {
  const router = useRouter();

  function retry(): void {
    clearPortfolioContentCache();
    void router.invalidate();
  }

  return (
    <RootDocument>
      <ErrorPage content={fallbackShellContent} onRetry={retry} />
    </RootDocument>
  );
}

/**
 * @param props - Routed page content to place inside the HTML document.
 * @returns The full document markup used for SSR and hydration.
 */
function RootDocument({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  return (
    <html data-scheme="atlas" lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        {/* Intentionally inline so the theme is applied before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
