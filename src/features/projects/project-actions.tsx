import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import type { ArtifactLink, DownloadLink, ProjectLink } from "@/content/schema";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { isExternalHref } from "@/lib/url";
import { artifactIcon, downloadIcon, projectLinkIcon } from "./project-action-icons";
import { artifactActionTarget, type ArtifactActionSurface } from "./project-action-targets";

interface ArtifactActionsProps {
  readonly artifacts: ReadonlyArray<ArtifactLink>;
  readonly projectSlug?: string;
  readonly surface?: ArtifactActionSurface;
}

/**
 * @param props - Visible action content and accessible action label.
 * @returns A disabled coming-soon action styled like a link.
 */
export function ComingSoonAction({
  children,
  label,
}: {
  readonly children: ReactNode;
  readonly label: string;
}): ReactNode {
  return (
    <span
      aria-disabled="true"
      aria-label={`${label} coming soon`}
      className={cn(buttonVariants({ size: "small", variant: "outline" }), "coming-soon-action")}
      role="link"
      tabIndex={0}
    >
      <span className="coming-soon-action-content">{children}</span>
      <span aria-hidden="true" className="coming-soon-action-status">
        Coming soon
      </span>
    </span>
  );
}

/**
 * @param props - Project links and the button variant used for live links.
 * @returns Rendered project link actions.
 */
export function ProjectLinkActions({
  links,
  liveVariant = "outline",
}: {
  readonly links: ReadonlyArray<ProjectLink>;
  readonly liveVariant?: "outline" | "primary" | "secondary";
}): ReactNode {
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((link) => {
        const external = isExternalHref(link.href);

        return link.comingSoon ? (
          <ComingSoonAction key={`${link.kind}-${link.href}`} label={link.label}>
            {projectLinkIcon(link.kind)}
            {link.label}
          </ComingSoonAction>
        ) : (
          <Button
            asChild
            key={`${link.kind}-${link.href}`}
            size="small"
            variant={link.kind === "live" ? liveVariant : "outline"}
          >
            <a
              href={link.href}
              rel={external ? "noreferrer" : undefined}
              target={external ? "_blank" : undefined}
            >
              {projectLinkIcon(link.kind)}
              {link.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}

/**
 * @param props - Project artifact links.
 * @returns Rendered artifact actions.
 */
export function ArtifactActions({
  artifacts,
  projectSlug,
  surface = "external",
}: ArtifactActionsProps): ReactNode {
  return (
    <div className="flex flex-wrap gap-2">
      {artifacts.map((artifact) => {
        const target = artifactActionTarget(artifact, projectSlug, surface);

        return artifact.comingSoon ? (
          <ComingSoonAction key={artifact.label} label={artifact.label}>
            {artifactIcon(artifact.label)}
            {artifact.label}
          </ComingSoonAction>
        ) : (
          <Button asChild key={artifact.label} size="small" variant="outline">
            <a
              href={target.href}
              rel={target.target === "_blank" ? "noreferrer" : undefined}
              target={target.target}
            >
              {artifactIcon(artifact.label)}
              {artifact.label}
            </a>
          </Button>
        );
      })}
    </div>
  );
}

/**
 * @param props - Desktop download links.
 * @returns Rendered download actions, or null when no downloads exist.
 */
export function DownloadActions({
  downloads,
}: {
  readonly downloads: ReadonlyArray<DownloadLink>;
}): ReactNode {
  if (downloads.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {downloads.map((download) =>
        download.comingSoon ? (
          <ComingSoonAction key={`${download.platform}-${download.href}`} label={download.label}>
            {downloadIcon(download.platform)}
            {download.label}
          </ComingSoonAction>
        ) : (
          <Button
            asChild
            key={`${download.platform}-${download.href}`}
            size="small"
            variant="outline"
          >
            <a href={download.href} rel="noreferrer" target="_blank">
              {downloadIcon(download.platform)}
              {download.label}
            </a>
          </Button>
        ),
      )}
    </div>
  );
}
