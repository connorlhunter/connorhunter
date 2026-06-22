import { publicConfig } from "@/config/public-env";
import type { SiteShellContent } from "@/features/shell/site-layout";

/**
 * @description Minimal shell content used when dynamic content loading fails.
 */
export const fallbackShellContent: SiteShellContent = {
  profile: {
    name: publicConfig.siteName,
    role: "Portfolio",
    location: "",
    intro: publicConfig.siteDescription,
    summary: publicConfig.siteDescription,
    positioning: publicConfig.siteDescription,
  },
  navigation: [],
  contacts: [
    {
      kind: "email",
      label: publicConfig.contactEmail,
      href: publicConfig.contactEmailHref,
    },
    {
      kind: "phone",
      label: publicConfig.contactPhoneLabel,
      href: publicConfig.contactPhoneHref,
    },
    {
      kind: "github",
      label: publicConfig.githubProfileLabel,
      href: publicConfig.githubProfileUrl,
    },
    {
      kind: "linkedin",
      label: publicConfig.linkedinLabel,
      href: publicConfig.linkedinUrl,
    },
  ],
  resume: {
    label: "Resume",
    href: "/resume",
  },
};
