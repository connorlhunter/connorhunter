import type { ReactNode } from "react";
import { TypographySmall } from "@/components/ui/typography";
import type { ContactLink } from "@/content/schema";
import { IconLink } from "@/components/ui/icon-link";
import { publicAssetUrl } from "@/config/public-env";
import { contactIcon } from "@/features/contact/contact-icon";

interface FooterProps {
  readonly brandName: string;
  readonly contacts: ReadonlyArray<ContactLink>;
}

interface CryptoBadge {
  readonly alt: string;
  readonly imageClassName: string;
  readonly label: string;
  readonly note: string;
  readonly src: string;
}

const cryptoBadges: ReadonlyArray<CryptoBadge> = [
  {
    alt: "Bitcoin logo",
    imageClassName: "size-7",
    label: "Bitcoiner",
    note: "Since 2025",
    src: publicAssetUrl("assets/crypto/bitcoin-logo.webp"),
  },
  {
    alt: "Litecoin logo",
    imageClassName: "size-7",
    label: "Litecoiner",
    note: "Since 2025",
    src: publicAssetUrl("assets/crypto/litecoin-logo.webp"),
  },
];

/**
 * @param props - Brand name and contact links from portfolio content.
 * @returns The shared site footer.
 */
export function Footer({ brandName, contacts }: FooterProps): ReactNode {
  return (
    <footer className="border-t border-(--border) bg-(--panel) px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 text-sm text-(--muted) lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <TypographySmall as="p" className="font-normal">
            {brandName}
          </TypographySmall>
          <ul aria-label="Crypto affiliations" className="flex flex-wrap gap-2">
            {cryptoBadges.map((badge) => (
              <li
                className="flex items-center gap-2 rounded-md border border-(--border) bg-(--bg) px-2.5 py-2 text-(--text)"
                key={badge.label}
              >
                <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-(--border)">
                  <img
                    alt={badge.alt}
                    className={`${badge.imageClassName} object-contain`}
                    decoding="async"
                    height="36"
                    loading="lazy"
                    src={badge.src}
                    width="36"
                  />
                </span>
                <span className="grid leading-tight">
                  <TypographySmall className="font-bold text-(--text)">
                    {badge.label}
                  </TypographySmall>
                  <TypographySmall className="text-xs">{badge.note}</TypographySmall>
                </span>
              </li>
            ))}
          </ul>
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
