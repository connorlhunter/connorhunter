import { Award, BriefcaseBusiness, GraduationCap, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { IconLink } from "@/components/ui/icon-link";
import {
  TypographyH1,
  TypographyH3,
  TypographyH4,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import { navigationPage } from "@/content/page-copy";
import type { CertificationItem, PortfolioContent, TimelineItem } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";

interface ExperiencePageProps {
  readonly content: PortfolioContent;
}

/**
 * @param props - Icon, title, and dated timeline items for one experience group.
 * @returns A card section containing timeline entries.
 */
function TimelineList({
  Icon,
  items,
  title,
}: {
  readonly Icon: LucideIcon;
  readonly items: ReadonlyArray<TimelineItem>;
  readonly title: string;
}): ReactNode {
  return (
    <section className="surface-card p-5">
      <div className="card-heading">
        <span className="content-card-icon">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <TypographyH3 as="h2">{title}</TypographyH3>
      </div>
      <div className="mt-6 space-y-5">
        {items.map((item) => (
          <article
            className="border-l-2 border-(--border) pl-5"
            key={`${item.organization}-${item.title}`}
          >
            <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
              <TypographyH4 as="h3" className="text-base">
                {item.title}
              </TypographyH4>
              <TypographySmall as="p">{item.range}</TypographySmall>
            </div>
            <TypographySmall as="p" className="mt-1 text-(--accent)">
              {item.organization} · {item.location}
            </TypographySmall>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-(--muted)">
              {item.bullets.map((bullet) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * @param props - Certification records from portfolio content.
 * @returns A card section containing certification entries.
 */
function CertificationList({
  items,
}: {
  readonly items: ReadonlyArray<CertificationItem>;
}): ReactNode {
  return (
    <section className="surface-card p-5">
      <div className="card-heading">
        <span className="content-card-icon">
          <Award aria-hidden="true" className="size-5" />
        </span>
        <TypographyH3 as="h2">Certifications</TypographyH3>
      </div>
      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <article className="border-l-2 border-(--border) pl-5" key={item.title}>
            <TypographyH4 as="h3" className="text-base">
              {item.title}
            </TypographyH4>
            <dl className="mt-2 grid gap-1">
              <div>
                <TypographySmall as="dt" className="sr-only">
                  Issuer
                </TypographySmall>
                <TypographySmall as="dd" className="text-(--accent)">
                  {item.issuer}
                </TypographySmall>
              </div>
              <div className="flex flex-wrap items-baseline gap-x-2">
                <TypographySmall as="dt">Issued</TypographySmall>
                <TypographySmall as="dd" className="font-normal">
                  <time>{item.date}</time>
                </TypographySmall>
              </div>
              {item.reissuanceDates?.map((date) => (
                <div className="flex flex-wrap items-baseline gap-x-2" key={date}>
                  <TypographySmall as="dt">Reissued</TypographySmall>
                  <TypographySmall as="dd" className="font-normal">
                    <time>{date}</time>
                  </TypographySmall>
                </div>
              ))}
            </dl>
            <IconLink className="mt-3" href={item.href}>
              <span className="sr-only">{item.title}: </span>
              View credential
            </IconLink>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * @param props - Portfolio content containing work, education, and certifications.
 * @returns The experience page.
 */
export function ExperiencePage({ content }: ExperiencePageProps): ReactNode {
  const page = navigationPage(content, "/experience");

  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <header className="page-intro">
            <TypographyH1 className="text-(--warm)">{page.label}</TypographyH1>
            <TypographyP className="mt-5">{page.summary}</TypographyP>
          </header>

          <div className="experience-layout mt-10 grid gap-6">
            <TimelineList Icon={BriefcaseBusiness} items={content.experience} title="Work" />
            <div className="grid gap-6">
              <TimelineList Icon={GraduationCap} items={content.education} title="Education" />
              <CertificationList items={content.certifications} />
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
