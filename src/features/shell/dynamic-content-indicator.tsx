import { Cloud } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { TypographySmall } from "@/components/ui/typography";
import { publicConfig } from "@/config/public-env";

export const dynamicContentIndicatorStorageKey = `${publicConfig.appStorageNamespace}.dynamic-content-indicator-expanded`;

/**
 * @returns Whether the indicator was left expanded in the current browser tab.
 */
function readExpandedState(): boolean {
  try {
    return window.sessionStorage.getItem(dynamicContentIndicatorStorageKey) === "true";
  } catch {
    return false;
  }
}

/**
 * @param expanded - Current indicator state to retain across page navigation.
 */
function writeExpandedState(expanded: boolean): void {
  try {
    window.sessionStorage.setItem(dynamicContentIndicatorStorageKey, String(expanded));
  } catch {
    // The control remains functional when browser storage is unavailable.
  }
}

interface DynamicContentIndicatorProps {
  readonly description: string;
}

/**
 * @param props - Short description of the published content used by the current page.
 * @returns A collapsible content-source indicator.
 */
export function DynamicContentIndicator({ description }: DynamicContentIndicatorProps): ReactNode {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(readExpandedState());
  }, []);

  function toggleExpanded(): void {
    setExpanded((current) => {
      const next = !current;
      writeExpandedState(next);
      return next;
    });
  }

  return (
    <button
      aria-expanded={expanded}
      aria-label={expanded ? "Hide dynamic content details" : "Show dynamic content details"}
      className="dynamic-content-indicator inline-flex max-w-full cursor-pointer items-center overflow-hidden border border-(--border) text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      data-expanded={expanded}
      onClick={toggleExpanded}
      title={expanded ? "Hide dynamic content details" : "Show dynamic content details"}
      type="button"
    >
      <span aria-hidden={!expanded} className="dynamic-content-copy">
        <span className="dynamic-content-copy-inner">
          <TypographySmall className="block text-xs leading-5">
            <span className="text-(--text)">Dynamic content:</span> {description}
            <span className="block text-[0.6875rem] font-medium text-(--muted)">
              One source, every page, built to scale.
            </span>
          </TypographySmall>
        </span>
      </span>
      <span className="dynamic-content-icon">
        <Cloud aria-hidden="true" className="size-3.5 text-(--accent)" />
      </span>
    </button>
  );
}
