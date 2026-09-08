import type { ReactNode } from "react";
import { HeadContent, Scripts } from "@tanstack/react-router";
import { themeBootstrapScript } from "@/features/theme/theme-bootstrap-script";
import { ThemeMeta } from "@/features/theme/theme-meta";
import { useTheme } from "@/features/theme/theme-provider";

/** Keeps browser chrome and the page bound to the same persistent theme. */
export function ThemedDocument({ children }: Readonly<{ children: ReactNode }>): ReactNode {
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
