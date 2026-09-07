import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createResourceQueryClient } from "@/content/artifacts/queries";
import { createRootRoute, HeadContent, Outlet, Scripts, useRouter } from "@tanstack/react-router";
import { publicConfig } from "@/config/public-env";
import { clearPortfolioContentCache, getPortfolioContent } from "@/content";
import { fallbackShellContent } from "@/content/fallback-shell";
import { ErrorPage } from "@/features/error/error-page";
import { NotFoundPage } from "@/features/not-found/not-found-page";
import { themeBootstrapScript } from "@/features/theme/theme-bootstrap-script";
import { ThemeMeta } from "@/features/theme/theme-meta";
import { ThemeProvider, useTheme } from "@/features/theme/theme-provider";
import "../styles.css";

/**
 * @description Root route that provides shared head tags, content loading, and route fallbacks.
 */
export const Route = createRootRoute({
  loader: () => getPortfolioContent(),
  head: () => ({
    links: [
      {
        crossOrigin: "anonymous",
        "data-icon-standard": publicConfig.siteIconPath,
        "data-theme-icon": "",
        href: publicConfig.siteIconPath,
        rel: "icon",
        type: "image/svg+xml",
      },
      {
        crossOrigin: "anonymous",
        "data-icon-standard": publicConfig.siteIconPath,
        "data-theme-icon": "",
        href: publicConfig.siteIconPath,
        rel: "apple-touch-icon",
      },
      {
        crossOrigin: "anonymous",
        "data-icon-standard": publicConfig.siteMaskIconPath,
        "data-theme-icon": "",
        href: publicConfig.siteMaskIconPath,
        rel: "mask-icon",
        type: "image/svg+xml",
      },
    ],
    meta: [
      { charSet: "utf-8" },
      { content: "width=device-width, initial-scale=1, viewport-fit=cover", name: "viewport" },
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
  const [queryClient] = useState(createResourceQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedDocument>{children}</ThemedDocument>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

/** Keeps browser chrome and the page bound to the same persistent theme. */
function ThemedDocument({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const { scheme } = useTheme();

  return (
    <html
      data-scheme={scheme.id}
      lang="en"
      style={{ colorScheme: scheme.colorScheme }}
      suppressHydrationWarning
    >
      <head>
        <ThemeMeta />
        {/* Intentionally inline so the theme is applied before first paint. */}
        <script
          dangerouslySetInnerHTML={{
            __html: themeBootstrapScript,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
