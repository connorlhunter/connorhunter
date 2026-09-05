import { RefreshCw, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import { SiteLayout, type SiteShellContent } from "@/features/shell/site-layout";

interface ErrorPageProps {
  readonly content: SiteShellContent;
  readonly onRetry: () => void;
}

/**
 * @param props - Portfolio shell content and retry callback.
 * @returns The route error fallback page.
 */
export function ErrorPage({ content, onRetry }: ErrorPageProps): ReactNode {
  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <StatusPanel
            actions={
              <Button onClick={onRetry} type="button" variant="secondary">
                <RefreshCw aria-hidden="true" className="size-4" />
                Retry
              </Button>
            }
            eyebrow="Error"
            headingId="route-error-heading"
            icon={<TriangleAlert aria-hidden="true" className="size-6" />}
            message="The portfolio hit an unexpected issue while loading this page."
            title="Something went wrong"
          />
        </div>
      </section>
    </SiteLayout>
  );
}
