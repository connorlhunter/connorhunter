import { GitBranch, Mail, Network, Phone } from "lucide-react";
import type { ReactNode } from "react";
import type { ContactLink } from "@/content/schema";

/**
 * @param kind - Contact link type from content.
 * @returns The icon used for that contact type.
 */
export function contactIcon(kind: ContactLink["kind"]): ReactNode {
  if (kind === "email") {
    return <Mail aria-hidden="true" className="size-4" />;
  }

  if (kind === "github") {
    return <GitBranch aria-hidden="true" className="size-4" />;
  }

  if (kind === "linkedin") {
    return <Network aria-hidden="true" className="size-4" />;
  }

  return <Phone aria-hidden="true" className="size-4" />;
}
