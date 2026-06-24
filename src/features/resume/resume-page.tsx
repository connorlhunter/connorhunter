import { ArrowLeft, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { absoluteSiteUrl } from "@/config/public-env";
import type { PortfolioContent } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";
import { FileViewer } from "@/features/viewer/file-viewer";
import { emailContact, mailtoHref } from "@/lib/contact";
import { profileGreetingName } from "@/lib/profile";
import { ResumePdfPreview, type ResumePdfDocumentLoader } from "./resume-pdf-preview";

interface ResumePageProps {
  readonly content: PortfolioContent;
  readonly loadResumeDocument?: ResumePdfDocumentLoader | undefined;
}

const resumePageCount = 2;

/**
 * @param props - Portfolio content containing resume and contact data.
 * @returns The resume PDF viewer page.
 */
export function ResumePage({ content, loadResumeDocument }: ResumePageProps): ReactNode {
  const [currentPage, setCurrentPage] = useState(1);
  const resumeUrl = absoluteSiteUrl(content.resume.href);
  const emailHref = mailtoHref(
    emailContact(content.contacts),
    "Resume follow-up",
    `Hi ${profileGreetingName(content.profile)},\n\nI viewed your resume here:\n${resumeUrl}\n`,
  );

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
            title={content.resume.label}
          >
            <ResumePdfPreview
              href={content.resume.href}
              loadDocument={loadResumeDocument}
              page={currentPage}
              title={`${content.profile.name} resume page ${currentPage}`}
            />
          </FileViewer>
        </div>
      </section>
    </SiteLayout>
  );
}
