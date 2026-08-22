import { Activity, Clock3, Network, Tag, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { TypographyChip } from "@/components/ui/typography";
import type { Project } from "@/content/schema";
import { cn } from "@/lib/cn";

type ProjectStatusTone = "architecture" | "coming-soon" | "default" | "live" | "operational";

interface ProjectStatusPresentation {
  readonly icon: LucideIcon;
  readonly label: string;
  readonly tone: ProjectStatusTone;
}

function projectStatusPresentation(project: Project): ProjectStatusPresentation {
  const status = project.status.trim();
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "live":
      return { icon: Tag, label: "Live", tone: "live" };
    case "architecture":
      return { icon: Network, label: "Architecture", tone: "architecture" };
    case "operational":
      return { icon: Activity, label: "Operational", tone: "operational" };
    case "coming soon":
    case "coming-soon":
      return { icon: Clock3, label: "Coming soon", tone: "coming-soon" };
    default:
      return project.links.some((link) => link.kind === "live")
        ? { icon: Tag, label: "Live", tone: "live" }
        : { icon: Tag, label: status, tone: "default" };
  }
}

/**
 * @param props - Project whose current delivery status is displayed.
 * @returns A compact, theme-aware project status badge.
 */
export function ProjectStatusBadge({ project }: { readonly project: Project }): ReactNode {
  const { icon: Icon, label, tone } = projectStatusPresentation(project);

  return (
    <TypographyChip
      className={cn("project-status-badge", `project-status-badge--${tone}`, {
        "project-live-chip": tone === "live",
      })}
      data-testid="project-status-badge"
    >
      {tone === "live" ? (
        <span aria-hidden="true" className="project-status-badge-dot" />
      ) : (
        <Icon aria-hidden="true" className="project-status-badge-icon" />
      )}
      {label}
    </TypographyChip>
  );
}
