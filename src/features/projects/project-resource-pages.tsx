import {
  ArrowLeft,
  ArrowRight,
  Download,
  ExternalLink,
  FileText,
  LoaderCircle,
  Waypoints,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import {
  TypographyEyebrow,
  TypographyH1,
  TypographyH2,
  TypographyH3,
  TypographyMuted,
  TypographySmall,
} from "@/components/ui/typography";
import type { ArtifactLink, DocumentBlock, Project } from "@/content/schema";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { DocumentBlocks } from "./document-blocks";
import { parseMarkdownDocument, plainInlineText } from "./markdown-document";
import { DownloadActions, ProjectLinkActions } from "./project-actions";
import { projectResourceHref, type ProjectResourceKind } from "./project-resource-routes";

const docsIndexSchema = z.object({
  pages: z.array(
    z.object({
      id: z.string().min(1),
      lastUpdated: z.iso.date(),
      path: z.string().endsWith(".md"),
      section: z.string().min(1),
      sourcePath: z.string().endsWith(".md"),
      title: z.string().min(1),
      version: z.string().min(1),
    }),
  ),
  schemaVersion: z.literal(2),
  title: z.string().min(1),
});

const coverageMetricSchema = z.object({
  covered: z.number().nonnegative(),
  found: z.number().nonnegative(),
});
const coverageFileSchema = z.object({
  branches: coverageMetricSchema.optional(),
  functions: coverageMetricSchema,
  lines: coverageMetricSchema,
  path: z.string().min(1),
});
const coverageArtifactSchema = z.object({
  minimumCoverage: z.union([z.number(), z.object({ functions: z.number(), lines: z.number() })]),
  schemaVersion: z.literal(2),
  surfaces: z.array(
    z.object({
      files: z.array(coverageFileSchema),
      id: z.string().min(1),
      label: z.string().min(1),
      totals: coverageFileSchema,
    }),
  ),
  updatedAt: z.string().min(1),
});

interface ArtifactState<T> {
  readonly data?: T;
  readonly error?: string;
  readonly loading: boolean;
}

function useArtifactJson<T>(href: string | undefined, schema: z.ZodType<T>): ArtifactState<T> {
  const [state, setState] = useState<ArtifactState<T>>({ loading: Boolean(href) });

  useEffect(() => {
    let active = true;
    if (!href) {
      setState({ loading: false });
      return () => {
        active = false;
      };
    }
    setState({ loading: true });
    void fetch(href, { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Artifact request failed with ${response.status}.`);
        return schema.parse(await response.json());
      })
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch(() => {
        if (active)
          setState({ error: "This resource has not been published yet.", loading: false });
      });
    return () => {
      active = false;
    };
  }, [href, schema]);

  return state;
}

function useArtifactText(href: string | undefined): ArtifactState<string> {
  const [state, setState] = useState<ArtifactState<string>>({ loading: Boolean(href) });

  useEffect(() => {
    let active = true;
    if (!href) {
      setState({ loading: false });
      return () => {
        active = false;
      };
    }
    setState({ loading: true });
    void fetch(href, { headers: { Accept: "text/markdown" } })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Artifact request failed with ${response.status}.`);
        return response.text();
      })
      .then((data) => {
        if (active) setState({ data, loading: false });
      })
      .catch(() => {
        if (active)
          setState({ error: "This resource has not been published yet.", loading: false });
      });
    return () => {
      active = false;
    };
  }, [href]);

  return state;
}

function artifact(project: Project, label: ArtifactLink["label"]): ArtifactLink | undefined {
  return project.artifacts.find((item) => item.label === label);
}

function resourceTitle(resource: ProjectResourceKind): string {
  if (resource === "docs") return "Docs";
  if (resource === "diagrams") return "Diagrams";
  if (resource === "coverage") return "Coverage";
  if (resource === "changelog") return "Changelog";
  return "Overview";
}

function ResourceState({
  children,
  state,
  title,
}: {
  readonly children: ReactNode;
  readonly state: ArtifactState<unknown>;
  readonly title: string;
}): ReactNode {
  if (state.loading) {
    return (
      <div className="resource-loading" role="status">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" /> Loading {title}
      </div>
    );
  }
  if (state.error) {
    return (
      <StatusPanel
        className="resource-empty"
        eyebrow="Not published"
        headingId={`${title.toLowerCase()}-unavailable`}
        icon={<FileText aria-hidden="true" className="size-6" />}
        message={state.error}
        title={`${title} unavailable`}
        titleAs="h2"
        titleSize="section"
      />
    );
  }
  return children;
}

/** Project header and resource navigation shared by every project route. */
export function ProjectResourceShell({
  children,
  project,
  resource,
}: {
  readonly children: ReactNode;
  readonly project: Project;
  readonly resource: ProjectResourceKind;
}): ReactNode {
  return (
    <article className="project-page">
      <header className="project-hero">
        <div className="project-hero-title">
          <ThemedIconImage
            alt=""
            aria-hidden="true"
            className="project-hero-icon"
            src={project.icon}
          />
          <div>
            <TypographyEyebrow className="text-(--muted)">Project</TypographyEyebrow>
            <TypographyH1 className="mt-1">{project.title}</TypographyH1>
            <TypographyMuted className="project-hero-summary mt-3">
              {project.summary}
            </TypographyMuted>
          </div>
        </div>
        <div className="project-hero-actions">
          <ProjectLinkActions links={project.links} liveVariant="secondary" />
          <DownloadActions downloads={project.downloads} />
        </div>
      </header>

      <nav aria-label={`${project.title} resources`} className="project-resource-nav">
        {(["overview", "docs", "diagrams", "coverage", "changelog"] as const).map((item) => {
          const unavailable =
            item !== "overview" &&
            artifact(project, resourceTitle(item) as ArtifactLink["label"])?.comingSoon;
          return unavailable ? (
            <span aria-disabled="true" className="project-resource-nav-item" key={item}>
              {resourceTitle(item)}
            </span>
          ) : (
            <Link
              activeOptions={{ exact: true }}
              aria-current={item === resource ? "page" : undefined}
              className="project-resource-nav-item"
              key={item}
              to={projectResourceHref(project.slug, item)}
            >
              {resourceTitle(item)}
            </Link>
          );
        })}
      </nav>
      {children}
    </article>
  );
}

/** The inset project overview, intentionally separate from resource readers. */
export function ProjectOverview({ project }: { readonly project: Project }): ReactNode {
  return (
    <section className="project-resource-inset project-overview-page">
      <div className="project-overview-grid grid gap-4 md:grid-cols-2">
        <section className="narrative-card project-overview-card p-5">
          <TypographyEyebrow className="text-(--warm)">Context</TypographyEyebrow>
          <TypographyH3 as="h2" className="mt-1">
            Problem
          </TypographyH3>
          <TypographyMuted className="text-measure mt-3">{project.problem}</TypographyMuted>
        </section>
        <section className="narrative-card project-overview-card p-5">
          <TypographyEyebrow className="text-(--warm)">System</TypographyEyebrow>
          <TypographyH3 as="h2" className="mt-1">
            Architecture
          </TypographyH3>
          <TypographyMuted className="text-measure mt-3">{project.architecture}</TypographyMuted>
        </section>
      </div>
      <section className="resource-article surface-card mt-4 p-5">
        <TypographyEyebrow className="text-(--warm)">Notes</TypographyEyebrow>
        <TypographyH2 className="mt-1">Project notes</TypographyH2>
        <div className="resource-prose mt-5">
          <DocumentBlocks blocks={project.notes} projectSlug={project.slug} />
        </div>
      </section>
    </section>
  );
}

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
  const pages = indexState.data?.pages ?? [];
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
      <div className="docs-reader-sidebar-top">
        <div className="docs-reader-sidebar-heading">
          <FileText aria-hidden="true" className="size-4" /> {documentTitle}
        </div>
        {docs?.downloadHref ? (
          <a className="docs-reader-download docs-reader-download--top" href={docs.downloadHref}>
            <Download aria-hidden="true" className="size-4" /> Download PDF
          </a>
        ) : null}
      </div>
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

/** Data-led coverage page rendered by the portfolio rather than an embedded report. */
export function ProjectCoveragePage({ project }: { readonly project: Project }): ReactNode {
  const coverage = artifact(project, "Coverage");
  const state = useArtifactJson(coverage?.href, coverageArtifactSchema);
  const [surfaceId, setSurfaceId] = useState<string | undefined>();
  useEffect(() => setSurfaceId(undefined), [coverage?.href]);
  const surface =
    state.data?.surfaces.find((item) => item.id === surfaceId) ?? state.data?.surfaces[0];
  return (
    <ResourceState state={state} title="coverage">
      {state.data && surface ? (
        <section className="coverage-reader">
          <aside className="coverage-reader-sidebar">
            <div className="docs-reader-sidebar-top">
              <div className="docs-reader-sidebar-heading">
                <FileText aria-hidden="true" className="size-4" /> Coverage
              </div>
              {coverage?.downloadHref ? (
                <a
                  className="docs-reader-download docs-reader-download--top"
                  href={coverage.downloadHref}
                >
                  <Download aria-hidden="true" className="size-4" /> Download PDF
                </a>
              ) : null}
            </div>
          </aside>
          <section className="project-resource-inset coverage-page">
            <header className="resource-page-heading">
              <TypographyEyebrow>Coverage</TypographyEyebrow>
              <TypographyH2 className="mt-1">Quality snapshot</TypographyH2>
              <TypographySmall className="mt-2">
                Updated {state.data.updatedAt} · Minimum{" "}
                {coverageMinimum(state.data.minimumCoverage)}
              </TypographySmall>
            </header>
            <div className="resource-segmented-control" role="tablist">
              {state.data.surfaces.map((item) => (
                <button
                  aria-selected={item.id === surface.id}
                  key={item.id}
                  onClick={() => setSurfaceId(item.id)}
                  role="tab"
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="coverage-metrics">
              {metricCard("Lines", surface.totals.lines)}
              {metricCard("Functions", surface.totals.functions)}
              {surface.totals.branches ? metricCard("Branches", surface.totals.branches) : null}
            </div>
            <div className="resource-table-wrap">
              <table className="resource-table coverage-table">
                <thead>
                  <tr>
                    <th>File</th>
                    <th>Lines</th>
                    <th>Functions</th>
                    {surface.totals.branches ? <th>Branches</th> : null}
                  </tr>
                </thead>
                <tbody>
                  {surface.files.map((file) => (
                    <tr key={file.path}>
                      <td>{file.path}</td>
                      <td>{metricLabel(file.lines)}</td>
                      <td>{metricLabel(file.functions)}</td>
                      {surface.totals.branches ? (
                        <td>{file.branches ? metricLabel(file.branches) : "N/A"}</td>
                      ) : null}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      ) : null}
    </ResourceState>
  );
}

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
            <div className="docs-reader-sidebar-top">
              <div className="docs-reader-sidebar-heading">
                <FileText aria-hidden="true" className="size-4" /> Changelog
              </div>
              {changelog?.downloadHref ? (
                <a
                  className="docs-reader-download docs-reader-download--top"
                  href={changelog.downloadHref}
                >
                  <Download aria-hidden="true" className="size-4" /> Download PDF
                </a>
              ) : null}
            </div>
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

function metricLabel(metric: { readonly covered: number; readonly found: number }): string {
  const percentage = metric.found === 0 ? 100 : (metric.covered / metric.found) * 100;
  return `${percentage.toFixed(2)}% (${metric.covered}/${metric.found})`;
}

function metricCard(
  label: string,
  metric: { readonly covered: number; readonly found: number },
): ReactNode {
  return (
    <div className="coverage-metric" key={label}>
      <TypographyEyebrow>{label}</TypographyEyebrow>
      <strong>{metricLabel(metric)}</strong>
    </div>
  );
}

function coverageMinimum(
  value: number | { readonly functions: number; readonly lines: number },
): string {
  return typeof value === "number"
    ? `${value}%`
    : `${value.lines}% lines, ${value.functions}% functions`;
}
