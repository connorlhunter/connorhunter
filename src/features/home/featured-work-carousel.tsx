import { ChevronLeft, ChevronRight, Clock3, ShieldCheck, Sparkles, Tag } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { FeaturedWork, FeaturedWorkBadge, FeaturedWorkItem, Project } from "@/content/schema";
import { ProjectStatusBadge } from "@/features/projects/project-status-badge";
import { projectsPageViewerHref } from "@/features/projects/project-viewer-model";
import { ThemedIconImage } from "@/features/theme/theme-icon";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/cn";
import { TypographyMuted, TypographySmall } from "@/components/ui/typography";

const placeholderImage = `data:image/svg+xml,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" fill="none">
    <defs>
      <linearGradient id="base" x1="80" y1="56" x2="1120" y2="744" gradientUnits="userSpaceOnUse">
        <stop stop-color="#132b52"/>
        <stop offset="1" stop-color="#07111f"/>
      </linearGradient>
      <radialGradient id="glow" cx="0" cy="0" r="1" gradientTransform="translate(930 172) rotate(135) scale(550 710)" gradientUnits="userSpaceOnUse">
        <stop stop-color="#6f9cff" stop-opacity=".72"/>
        <stop offset="1" stop-color="#6f9cff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#base)"/>
    <rect width="1200" height="800" fill="url(#glow)"/>
    <path d="M-50 654C165 490 353 744 565 549c147-136 284-382 681-249" stroke="#9ab7ff" stroke-opacity=".28" stroke-width="2"/>
    <path d="M24 752C231 586 395 798 616 610c135-115 277-288 638-172" stroke="#9ab7ff" stroke-opacity=".18" stroke-width="2"/>
    <g fill="#c8d9ff" fill-opacity=".34">
      <circle cx="198" cy="218" r="4"/><circle cx="258" cy="184" r="2"/><circle cx="976" cy="302" r="3"/><circle cx="1060" cy="228" r="4"/><circle cx="850" cy="580" r="3"/>
    </g>
  </svg>
`)}`;

const badgeIcons = {
  clock: Clock3,
  shield: ShieldCheck,
  sparkles: Sparkles,
  tag: Tag,
} as const;

interface FeaturedWorkCarouselProps {
  readonly configuration?: FeaturedWork | undefined;
  readonly projects: ReadonlyArray<Project>;
}

interface ProjectFeaturedItem {
  readonly kind: "project";
  readonly project: Project;
}

interface ConfiguredFeaturedItem {
  readonly item: FeaturedWorkItem;
  readonly kind: "configured";
  readonly project?: Project | undefined;
}

type CarouselItem = ConfiguredFeaturedItem | ProjectFeaturedItem;

interface CarouselPage {
  readonly id: string;
  readonly items: ReadonlyArray<CarouselItem>;
  readonly presentation: "images" | "projects";
}

/**
 * @param projects - Published projects, in their configured display order.
 * @returns The established first page of compact project cards.
 */
function projectPages(projects: ReadonlyArray<Project>): ReadonlyArray<CarouselPage> {
  const firstPage = projects.slice(0, 3).map((project) => ({ kind: "project", project }) as const);
  return firstPage.length > 0
    ? [{ id: "projects-1", items: firstPage, presentation: "projects" }]
    : [];
}

/**
 * @param configuration - Optional artifact-backed configuration for extra slides.
 * @returns One image-only carousel page per configured item.
 */
function configuredPages(
  configuration: FeaturedWork | undefined,
  projects: ReadonlyArray<Project>,
): ReadonlyArray<CarouselPage> {
  return (configuration?.additionalPages ?? []).flatMap((page) =>
    page.items.map((item) => ({
      id: `${page.id}-${item.id}`,
      items: [
        {
          item,
          kind: "configured",
          project: projects.find((project) => project.slug === item.projectSlug),
        },
      ] as const,
      presentation: "images" as const,
    })),
  );
}

/**
 * @param value - Current index.
 * @param size - Number of available pages.
 * @returns A looped index, safe for both next and previous navigation.
 */
function wrappedIndex(value: number, size: number): number {
  return ((value % size) + size) % size;
}

/**
 * @param props - Configured badge visual data.
 * @returns A compact footer badge, or nothing when it is not configured.
 */
function FeaturedWorkBadge({
  badge,
}: {
  readonly badge?: FeaturedWorkBadge | undefined;
}): ReactNode {
  if (!badge) return null;

  const Icon = badge.icon ? badgeIcons[badge.icon] : null;

  return (
    <span className={cn("home-featured-item-badge", `home-featured-item-badge--${badge.tone}`)}>
      {Icon ? <Icon aria-hidden="true" className="size-3.5" /> : null}
      {badge.label}
    </span>
  );
}

/**
 * @param props - A standard project on the first Featured Work page.
 * @returns The established compact project card with its familiar status badge treatment.
 */
function FeaturedProjectCard({ project }: { readonly project: Project }): ReactNode {
  return (
    <a
      className="home-project-card surface-card surface-card-hover flex min-w-0 gap-4 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      href={projectsPageViewerHref(project.slug)}
    >
      <ThemedIconImage
        alt=""
        aria-hidden="true"
        className={cn(
          "home-project-icon project-asset-icon",
          project.slug === "cipher" && "project-asset-icon--canonical",
        )}
        src={project.icon}
      />
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2">
          <TypographySmall className="font-bold text-(--text)">{project.title}</TypographySmall>
          <ProjectStatusBadge project={project} />
        </span>
        <TypographyMuted as="span" className="mt-1 line-clamp-2 block">
          {project.summary}
        </TypographyMuted>
      </span>
    </a>
  );
}

/**
 * @param props - An image-only page item sourced from a project or published configuration.
 * @returns A full-bleed image link with project context anchored at its lower-left corner.
 */
function FeaturedImageCard({ item }: { readonly item: CarouselItem }): ReactNode {
  const configured = item.kind === "configured" ? item.item : undefined;
  const project = item.kind === "project" ? item.project : item.project;
  const href = configured ? configured.href : projectsPageViewerHref(project?.slug ?? "");
  const label = configured?.title ?? project?.title ?? "Project";
  const summary = configured?.summary ?? project?.summary;
  const imageHref = configured?.imageHref ?? placeholderImage;

  return (
    <a
      aria-label={label}
      className="home-featured-image-item group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--accent)"
      href={href}
    >
      <img alt="" className="home-featured-image" draggable="false" src={imageHref} />
      <span className="home-featured-image-details">
        {project ? (
          <ThemedIconImage
            alt=""
            aria-hidden="true"
            className={cn(
              "home-featured-image-project-icon project-asset-icon",
              project.slug === "cipher" && "project-asset-icon--canonical",
            )}
            src={project.icon}
          />
        ) : null}
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2">
            <TypographySmall className="font-bold text-(--text)">{label}</TypographySmall>
            {configured?.badge ? <FeaturedWorkBadge badge={configured.badge} /> : null}
          </span>
          {summary ? (
            <TypographyMuted as="span" className="mt-1 line-clamp-2 block">
              {summary}
            </TypographyMuted>
          ) : null}
        </span>
      </span>
    </a>
  );
}

/**
 * @param props - Featured projects and optional artifact-backed pages.
 * @returns An auto-advancing, keyboard-accessible carousel with touch swipe support.
 */
export function FeaturedWorkCarousel({
  configuration,
  projects,
}: FeaturedWorkCarouselProps): ReactNode {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)") ?? false;
  const [activePage, setActivePage] = useState(0);
  const [paused, setPaused] = useState(false);
  const pointerStartX = useRef<number | null>(null);
  const pages = useMemo(
    () => [...projectPages(projects), ...configuredPages(configuration, projects)],
    [configuration, projects],
  );
  const pageCount = pages.length;
  const intervalMs = configuration?.autoAdvanceMs ?? 9_000;
  useEffect(() => {
    setActivePage((current) => (current >= pageCount ? 0 : current));
  }, [pageCount]);

  const moveBy = useCallback(
    (offset: number) => {
      if (pageCount > 1) setActivePage((current) => wrappedIndex(current + offset, pageCount));
    },
    [pageCount],
  );

  useEffect(() => {
    if (pageCount < 2 || paused || reducedMotion) return;

    const timer = window.setInterval(() => moveBy(1), intervalMs);

    return () => window.clearInterval(timer);
  }, [intervalMs, moveBy, pageCount, paused, reducedMotion]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>): void {
    pointerStartX.current = event.pointerType === "touch" ? event.clientX : null;
  }

  function onPointerEnd(event: ReactPointerEvent<HTMLDivElement>): void {
    const startX = pointerStartX.current;
    pointerStartX.current = null;

    if (startX === null || event.pointerType !== "touch") return;

    const distance = event.clientX - startX;

    if (Math.abs(distance) < 48) return;

    moveBy(distance < 0 ? 1 : -1);
  }

  if (pageCount === 0) return null;

  return (
    <div
      aria-label="Featured work"
      aria-roledescription="carousel"
      className="home-featured-carousel"
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onFocusCapture={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerCancel={() => {
        pointerStartX.current = null;
      }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerEnd}
    >
      <div className="home-featured-carousel-viewport">
        <div
          className="home-featured-carousel-track"
          style={{ transform: `translate3d(-${activePage * 100}%, 0, 0)` }}
        >
          {pages.map((page, pageIndex) => (
            <div
              aria-hidden={pageIndex !== activePage}
              aria-label={`${pageIndex + 1} of ${pageCount}`}
              className="home-featured-carousel-page"
              inert={pageIndex !== activePage ? true : undefined}
              key={page.id}
              role="group"
            >
              <div
                className={cn(
                  "home-featured-list grid gap-3",
                  page.presentation === "images" && "home-featured-list--images",
                )}
              >
                {page.items.map((item) => (
                  <div key={item.kind === "project" ? item.project.slug : item.item.id}>
                    {page.presentation === "projects" && item.kind === "project" ? (
                      <FeaturedProjectCard project={item.project} />
                    ) : (
                      <FeaturedImageCard item={item} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {pageCount > 1 ? (
        <>
          <button
            aria-label="Show previous featured work"
            className="home-featured-carousel-control home-featured-carousel-control--previous"
            onClick={() => moveBy(-1)}
            type="button"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <button
            aria-label="Show next featured work"
            className="home-featured-carousel-control home-featured-carousel-control--next"
            onClick={() => moveBy(1)}
            type="button"
          >
            <ChevronRight aria-hidden="true" />
          </button>
          <div className="home-featured-carousel-footer">
            <div
              aria-label="Featured work pages"
              className="home-featured-carousel-pagination"
              role="tablist"
            >
              {pages.map((page, pageIndex) => (
                <button
                  aria-label={`Show featured work page ${pageIndex + 1}`}
                  aria-selected={pageIndex === activePage}
                  className="home-featured-carousel-dot"
                  key={page.id}
                  onClick={() => setActivePage(pageIndex)}
                  role="tab"
                  type="button"
                />
              ))}
            </div>
            <span aria-hidden="true" />
          </div>
        </>
      ) : null}
    </div>
  );
}
