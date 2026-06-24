import { useEffect, useState } from "react";

/**
 * @param query - Browser media query to track after hydration.
 * @returns Whether the query matches, or undefined before client media state is known.
 */
export function useMediaQuery(query: string): boolean | undefined {
  const [matches, setMatches] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    function syncMatches(): void {
      setMatches(mediaQuery.matches);
    }

    syncMatches();
    mediaQuery.addEventListener("change", syncMatches);

    return () => mediaQuery.removeEventListener("change", syncMatches);
  }, [query]);

  return matches;
}
