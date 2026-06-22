import {
  Apple,
  BookOpenText,
  ChartNoAxesCombined,
  ExternalLink,
  GitBranch,
  ListChecks,
  MonitorDown,
  Network,
} from "lucide-react";
import type { ReactNode } from "react";
import type { ArtifactLink, DownloadLink, ProjectLink } from "@/content/schema";

/**
 * @param label - Artifact link label from project content.
 * @returns The icon used for that artifact action.
 */
export function artifactIcon(label: ArtifactLink["label"]): ReactNode {
  if (label === "Docs") {
    return <BookOpenText aria-hidden="true" className="size-4" />;
  }

  if (label === "Coverage") {
    return <ChartNoAxesCombined aria-hidden="true" className="size-4" />;
  }

  return <Network aria-hidden="true" className="size-4" />;
}

/**
 * @param platform - Desktop download platform from project content.
 * @returns The icon used for that download action.
 */
export function downloadIcon(platform: DownloadLink["platform"]): ReactNode {
  if (platform === "mac") {
    return <Apple aria-hidden="true" className="size-4" />;
  }

  return <MonitorDown aria-hidden="true" className="size-4" />;
}

/**
 * @param kind - Project link type from project content.
 * @returns The icon used for that project link.
 */
export function projectLinkIcon(kind: ProjectLink["kind"]): ReactNode {
  if (kind === "source") {
    return <GitBranch aria-hidden="true" className="size-4" />;
  }

  if (kind === "roadmap") {
    return <ListChecks aria-hidden="true" className="size-4" />;
  }

  return <ExternalLink aria-hidden="true" className="size-4" />;
}
