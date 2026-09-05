import { afterEach, expect, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { useMediaQuery } from "@/hooks/use-media-query";

const originalMatchMedia = window.matchMedia;
afterEach(() => {
  cleanup();
  window.matchMedia = originalMatchMedia;
});

test("tracks media changes and replaces the subscription when the query changes", () => {
  const listeners = new Map<string, () => void>();
  const values = new Map<string, boolean>([
    ["wide", false],
    ["touch", true],
  ]);
  window.matchMedia = (query) => ({
    ...originalMatchMedia(query),
    get matches() {
      return values.get(query) ?? false;
    },
    addEventListener: (_type: string, listener: unknown) => {
      listeners.set(query, listener as () => void);
    },
    removeEventListener: () => {
      listeners.delete(query);
    },
  });
  const hook = renderHook(({ query }) => useMediaQuery(query), { initialProps: { query: "wide" } });
  expect(hook.result.current).toBe(false);
  act(() => {
    values.set("wide", true);
    listeners.get("wide")?.();
  });
  expect(hook.result.current).toBe(true);
  hook.rerender({ query: "touch" });
  expect(hook.result.current).toBe(true);
  expect(listeners.has("wide")).toBe(false);
  hook.unmount();
  expect(listeners.size).toBe(0);
});

test("renders an unknown media state on the server even if a browser mock matches", () => {
  window.matchMedia = (query) => ({ ...originalMatchMedia(query), matches: true });
  function Probe() {
    return <span>{String(useMediaQuery("wide"))}</span>;
  }
  expect(renderToString(<Probe />)).toBe("<span>undefined</span>");
});
