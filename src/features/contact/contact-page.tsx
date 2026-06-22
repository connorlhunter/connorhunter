import { FileText, Mail } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { IconLink } from "@/components/ui/icon-link";
import {
  TypographyEyebrow,
  TypographyH1,
  TypographyMuted,
  TypographyP,
} from "@/components/ui/typography";
import { navigationPage } from "@/content/page-copy";
import type { PortfolioContent } from "@/content/schema";
import { contactIcon } from "./contact-icon";
import { SiteLayout } from "@/features/shell/site-layout";

interface ContactPageProps {
  readonly content: PortfolioContent;
}

/**
 * @param props - Portfolio content containing contact and resume links.
 * @returns The contact page.
 */
export function ContactPage({ content }: ContactPageProps): ReactNode {
  const page = navigationPage(content, "/contact");

  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <header className="page-intro">
            <TypographyH1 className="text-(--warm)">{page.label}</TypographyH1>
            <TypographyP className="mt-5 max-w-3xl">{page.summary}</TypographyP>
          </header>

          <div className="contact-layout mt-10 grid gap-5">
            <article className="surface-card flex flex-col items-start justify-between gap-5 p-5">
              <div className="flex items-start gap-3">
                <span className="resume-document-icon">
                  <FileText aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <TypographyEyebrow as="h2" className="text-(--muted)">
                    Resume
                  </TypographyEyebrow>
                  <TypographyMuted className="mt-3">
                    View the resume with download, email, and full screen actions.
                  </TypographyMuted>
                </div>
              </div>
              <Button asChild className="w-full sm:w-auto" size="large" variant="secondary">
                <a href="/resume">{content.resume.label}</a>
              </Button>
            </article>

            <address className="surface-card grid gap-3 p-5 not-italic sm:grid-cols-2">
              <div className="card-heading sm:col-span-2">
                <span className="resume-document-icon">
                  <Mail aria-hidden="true" className="size-5" />
                </span>
                <TypographyEyebrow as="h2" className="text-(--muted)">
                  {page.label}
                </TypographyEyebrow>
              </div>
              {content.contacts.map((contact) => (
                <IconLink
                  className="min-w-0 rounded-md border border-(--border) bg-(--panel) px-3 py-3 text-(--text) transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-(--accent) hover:bg-(--accent-soft) hover:text-(--accent) hover:no-underline"
                  href={contact.href}
                  icon={contactIcon(contact.kind)}
                  key={contact.href}
                >
                  {contact.label}
                </IconLink>
              ))}
            </address>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
