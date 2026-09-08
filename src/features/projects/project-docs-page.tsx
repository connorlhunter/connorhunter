import { ArrowLeft, ArrowRight } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import type { z } from "zod";
import { docsIndexSchema } from "./project-resource-schema";
import { useArtifactJson, useArtifactText, type ArtifactState } from "@/content/artifacts/queries";
import { TypographyEyebrow, TypographyH1, TypographySmall } from "@/components/ui/typography";
import type { ArtifactLink, DocumentBlock, Project } from "@/content/schema";
import { DocumentBlocks } from "./document-blocks";
import { parseMarkdownDocument, plainInlineText } from "./markdown-document";
import { projectResourceHref } from "./project-resource-routes";
import { artifact, ResourceState, ResourceSidebarHeader } from "./project-resource-shared";

const emptyPages: ReadonlyArray<DocsIndexPage> = [];

interface DocumentationReaderState {
  readonly blocks: ReadonlyArray<DocumentBlock>;
  readonly docs: ArtifactLink | undefined;
  readonly groups: ReadonlyArray<readonly [string, DocsIndexPage[]]>;
  readonly headings: ReadonlyArray<Extract<DocumentBlock, { readonly type: "heading" }>>;
  readonly indexState: ArtifactState<z.infer<typeof docsIndexSchema>>;
  readonly next: DocsIndexPage | undefined;
  readonly pageState: ArtifactState<string>;
  readonly previous: DocsIndexPage | undefined;
  readonly selected: DocsIndexPage | undefined;
}

function selectedDocumentPage(
  pages: ReadonlyArray<DocsIndexPage>,
  requestedPageId: string | undefined,
): DocsIndexPage | undefined {
  return pages.find((page) => page.id === requestedPageId) ?? pages[0];
}

function documentPageHref(
  docs: ArtifactLink | undefined,
  selected: DocsIndexPage | undefined,
): string | undefined {
  return docs && selected ? new URL(selected.path, docs.href).toString() : undefined;
}

function documentBlocks(
  page: string | undefined,
  selected: DocsIndexPage | undefined,
  projectSlug: string,
  documentIdsByPath: ReadonlyMap<string, string>,
): ReadonlyArray<DocumentBlock> {
  if (!page || !selected) return [];
  return parseMarkdownDocument(page, {
    documentIdsByPath,
    projectSlug,
    sourcePath: selected.sourcePath,
  });
}

function documentHeadings(
  blocks: ReadonlyArray<DocumentBlock>,
): ReadonlyArray<Extract<DocumentBlock, { readonly type: "heading" }>> {
  return blocks.filter(
    (block): block is Extract<DocumentBlock, { readonly type: "heading" }> =>
      block.type === "heading" && (block.level ?? 2) > 1,
  );
}

function documentNeighbors(
  pages: ReadonlyArray<DocsIndexPage>,
  selected: DocsIndexPage | undefined,
): { readonly next: DocsIndexPage | undefined; readonly previous: DocsIndexPage | undefined } {
  const selectedIndex = pages.findIndex((page) => page.id === selected?.id);
  return {
    next: selectedIndex >= 0 ? pages[selectedIndex + 1] : undefined,
    previous: selectedIndex > 0 ? pages[selectedIndex - 1] : undefined,
  };
}

function useDocumentationReader(
  project: Project,
  requestedPageId: string | undefined,
): DocumentationReaderState {
  const docs = artifact(project, "Docs");
  const indexState = useArtifactJson(docs?.href, docsIndexSchema);
  const pages = indexState.data?.pages ?? emptyPages;
  const selected = selectedDocumentPage(pages, requestedPageId);
  const pageState = useArtifactText(documentPageHref(docs, selected));
  const groups = useMemo(() => groupPages(pages), [pages]);
  const documentIdsByPath = useMemo(
    () => new Map(pages.map((page) => [page.sourcePath, page.id])),
    [pages],
  );
  const blocks = useMemo(
    () => documentBlocks(pageState.data, selected, project.slug, documentIdsByPath),
    [documentIdsByPath, pageState.data, project.slug, selected],
  );
  const { next, previous } = documentNeighbors(pages, selected);

  return {
    blocks,
    docs,
    groups,
    headings: documentHeadings(blocks),
    indexState,
    next,
    pageState,
    previous,
    selected,
  };
}

function DocumentationSidebar({
  documentTitle,
  docs,
  groups,
  project,
  selected,
}: Pick<DocumentationReaderState, "docs" | "groups" | "selected"> & {
  readonly documentTitle: string | undefined;
  readonly project: Project;
}): ReactNode {
  return (
    <aside className="docs-reader-sidebar">
      <ResourceSidebarHeader title={documentTitle} downloadHref={docs?.downloadHref} />
      <div className="docs-reader-navigation">
        {groups.map(([section, pages]) => (
          <div className="docs-reader-group" key={section}>
            <TypographyEyebrow as="h2">
              {documentSectionLabel(section, documentTitle)}
            </TypographyEyebrow>
            {pages.map((page) => (
              <Link
                activeOptions={{ exact: true }}
                aria-current={page.id === selected?.id ? "page" : undefined}
                key={page.id}
                to={projectResourceHref(project.slug, "docs", page.id)}
              >
                {page.title}
              </Link>
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}

function DocumentPagination({
  next,
  previous,
  projectSlug,
}: Pick<DocumentationReaderState, "next" | "previous"> & {
  readonly projectSlug: string;
}): ReactNode {
  return (
    <nav aria-label="Document pages" className="resource-pagination">
      {previous ? (
        <Link
          aria-label={`Previous: ${previous.title}`}
          className="resource-pagination-link"
          to={projectResourceHref(projectSlug, "docs", previous.id)}
        >
          <ArrowLeft aria-hidden="true" className="size-4" /> Previous
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link
          aria-label={`Next: ${next.title}`}
          className="resource-pagination-link resource-pagination-link--next"
          to={projectResourceHref(projectSlug, "docs", next.id)}
        >
          Next <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </nav>
  );
}

function DocumentationPageContent({
  blocks,
  next,
  pageState,
  previous,
  project,
  selected,
}: Pick<DocumentationReaderState, "blocks" | "next" | "pageState" | "previous" | "selected"> & {
  readonly project: Project;
}): ReactNode {
  if (!pageState.data || !selected) return null;

  return (
    <article className="project-resource-inset docs-reader-content">
      <header className="resource-page-heading">
        <TypographyEyebrow>Documentation</TypographyEyebrow>
        <TypographyH1 className="mt-2">{selected.title}</TypographyH1>
        <TypographySmall className="mt-2">
          v{selected.version} · Updated {selected.lastUpdated}
        </TypographySmall>
      </header>
      <div className="resource-prose mt-8">
        <DocumentBlocks blocks={blocks} projectSlug={project.slug} />
      </div>
      <DocumentPagination next={next} previous={previous} projectSlug={project.slug} />
    </article>
  );
}

function DocumentationOutline({ headings }: Pick<DocumentationReaderState, "headings">): ReactNode {
  return (
    <aside className="docs-reader-outline" aria-label="On this page">
      <TypographyEyebrow>On this page</TypographyEyebrow>
      {headings.map((heading) => (
        <a href={`#${heading.id}`} key={heading.id}>
          {plainInlineText(heading.content)}
        </a>
      ))}
    </aside>
  );
}

function DocumentationReader({
  project,
  state,
}: {
  readonly project: Project;
  readonly state: DocumentationReaderState;
}): ReactNode {
  return (
    <section className="docs-reader">
      <DocumentationSidebar
        documentTitle={state.indexState.data?.title}
        docs={state.docs}
        groups={state.groups}
        project={project}
        selected={state.selected}
      />
      <ResourceState state={state.pageState} title="document">
        <DocumentationPageContent {...state} project={project} />
      </ResourceState>
      <DocumentationOutline headings={state.headings} />
    </section>
  );
}

/** Documentation reader with page tree, inset Markdown content, and local outline. */
export function ProjectDocsPage({
  project,
  requestedPageId,
}: {
  readonly project: Project;
  readonly requestedPageId?: string | undefined;
}): ReactNode {
  const state = useDocumentationReader(project, requestedPageId);

  return (
    <ResourceState state={state.indexState} title="docs">
      <DocumentationReader project={project} state={state} />
    </ResourceState>
  );
}

type DocsIndexPage = z.infer<typeof docsIndexSchema>["pages"][number];

function groupPages(pages: ReadonlyArray<DocsIndexPage>): Array<[string, DocsIndexPage[]]> {
  const groups = new Map<string, DocsIndexPage[]>();
  for (const page of pages) groups.set(page.section, [...(groups.get(page.section) ?? []), page]);
  return [...groups.entries()];
}

function documentSectionLabel(section: string, documentTitle: string | undefined): string {
  if (!documentTitle) return section;
  if (section === documentTitle) return "Start here";

  const prefix = `${documentTitle} `;
  return section.startsWith(prefix) ? section.slice(prefix.length) : section;
}
