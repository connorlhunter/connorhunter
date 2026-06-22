"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { TypographySmall } from "@/components/ui/typography";
import type { NavigationItem, PortfolioContent } from "@/content/schema";
import { ThemeSwitcher } from "@/features/theme/theme-switcher";
import { cn } from "@/lib/cn";

interface SiteHeaderProps {
  readonly navigation: ReadonlyArray<NavigationItem>;
  readonly profile: PortfolioContent["profile"];
}

/**
 * @param props - Navigation records, label, optional class names, and mobile close callback.
 * @returns A labelled navigation group for desktop or mobile placement.
 */
function NavLinks({
  className,
  label = "Main navigation",
  navigation,
  onNavigate,
}: {
  readonly className?: string;
  readonly label?: string;
  readonly navigation: ReadonlyArray<NavigationItem>;
  readonly onNavigate?: () => void;
}): ReactNode {
  return (
    <nav aria-label={label} className={className}>
      {navigation.map((item) => (
        <a
          className="rounded-md px-3 py-2 text-sm font-semibold text-(--muted) transition-colors hover:bg-(--accent-soft) hover:text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
          href={item.href}
          key={item.href}
          onClick={onNavigate}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}

/**
 * @param props - Navigation records and profile brand content.
 * @returns The responsive site header.
 */
export function SiteHeader({ navigation, profile }: SiteHeaderProps): ReactNode {
  const [menuOpen, setMenuOpen] = useState(false);
  const hasNavigation = navigation.length > 0;
  const brandClassName =
    "min-w-0 rounded-md font-bold text-(--text) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)";
  const mobileMenuId = "site-mobile-navigation";

  return (
    <header className="site-header sticky top-0 z-50 border-b border-(--border) backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
        {hasNavigation ? (
          <a className={brandClassName} href="/">
            <span className="block truncate">{profile.name}</span>
            <TypographySmall className="block text-xs">{profile.role}</TypographySmall>
          </a>
        ) : (
          <span className={brandClassName}>
            <span className="block truncate">{profile.name}</span>
            <TypographySmall className="block text-xs">{profile.role}</TypographySmall>
          </span>
        )}

        {hasNavigation ? (
          <NavLinks className="hidden items-center gap-1 md:flex" navigation={navigation} />
        ) : null}

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          {hasNavigation ? (
            <Button
              aria-controls={mobileMenuId}
              aria-expanded={menuOpen}
              aria-label="Toggle navigation menu"
              className="overflow-hidden md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              size="icon"
              type="button"
              variant="outline"
            >
              <span className="relative size-4">
                <Menu
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 size-4 transform-gpu transition-[opacity,transform] duration-200",
                    menuOpen ? "rotate-90 scale-75 opacity-0" : "rotate-0 scale-100 opacity-100",
                  )}
                />
                <X
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-0 size-4 transform-gpu transition-[opacity,transform] duration-200",
                    menuOpen ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-75 opacity-0",
                  )}
                />
              </span>
            </Button>
          ) : null}
        </div>
      </div>

      {hasNavigation ? (
        <div
          aria-hidden={!menuOpen}
          className={cn(
            "mobile-nav-popover md:hidden",
            menuOpen ? "mobile-nav-popover--open" : undefined,
          )}
          id={mobileMenuId}
        >
          <NavLinks
            className="mobile-nav-popover-links mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:px-8"
            label="Mobile navigation"
            navigation={navigation}
            onNavigate={() => setMenuOpen(false)}
          />
        </div>
      ) : null}
    </header>
  );
}
