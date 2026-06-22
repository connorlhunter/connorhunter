import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { TypographyEyebrow, TypographyH1, TypographyH3, TypographyP } from "./typography";

type StatusPanelHeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

interface StatusPanelProps {
  readonly actions?: ReactNode;
  readonly actionsClassName?: string;
  readonly className?: string;
  readonly eyebrow: ReactNode;
  readonly headingId: string;
  readonly icon: ReactNode;
  readonly message: ReactNode;
  readonly title: ReactNode;
  readonly titleAs?: StatusPanelHeadingElement;
  readonly titleSize?: "page" | "section";
}

/**
 * @param props - Icon, heading copy, message, and optional actions for empty/error states.
 * @returns A reusable status panel used by route fallbacks and embedded viewer fallbacks.
 */
export function StatusPanel({
  actions,
  actionsClassName,
  className,
  eyebrow,
  headingId,
  icon,
  message,
  title,
  titleAs = "h1",
  titleSize = "page",
}: StatusPanelProps): ReactNode {
  const Heading = titleSize === "section" ? TypographyH3 : TypographyH1;

  return (
    <section aria-labelledby={headingId} className={cn("not-found-panel", className)}>
      <span className="not-found-icon">{icon}</span>
      <TypographyEyebrow className="text-(--warm)">{eyebrow}</TypographyEyebrow>
      <Heading
        as={titleAs}
        className={cn("mt-3", titleSize === "section" && "text-2xl")}
        id={headingId}
      >
        {title}
      </Heading>
      <TypographyP className="mx-auto mt-5 max-w-2xl">{message}</TypographyP>
      {actions ? (
        <div className={cn("mt-8 flex flex-wrap justify-center gap-3", actionsClassName)}>
          {actions}
        </div>
      ) : null}
    </section>
  );
}
