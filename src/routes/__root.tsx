import { createRootRoute, Outlet } from "@tanstack/react-router";
import { publicConfig } from "@/config/public-env";
import { getPortfolioContent } from "@/content";
import { RootDocument } from "@/features/shell/root-document";
import { RootErrorComponent } from "@/features/shell/root-error";
import { RootNotFoundComponent } from "@/features/shell/root-not-found";
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
  shellComponent: RootDocument,
  component: Outlet,
  errorComponent: RootErrorComponent,
  notFoundComponent: RootNotFoundComponent,
});
