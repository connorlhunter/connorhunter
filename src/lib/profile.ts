import type { Profile } from "@/content/schema";

/**
 * @param profile - Profile content loaded from markdown or fallback config.
 * @returns A short greeting name derived from the configured display name.
 */
export function profileGreetingName(profile: Pick<Profile, "name">): string {
  const trimmedName = profile.name.trim();
  const [firstName] = trimmedName.split(/\s+/u);

  return firstName || trimmedName || "there";
}
