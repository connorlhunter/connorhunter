import { useEffect, useMemo, useState, type ReactNode } from "react";
import { TypographyH1, TypographyP } from "@/components/ui/typography";
import type { PortfolioContent, Project } from "@/content/schema";
import { navigationPage } from "@/content/page-copy";
import { SiteLayout } from "@/features/shell/site-layout";
import { ProjectCard } from "./project-card";

interface ProjectsPageProps {
  readonly content: PortfolioContent;
  readonly selectedProjectSlug?: string | undefined;
}

interface ProjectShowcaseProps {
  readonly projects: ReadonlyArray<Project>;
  readonly selectedProjectSlug?: string | undefined;
}

/**
 * @param id - Element id to scroll into view.
 * @returns Nothing; schedules a smooth scroll when the element exists.
 */
function scrollToElement(id: string): void {
  window.requestAnimationFrame(() => {
    document.getElementById(id)?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  });
}

/**
 * @param props - Project records to display.
 * @returns A responsive project card grid.
 */
export function ProjectShowcase({
  projects,
  selectedProjectSlug,
}: ProjectShowcaseProps): ReactNode {
  const [openNotesSlug, setOpenNotesSlug] = useState<string | null>(null);
  const selectedProject = useMemo(
    () =>
      selectedProjectSlug
        ? projects.find((project) => project.slug === selectedProjectSlug)
        : undefined,
    [projects, selectedProjectSlug],
  );

  useEffect(() => {
    if (selectedProject) {
      scrollToElement(selectedProject.slug);
    }
  }, [selectedProject]);

  return (
    <div className="space-y-8">
      <div className="grid items-start gap-5 xl:grid-cols-2">
        {projects.map((project) => {
          const notesOpen = openNotesSlug === project.slug;

          return (
            <ProjectCard
              key={project.slug}
              notesOpen={notesOpen}
              onNotesOpenChange={(open) => setOpenNotesSlug(open ? project.slug : null)}
              project={project}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * @param props - Complete portfolio content.
 * @returns The projects page.
 */
export function ProjectsPage({ content, selectedProjectSlug }: ProjectsPageProps): ReactNode {
  const page = navigationPage(content, "/projects");

  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <header className="page-intro">
            <TypographyH1 className="text-(--warm)">{page.label}</TypographyH1>
            <TypographyP className="mt-5">{page.summary}</TypographyP>
          </header>
          <div className="mt-10">
            <ProjectShowcase
              projects={content.projects}
              selectedProjectSlug={selectedProjectSlug}
            />
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
