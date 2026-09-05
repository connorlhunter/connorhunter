import type { ReactNode } from "react";
import {
  TypographyEyebrow,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
} from "@/components/ui/typography";
import type { Project } from "@/content/schema";
import { DocumentBlocks } from "./document-blocks";

/** The inset project overview, intentionally separate from resource readers. */
export function ProjectOverview({ project }: { readonly project: Project }): ReactNode {
  return (
    <section className="project-resource-inset project-overview-page">
      <div className="project-overview-grid grid gap-4 md:grid-cols-2">
        <section className="narrative-card project-overview-card p-5">
          <TypographyEyebrow className="text-(--muted)">Context</TypographyEyebrow>
          <TypographyH3 as="h2" className="mt-1">
            Problem
          </TypographyH3>
          <TypographyMuted className="text-measure mt-3">{project.problem}</TypographyMuted>
        </section>
        <section className="narrative-card project-overview-card p-5">
          <TypographyEyebrow className="text-(--muted)">System</TypographyEyebrow>
          <TypographyH3 as="h2" className="mt-1">
            Architecture
          </TypographyH3>
          <TypographyMuted className="text-measure mt-3">{project.architecture}</TypographyMuted>
        </section>
      </div>
      <section className="resource-article surface-card mt-4 p-5">
        <TypographyEyebrow className="text-(--muted)">Notes</TypographyEyebrow>
        <TypographyH2 className="mt-1">Project notes</TypographyH2>
        <div className="resource-prose mt-5">
          <DocumentBlocks blocks={project.notes} projectSlug={project.slug} />
        </div>
      </section>
    </section>
  );
}
