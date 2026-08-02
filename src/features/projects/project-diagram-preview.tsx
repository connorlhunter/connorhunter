import { ImageOff, LoaderCircle } from "lucide-react";
import { useState, type ReactNode } from "react";
import { TypographySmall } from "@/components/ui/typography";

interface ProjectDiagramPreviewProps {
  readonly href: string;
  readonly title: string;
}

/**
 * @param props - Public diagram source and accessible project title.
 * @returns A responsive diagram image with local loading and error feedback.
 */
export function ProjectDiagramPreview({ href, title }: ProjectDiagramPreviewProps): ReactNode {
  const [failedHref, setFailedHref] = useState<string | null>(null);
  const [loadedHref, setLoadedHref] = useState<string | null>(null);
  const failed = failedHref === href;
  const loaded = loadedHref === href;

  return (
    <div aria-busy={!loaded && !failed} className="project-diagram-preview">
      <img
        alt={title}
        className="project-diagram-image"
        data-loaded={loaded}
        decoding="async"
        onError={() => setFailedHref(href)}
        onLoad={() => {
          setFailedHref(null);
          setLoadedHref(href);
        }}
        src={href}
      />
      {!loaded && !failed ? (
        <TypographySmall as="p" className="file-viewer-frame-loading" role="status">
          <LoaderCircle aria-hidden="true" className="file-viewer-frame-loading-icon" />
          Loading {title}
        </TypographySmall>
      ) : null}
      {failed ? (
        <TypographySmall as="p" className="project-diagram-error" role="alert">
          <ImageOff aria-hidden="true" className="size-4" />
          Unable to open {title}
        </TypographySmall>
      ) : null}
    </div>
  );
}
