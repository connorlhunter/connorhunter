import { useMemo, type ReactNode } from "react";
import { useArtifactText } from "@/content/artifacts/queries";
import { TypographyEyebrow, TypographyH1, TypographySmall } from "@/components/ui/typography";
import type { DocumentBlock, Project } from "@/content/schema";
import { DocumentBlocks } from "./document-blocks";
import { parseMarkdownDocument, plainInlineText } from "./markdown-document";
import { artifact, ResourceState, ResourceSidebarHeader } from "./project-resource-shared";

/** Readable changelog owned and published by each project repository. */
export function ProjectChangelogPage({ project }: { readonly project: Project }): ReactNode {
  const changelog = artifact(project, "Changelog");
  const state = useArtifactText(changelog?.href);
  const blocks = useMemo(
    () =>
      state.data
        ? parseMarkdownDocument(state.data, {
            projectSlug: project.slug,
            sourcePath: "CHANGELOG.md",
          })
        : [],
    [project.slug, state.data],
  );
  const releases = blocks.filter(
    (block): block is Extract<DocumentBlock, { readonly type: "heading" }> =>
      block.type === "heading" && block.level === 2,
  );

  return (
    <ResourceState state={state} title="changelog">
      {state.data ? (
        <section className="changelog-reader">
          <aside className="changelog-reader-sidebar">
            <ResourceSidebarHeader title="Changelog" downloadHref={changelog?.downloadHref} />
            <div className="changelog-reader-navigation">
              {releases.map((release) => (
                <a href={`#${release.id}`} key={release.id}>
                  {plainInlineText(release.content)}
                </a>
              ))}
            </div>
          </aside>
          <article className="project-resource-inset changelog-reader-content">
            <header className="resource-page-heading">
              <TypographyEyebrow>Changelog</TypographyEyebrow>
              <TypographyH1 className="mt-2">Project history</TypographyH1>
              <TypographySmall className="mt-2">
                Published from this project’s canonical CHANGELOG.md
              </TypographySmall>
            </header>
            <div className="resource-prose mt-8">
              <DocumentBlocks blocks={blocks} projectSlug={project.slug} />
            </div>
          </article>
        </section>
      ) : null}
    </ResourceState>
  );
}
