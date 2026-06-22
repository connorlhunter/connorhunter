"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { TypographyEyebrow, TypographyMuted } from "@/components/ui/typography";
import { cn } from "@/lib/cn";
import { renderMarkdown } from "@/lib/markdown";

interface ProjectNotesProps {
  readonly architecture: string;
  readonly markdown: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly problem: string;
  readonly slug: string;
  readonly title: string;
}

/**
 * @param props - Project problem, architecture, markdown notes, slug, and title.
 * @returns A collapsible project notes section.
 */
export function ProjectNotes({
  architecture,
  markdown,
  onOpenChange,
  open,
  problem,
  slug,
  title,
}: ProjectNotesProps): ReactNode {
  const panelId = `${slug}-project-notes`;
  const renderedNotes = useMemo(() => renderMarkdown(markdown), [markdown]);

  return (
    <section className="project-notes-card narrative-card p-4">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex w-full transform-gpu cursor-pointer items-center justify-between gap-3 rounded-md text-left transition-[color] duration-200 hover:text-(--accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent) focus-visible:ring-offset-2 focus-visible:ring-offset-(--panel)"
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <span>
          <TypographyEyebrow as="span" className="block text-(--muted)">
            Project notes
          </TypographyEyebrow>
          <span className="sr-only"> for {title}</span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "size-4 shrink-0 transform-gpu text-(--accent) transition-transform duration-200",
            open ? "rotate-180" : "rotate-0",
          )}
        />
      </button>

      <div
        aria-hidden={!open}
        className={cn("project-notes-panel", open ? "project-notes-panel--open" : undefined)}
        id={panelId}
      >
        <div className="project-notes-panel-inner">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <TypographyEyebrow as="h3" className="text-(--warm)">
                Problem
              </TypographyEyebrow>
              <TypographyMuted className="text-measure mt-2">{problem}</TypographyMuted>
            </div>
            <div>
              <TypographyEyebrow as="h3" className="text-(--warm)">
                Architecture
              </TypographyEyebrow>
              <TypographyMuted className="text-measure mt-2">{architecture}</TypographyMuted>
            </div>
          </div>
          <div className="mt-4">
            <TypographyEyebrow as="h3" className="text-(--warm)">
              Notes
            </TypographyEyebrow>
            <div
              className="portfolio-markdown prose-surface mt-2 text-sm leading-7 text-(--muted)"
              dangerouslySetInnerHTML={{ __html: renderedNotes }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
