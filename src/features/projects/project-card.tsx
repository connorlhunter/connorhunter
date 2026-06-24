import { memo, type ReactNode } from "react";
import {
  TypographyChip,
  TypographyEyebrow,
  TypographyH3,
  TypographyMuted,
} from "@/components/ui/typography";
import type { Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { cn } from "@/lib/cn";
import { ArtifactActions, DownloadActions, ProjectLinkActions } from "./project-actions";
import { ProjectNotes } from "./project-notes";

interface ProjectCardProps {
  readonly notesOpen: boolean;
  readonly onNotesOpenChange: (open: boolean) => void;
  readonly project: Project;
}

/**
 * @param props - Project metadata, notes state, and notes toggle callback.
 * @returns A responsive project summary card.
 */
function ProjectCardComponent({
  notesOpen,
  onNotesOpenChange,
  project,
}: ProjectCardProps): ReactNode {
  return (
    <article
      aria-labelledby={`${project.slug}-heading`}
      className="project-card-layout surface-card grid scroll-mt-24 gap-6 p-5"
      id={project.slug}
    >
      <div className="flex items-start gap-4 lg:block">
        <ThemedIconImage
          alt=""
          aria-hidden="true"
          className="project-asset-icon"
          src={project.icon}
        />
      </div>

      <div className="project-card-body min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <TypographyEyebrow className="text-(--warm)">{project.status}</TypographyEyebrow>
            <TypographyH3 as="h2" className="mt-2 text-2xl" id={`${project.slug}-heading`}>
              {project.title}
            </TypographyH3>
          </div>
        </div>

        <TypographyMuted className="text-measure mt-3">{project.summary}</TypographyMuted>

        <div className="mt-5 flex flex-wrap gap-2" role="list">
          {project.stack.map((item) => (
            <TypographyChip key={item} role="listitem">
              {item}
            </TypographyChip>
          ))}
        </div>

        <div className="mt-6 grid gap-4">
          <section>
            <TypographyEyebrow as="h3" className="mb-2 text-(--muted)">
              Links
            </TypographyEyebrow>
            <ProjectLinkActions links={project.links} liveVariant="secondary" />
          </section>

          <section>
            <TypographyEyebrow as="h3" className="mb-2 text-(--muted)">
              Artifacts
            </TypographyEyebrow>
            <ArtifactActions
              artifacts={project.artifacts}
              projectSlug={project.slug}
              surface="projects-page"
            />
          </section>

          {project.downloads.length > 0 ? (
            <section>
              <TypographyEyebrow as="h3" className="mb-2 text-(--muted)">
                Desktop Downloads
              </TypographyEyebrow>
              <DownloadActions downloads={project.downloads} />
            </section>
          ) : null}
        </div>

        <div
          className={cn(
            project.downloads.length === 0 ? "project-notes-bottom" : "project-notes-spacing",
          )}
        >
          <ProjectNotes
            architecture={project.architecture}
            markdown={project.markdown}
            onOpenChange={onNotesOpenChange}
            open={notesOpen}
            problem={project.problem}
            slug={project.slug}
            title={project.title}
          />
        </div>
      </div>
    </article>
  );
}

/**
 * @param previous - Previous project card props.
 * @param next - Next project card props.
 * @returns Whether a project card can skip rerendering when sibling notes change.
 */
function projectCardPropsEqual(previous: ProjectCardProps, next: ProjectCardProps): boolean {
  return previous.project === next.project && previous.notesOpen === next.notesOpen;
}

export const ProjectCard = memo(ProjectCardComponent, projectCardPropsEqual);
ProjectCard.displayName = "ProjectCard";
