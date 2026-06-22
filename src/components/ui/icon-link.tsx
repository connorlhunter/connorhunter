import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";

interface IconLinkProps {
  readonly children: ReactNode;
  readonly className?: string;
  readonly href: string;
  readonly icon?: ReactNode;
}

/**
 * @param props - Link destination, label content, optional icon, and optional classes.
 * @returns A theme-aware contact or resource link.
 */
export function IconLink({ children, className, href, icon }: IconLinkProps): ReactNode {
  return (
    <a
      className={cn(
        "inline-flex transform-gpu items-center gap-2 rounded-md text-sm font-semibold text-(--accent) underline-offset-4 transition-[color,text-decoration-color] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)",
        className,
      )}
      href={href}
      rel="noreferrer"
      target={href.startsWith("http") ? "_blank" : undefined}
    >
      {icon ?? <ExternalLink aria-hidden="true" className="size-4" />}
      <span className="min-w-0 wrap-break-word">{children}</span>
    </a>
  );
}
