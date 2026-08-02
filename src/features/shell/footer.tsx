import type { ReactNode } from "react";
import { TypographySmall } from "@/components/ui/typography";
import type { ContactLink } from "@/content/schema";
import { IconLink } from "@/components/ui/icon-link";
import { contactIcon } from "@/features/contact/contact-icon";

interface FooterProps {
  readonly brandName: string;
  readonly contacts: ReadonlyArray<ContactLink>;
}

/**
 * @param props - Brand name and contact links from portfolio content.
 * @returns The shared site footer.
 */
export function Footer({ brandName, contacts }: FooterProps): ReactNode {
  return (
    <footer className="border-t border-(--border) bg-(--panel) px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-(--muted) lg:flex-row lg:items-center lg:justify-between">
        <div>
          <TypographySmall as="p" className="font-normal">
            {brandName}
          </TypographySmall>
        </div>
        <address className="flex flex-wrap gap-3 not-italic">
          {contacts.map((contact) => (
            <IconLink href={contact.href} icon={contactIcon(contact.kind)} key={contact.href}>
              {contact.label}
            </IconLink>
          ))}
        </address>
      </div>
    </footer>
  );
}
