import type { PortfolioContent, Project } from "@/content/schema";
import { absoluteSiteUrl, artifactUrl, publicAssetUrl } from "@/config/public-env";

const baseArtifacts = [
  {
    label: "Docs" as const,
    href: artifactUrl("docs/example/index.html"),
  },
  {
    label: "Coverage" as const,
    href: artifactUrl("projects/example/coverage/index.html"),
  },
  {
    label: "Diagrams" as const,
    href: artifactUrl("diagrams/example/example-overview.svg"),
    items: [
      {
        id: "overview",
        label: "Overview",
        href: artifactUrl("diagrams/example/example-overview.svg"),
      },
      {
        id: "detail",
        label: "Detail",
        href: artifactUrl("diagrams/example/example-detail.svg"),
      },
    ],
  },
];

export const projectWithDownloads: Project = {
  slug: "desktop-tool",
  title: "Desktop Tool",
  summary: "A generic desktop project used by component tests.",
  status: "Preview",
  kind: "desktop",
  problem: "Coordinate a desktop workflow with external resources.",
  architecture: "A local client renders data from typed project metadata.",
  stack: ["Framework", "Language"],
  icon: publicAssetUrl("icons/example/mark.svg"),
  links: [
    {
      kind: "live",
      label: "Open",
      href: absoluteSiteUrl("/example"),
    },
    {
      kind: "source",
      label: "Source",
      href: "https://example.com/source",
    },
    {
      kind: "roadmap",
      label: "Roadmap",
      href: "https://example.com/roadmap",
    },
  ],
  downloads: [
    {
      platform: "mac",
      label: "Mac",
      href: "https://example.com/downloads/mac",
      comingSoon: true,
    },
    {
      platform: "windows",
      label: "Windows",
      href: "https://example.com/downloads/windows",
      comingSoon: true,
    },
  ],
  artifacts: baseArtifacts,
  markdown: "Generic project notes body.",
};

export const projectWithoutDownloads: Project = {
  ...projectWithDownloads,
  slug: "web-tool",
  title: "Web Tool",
  kind: "web",
  links: [
    {
      kind: "source",
      label: "Source",
      href: "https://example.com/web-source",
      comingSoon: true,
    },
    {
      kind: "roadmap",
      label: "Roadmap",
      href: "https://example.com/web-roadmap",
    },
  ],
  downloads: [],
};

export const mockContent: PortfolioContent = {
  profile: {
    name: "Example Person",
    role: "Example role",
    location: "Example location",
    intro: "Example intro.",
    summary: "Example summary.",
    positioning: "Example positioning.",
  },
  contacts: [
    {
      kind: "email",
      label: "example@example.com",
      href: "mailto:example@example.com",
    },
  ],
  resume: {
    label: "Resume",
    href: publicAssetUrl("resume/example.pdf"),
  },
  navigation: [
    {
      href: "/skills",
      label: "Skills",
      summary: "Example skills page.",
    },
    {
      href: "/projects",
      label: "Projects",
      summary: "Example projects page.",
    },
    {
      href: "/experience",
      label: "Experience",
      summary: "Example experience page.",
    },
    {
      href: "/contact",
      label: "Contact",
      summary: "Example contact page.",
    },
  ],
  skills: [
    {
      title: "Example Category",
      skills: ["Example Skill"],
    },
  ],
  experience: [
    {
      title: "Example Role",
      organization: "Example Organization",
      range: "Example Range",
      location: "Example Location",
      bullets: ["Example responsibility."],
    },
  ],
  education: [
    {
      title: "Example Education",
      organization: "Example School",
      range: "Example Range",
      location: "Example Location",
      bullets: ["Example coursework."],
    },
  ],
  certifications: [
    {
      title: "Example Certification",
      issuer: "Example Issuer",
      date: "Example Date",
    },
  ],
  projects: [projectWithDownloads, projectWithoutDownloads],
};
