import { useState, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createResourceQueryClient } from "@/content/artifacts/queries";
import { ThemeProvider } from "@/features/theme/theme-provider";
import { ThemedDocument } from "./themed-document";

/**
 * @param props - Routed page content to place inside the HTML document.
 * @returns The full document markup used for SSR and hydration.
 */
export function RootDocument({ children }: Readonly<{ children: ReactNode }>): ReactNode {
  const [queryClient] = useState(createResourceQueryClient);
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ThemedDocument>{children}</ThemedDocument>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
