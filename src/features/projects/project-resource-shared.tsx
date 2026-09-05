import { Download, FileText, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import type { ArtifactState } from "@/content/artifacts/queries";
import type { ArtifactLink, Project } from "@/content/schema";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";

export function artifact(project: Project, label: ArtifactLink["label"]): ArtifactLink | undefined {
  return project.artifacts.find((item) => item.label === label);
}

export function ResourceState({
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
        eyebrow="Resource unavailable"
        actions={
          state.retry ? (
            <Button onClick={state.retry} variant="outline">
              Try again
            </Button>
          ) : undefined
        }
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

export function ResourceSidebarHeader({
  title,
  downloadHref,
}: {
  readonly title: string | undefined;
  readonly downloadHref: string | undefined;
}): ReactNode {
  return (
    <div className="docs-reader-sidebar-top">
      <div className="docs-reader-sidebar-heading">
        <FileText aria-hidden="true" className="size-4" /> {title}
      </div>
      {downloadHref ? (
        <a className="docs-reader-download docs-reader-download--top" href={downloadHref}>
          <Download aria-hidden="true" className="size-4" /> Download PDF
        </a>
      ) : null}
    </div>
  );
}
