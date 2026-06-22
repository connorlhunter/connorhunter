import type { ContactLink } from "@/content/schema";

/**
 * @param contacts - Contact links from portfolio content.
 * @returns The email contact, if one is configured.
 */
export function emailContact(contacts: ReadonlyArray<ContactLink>): ContactLink | undefined {
  return contacts.find((contact) => contact.kind === "email");
}

/**
 * @param contact - Optional email contact link.
 * @param subject - Email subject before URL encoding.
 * @param body - Email body before URL encoding.
 * @returns A mailto href that preserves existing query params.
 */
export function mailtoHref(
  contact: ContactLink | undefined,
  subject: string,
  body: string,
): string {
  const baseHref = contact?.href ?? "mailto:";
  const separator = baseHref.includes("?") ? "&" : "?";

  return `${baseHref}${separator}subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body,
  )}`;
}
