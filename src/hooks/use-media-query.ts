import { useMemo, useSyncExternalStore } from "react";

const serverSnapshot = (): undefined => undefined;

/** Subscribes to browser media state while keeping server and hydration output consistent. */
export function useMediaQuery(query: string): boolean | undefined {
  const store = useMemo(() => {
    const media = typeof window === "undefined" ? undefined : window.matchMedia?.(query);
    return {
      getSnapshot: () => media?.matches,
      subscribe: (notify: () => void) => {
        media?.addEventListener("change", notify);
        return () => media?.removeEventListener("change", notify);
      },
    };
  }, [query]);

  return useSyncExternalStore(store.subscribe, store.getSnapshot, serverSnapshot);
}
