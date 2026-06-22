import { ArrowLeft, FileText } from "lucide-react";
import type { ReactNode } from "react";
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

/**
 * @param props - Portfolio content containing resume and contact data.
 * @returns The resume PDF viewer page.
 */
export function ResumePage({ content }: ResumePageProps): ReactNode {
  const resumeUrl = absoluteSiteUrl(content.resume.href);
  const emailHref = mailtoHref(
    emailContact(content.contacts),
    "Resume follow-up",
    `Hi ${profileGreetingName(content.profile)},\n\nI viewed your resume here:\n${resumeUrl}\n`,
  );
  const viewerSource = `${content.resume.href}#view=FitH`;

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
            sourceHref={viewerSource}
            title={content.resume.label}
          />
        </div>
      </section>
    </SiteLayout>
  );
}
