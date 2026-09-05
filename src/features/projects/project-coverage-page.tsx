import { useState, type ReactNode } from "react";
import { coverageArtifactSchema } from "./project-resource-schema";
import { useArtifactJson } from "@/content/artifacts/queries";
import { TypographyEyebrow, TypographyH2, TypographySmall } from "@/components/ui/typography";
import type { ArtifactLink, Project } from "@/content/schema";
import { artifact, ResourceState, ResourceSidebarHeader } from "./project-resource-shared";

/** Data-led coverage page rendered by the portfolio rather than an embedded report. */
export function ProjectCoveragePage({ project }: { readonly project: Project }): ReactNode {
  const coverage = artifact(project, "Coverage");
  return <CoverageReader key={`${project.slug}:${coverage?.href ?? ""}`} coverage={coverage} />;
}

function CoverageReader({ coverage }: { readonly coverage: ArtifactLink | undefined }): ReactNode {
  const state = useArtifactJson(coverage?.href, coverageArtifactSchema);
  const [surfaceId, setSurfaceId] = useState<string | undefined>();
  const surface =
    state.data?.surfaces.find((item) => item.id === surfaceId) ?? state.data?.surfaces[0];
  return (
    <ResourceState state={state} title="coverage">
      {state.data && surface ? (
        <section className="coverage-reader">
          <aside className="coverage-reader-sidebar">
            <ResourceSidebarHeader title="Coverage" downloadHref={coverage?.downloadHref} />
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
            <div className="resource-segmented-control" role="group" aria-label="Coverage surface">
              {state.data.surfaces.map((item) => (
                <button
                  aria-pressed={item.id === surface.id}
                  key={item.id}
                  onClick={() => setSurfaceId(item.id)}
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
