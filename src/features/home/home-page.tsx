import { ArrowRight, BriefcaseBusiness, Code2, Layers3, Mail } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import {
  TypographyEyebrow,
  TypographyH1,
  TypographyH2,
  TypographyH4,
  TypographyLead,
  TypographyMuted,
  TypographyP,
  TypographySmall,
} from "@/components/ui/typography";
import type { NavigationItem, PortfolioContent } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";
import { FeaturedWorkCarousel } from "./featured-work-carousel";

interface HomePageProps {
  readonly content: PortfolioContent;
}

const navigationIcons: ReadonlyArray<ComponentType<{ className?: string }>> = [
  Code2,
  Layers3,
  BriefcaseBusiness,
  Mail,
];

/**
 * @param props - Navigation item and display icon.
 * @returns A landing page navigation card.
 */
function FeaturedLinkCard({
  icon: Icon,
  item,
}: {
  readonly icon: ComponentType<{ className?: string }>;
  readonly item: NavigationItem;
}): ReactNode {
  return (
    <a
      className="home-link-card surface-card surface-card-hover group block p-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      href={item.href}
    >
      <span className="home-link-icon mb-5 inline-flex size-10 items-center justify-center rounded-md bg-(--accent-soft) text-(--accent)">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <TypographyH4 as="h2">{item.label}</TypographyH4>
      <TypographyMuted className="mt-2">{item.summary}</TypographyMuted>
      <TypographySmall className="mt-5 inline-flex items-center gap-2 font-bold text-(--accent)">
        View page
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform group-hover:translate-x-1"
        />
      </TypographySmall>
    </a>
  );
}

/**
 * @param props - Complete portfolio content.
 * @returns The homepage landing experience.
 */
export function HomePage({ content }: HomePageProps): ReactNode {
  return (
    <SiteLayout content={content} contentSource="Profile and projects">
      <section className="home-hero-band page-band">
        <div className="home-hero-layout page-container grid gap-10 lg:items-center">
          <div className="home-hero-copy">
            <TypographyEyebrow className="text-(--warm)">{content.profile.role}</TypographyEyebrow>
            <TypographyH1 className="mt-4 max-w-4xl">{content.profile.name}</TypographyH1>
            <TypographyLead className="mt-6 max-w-3xl">{content.profile.intro}</TypographyLead>
            <TypographyP className="mt-5 max-w-3xl">{content.profile.positioning}</TypographyP>
          </div>

          <aside
            aria-labelledby="featured-work-heading"
            className="home-featured-panel surface-card"
          >
            <TypographyEyebrow as="h2" className="text-(--muted)" id="featured-work-heading">
              Featured Work
            </TypographyEyebrow>
            <FeaturedWorkCarousel
              configuration={content.featuredWork}
              projects={content.projects}
            />
          </aside>
        </div>
      </section>

      <section className="home-explore-band page-band-compact border-y border-(--border)">
        <div className="page-container">
          <div className="home-explore-heading mb-6">
            <div>
              <TypographyEyebrow className="text-(--muted)">Explore</TypographyEyebrow>
              <TypographyH2 className="mt-2">Main Pages</TypographyH2>
            </div>
          </div>
          <div className="home-link-grid grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {content.navigation.map((item, index) => {
              const Icon = navigationIcons[index % navigationIcons.length] ?? Code2;

              return <FeaturedLinkCard icon={Icon} item={item} key={item.href} />;
            })}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
