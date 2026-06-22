import { ArrowLeft, Compass } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { StatusPanel } from "@/components/ui/status-panel";
import type { PortfolioContent } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";

interface NotFoundPageProps {
  readonly content: PortfolioContent;
}

/**
 * @param props - Portfolio shell content.
 * @returns The route not-found page.
 */
export function NotFoundPage({ content }: NotFoundPageProps): ReactNode {
  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <StatusPanel
            actions={
              <>
                <Button asChild variant="secondary">
                  <a href="/">
                    <ArrowLeft aria-hidden="true" className="size-4" />
                    Home
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href="/projects">Projects</a>
                </Button>
              </>
            }
            eyebrow="404"
            headingId="route-not-found-heading"
            icon={<Compass aria-hidden="true" className="size-6" />}
            message="The page may have moved, or the route does not exist in the portfolio."
            title="Page not found"
          />
        </div>
      </section>
    </SiteLayout>
  );
}
