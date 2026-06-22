import type { ReactNode } from "react";
import { TypographyChip, TypographyEyebrow } from "@/components/ui/typography";
import type { Project } from "@/content/schema";
import { cn } from "@/lib/cn";

interface ProjectDetailActionGroupProps {
  readonly ariaLabel: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly label: string;
}

/**
 * @param props - Compact action group label, controls, and accessibility label.
 * @returns A labeled project detail action group.
 */
export function ProjectDetailActionGroup({
  ariaLabel,
  children,
  className,
  label,
}: ProjectDetailActionGroupProps): ReactNode {
  return (
    <div aria-label={ariaLabel} className="project-detail-action-group" role="group">
      <TypographyEyebrow className="project-detail-action-label">{label}</TypographyEyebrow>
      <div className={cn("project-detail-action-control", className)}>{children}</div>
    </div>
  );
}

/**
 * @param props - Project stack metadata.
 * @returns Compact stack chips for the project viewer drawer.
 */
export function ProjectStackChips({ project }: { readonly project: Project }): ReactNode {
  return (
    <div aria-label={`${project.title} stack`} className="project-detail-stack-chips" role="list">
      {project.stack.map((item) => (
        <TypographyChip key={item} role="listitem">
          {item}
        </TypographyChip>
      ))}
    </div>
  );
}
