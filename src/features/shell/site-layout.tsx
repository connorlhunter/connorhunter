"use client";

import { MotionConfig } from "motion/react";
import type { ReactNode } from "react";
import type { PortfolioContent } from "@/content/schema";
import { Footer } from "./footer";
import { SiteHeader } from "./site-header";
import { ThemeIconSync } from "@/features/theme/theme-icon";
import { ThemeProvider } from "@/features/theme/theme-provider";

/**
 * @description Content needed by the shared shell outside page bodies.
 */
export type SiteShellContent = Pick<
  PortfolioContent,
  "contacts" | "navigation" | "profile" | "resume"
>;

interface SiteLayoutProps {
  readonly children: ReactNode;
  readonly content: SiteShellContent;
}

/**
 * @param props - Page content and shared shell data.
 * @returns The site shell with theme, header, main content, and footer.
 */
export function SiteLayout({ children, content }: SiteLayoutProps): ReactNode {
  return (
    <ThemeProvider>
      <ThemeIconSync />
      <MotionConfig reducedMotion="user">
        <SiteHeader navigation={content.navigation} profile={content.profile} />
        <main>{children}</main>
        <Footer brandName={content.profile.name} contacts={content.contacts} />
      </MotionConfig>
    </ThemeProvider>
  );
}
