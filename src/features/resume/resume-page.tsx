import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { absoluteSiteUrl } from "@/config/public-env";
import type { PortfolioContent } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";
import { FileViewer } from "@/features/viewer/file-viewer";
import { emailContact, mailtoHref } from "@/lib/contact";
import { profileGreetingName } from "@/lib/profile";

interface ResumePageProps {
  readonly content: PortfolioContent;
}

const resumePageCount = 2;

function resumeViewerSource(href: string, page: number): string {
  return `${href}#page=${page}&view=FitH`;
}

/**
 * @param props - Portfolio content containing resume and contact data.
 * @returns The resume PDF viewer page.
 */
export function ResumePage({ content }: ResumePageProps): ReactNode {
  const [currentPage, setCurrentPage] = useState(1);
  const resumeUrl = absoluteSiteUrl(content.resume.href);
  const emailHref = mailtoHref(
    emailContact(content.contacts),
    "Resume follow-up",
    `Hi ${profileGreetingName(content.profile)},\n\nI viewed your resume here:\n${resumeUrl}\n`,
  );
  const viewerSource = resumeViewerSource(content.resume.href, currentPage);

  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <nav aria-label="Resume navigation" className="mb-8">
            <Button asChild variant="outline">
              <a href="/contact">
                <ArrowLeft aria-hidden="true" className="size-4" />
                Contact
              </a>
            </Button>
          </nav>

          <FileViewer
            ariaLabel="Resume viewer"
            downloadHref={content.resume.href}
            emailHref={emailHref}
            iframeTitle={`${content.profile.name} resume PDF`}
            icon={<FileText aria-hidden="true" className="size-5" />}
            openHref={content.resume.href}
            renderHeader={({ actions, heading }) => (
              <div className="file-viewer-toolbar resume-viewer-toolbar">
                <div className="resume-viewer-toolbar-main">
                  {heading}
                  {actions}
                </div>
                <nav aria-label="Resume pages" className="resume-page-controls">
                  <Button
                    aria-label="Previous resume page"
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((page) => Math.max(1, page - 1));
                    }}
                    size="small"
                    type="button"
                    variant="outline"
                  >
                    <ChevronLeft aria-hidden="true" className="size-4" />
                    Previous
                  </Button>
                  <span aria-live="polite" className="resume-page-indicator">
                    Page {currentPage} of {resumePageCount}
                  </span>
                  <Button
                    aria-label="Next resume page"
                    disabled={currentPage === resumePageCount}
                    onClick={() => {
                      setCurrentPage((page) => Math.min(resumePageCount, page + 1));
                    }}
                    size="small"
                    type="button"
                    variant="outline"
                  >
                    Next
                    <ChevronRight aria-hidden="true" className="size-4" />
                  </Button>
                </nav>
              </div>
            )}
            sourceHref={viewerSource}
            title={content.resume.label}
          />
        </div>
      </section>
    </SiteLayout>
  );
}
