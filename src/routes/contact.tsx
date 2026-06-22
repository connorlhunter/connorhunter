import type { ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { getPortfolioContent } from "@/content";
import { ContactPage } from "@/features/contact/contact-page";
import { buildPageHead } from "@/lib/seo";

/**
 * @description Contact route backed by dynamic portfolio content.
 */
export const Route = createFileRoute("/contact")({
  loader: () => getPortfolioContent(),
  head: () => buildPageHead("Contact", "Resume and contact links.", "/contact"),
  component: ContactRoute,
});

/**
 * @returns The contact page with loaded portfolio content.
 */
function ContactRoute(): ReactNode {
  const content = Route.useLoaderData();

  return <ContactPage content={content} />;
}
