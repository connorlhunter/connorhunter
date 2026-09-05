import { ExternalLink, Waypoints } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { TypographyEyebrow, TypographyH2, TypographySmall } from "@/components/ui/typography";
import type { Project } from "@/content/schema";
import { projectResourceHref } from "./project-resource-routes";
import { artifact, ResourceState } from "./project-resource-shared";

/** Diagram gallery that retains title, version, and updated metadata beside the inset SVG. */
export function ProjectDiagramsPage({
  project,
  requestedDiagramId,
}: {
  readonly project: Project;
  readonly requestedDiagramId?: string | undefined;
}): ReactNode {
  const diagrams = artifact(project, "Diagrams");
  const items = diagrams?.items ?? [];
  const selected =
    items.find((item) => item.id === requestedDiagramId) ??
    items.find((item) => item.id === "overview") ??
    items[0];
  if (!selected)
    return (
      <ResourceState
        state={{ error: "This project has no published diagrams.", loading: false }}
        title="diagrams"
      >
        <span />
      </ResourceState>
    );
  return (
    <section className="diagram-reader">
      <aside className="diagram-reader-sidebar">
        <div className="docs-reader-sidebar-heading diagram-reader-sidebar-heading">
          <Waypoints aria-hidden="true" className="size-4" /> Diagrams
        </div>
        {items.map((item) => (
          <Link
            activeOptions={{ exact: true }}
            aria-current={item.id === selected.id ? "page" : undefined}
            key={item.id}
            to={projectResourceHref(project.slug, "diagrams", item.id)}
          >
            <span>{item.label}</span>
            <small>
              v{item.version} · {item.lastUpdated}
            </small>
          </Link>
        ))}
      </aside>
      <figure className="project-resource-inset diagram-reader-canvas">
        <figcaption className="diagram-reader-heading">
          <div>
            <TypographyEyebrow>Diagram</TypographyEyebrow>
            <TypographyH2 className="mt-1">{selected.label}</TypographyH2>
            <TypographySmall className="mt-2">
              v{selected.version} · Updated {selected.lastUpdated}
            </TypographySmall>
          </div>
          <Button asChild size="small" variant="outline">
            <a href={selected.href} rel="noreferrer" target="_blank">
              <ExternalLink aria-hidden="true" className="size-4" /> Open SVG
            </a>
          </Button>
        </figcaption>
        <img
          alt={`${project.title} ${selected.label} diagram`}
          className="diagram-reader-image"
          src={selected.href}
        />
      </figure>
    </section>
  );
}
