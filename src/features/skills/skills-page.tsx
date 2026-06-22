import {
  Blocks,
  Boxes,
  Cloud,
  Code2,
  Cpu,
  Database,
  FlaskConical,
  Hammer,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  TypographyChip,
  TypographyH1,
  TypographyH4,
  TypographyP,
} from "@/components/ui/typography";
import { navigationPage } from "@/content/page-copy";
import type { PortfolioContent, SkillGroup } from "@/content/schema";
import { SiteLayout } from "@/features/shell/site-layout";

interface SkillsPageProps {
  readonly content: PortfolioContent;
}

const skillGroupIcons = new Map<string, LucideIcon>([
  ["Architecture", Boxes],
  ["Backend", Cpu],
  ["Cloud / Infrastructure", Cloud],
  ["Databases", Database],
  ["Frontend", Blocks],
  ["Languages", Code2],
  ["Testing", FlaskConical],
  ["Tooling", Hammer],
]);

/**
 * @param group - Skill group from content.
 * @returns The icon used for that skill category.
 */
function skillGroupIcon(group: SkillGroup): LucideIcon {
  return skillGroupIcons.get(group.title) ?? Blocks;
}

/**
 * @param props - Portfolio content containing skill groups.
 * @returns The skills page.
 */
export function SkillsPage({ content }: SkillsPageProps): ReactNode {
  const page = navigationPage(content, "/skills");

  return (
    <SiteLayout content={content}>
      <section className="page-band">
        <div className="page-container">
          <header className="page-intro">
            <TypographyH1 className="text-(--warm)">{page.label}</TypographyH1>
            <TypographyP className="mt-5">{page.summary}</TypographyP>
          </header>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {content.skills.map((group) => {
              const Icon = skillGroupIcon(group);

              return (
                <section className="surface-card p-5" key={group.title}>
                  <div className="card-heading">
                    <span className="content-card-icon">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    <TypographyH4 as="h2">{group.title}</TypographyH4>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2" role="list">
                    {group.skills.map((skill) => (
                      <TypographyChip key={skill} role="listitem">
                        {skill}
                      </TypographyChip>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
