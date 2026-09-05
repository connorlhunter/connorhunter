import type { ReactNode } from "react";
import { afterEach, expect, test } from "bun:test";
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  createResourceQueryClient,
  useArtifactJson,
  useArtifactText,
} from "@/content/artifacts/queries";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
function wrapper() {
  const client = createResourceQueryClient();
  clients.push(client);
  return ({ children }: { readonly children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
}
afterEach(() => {
  cleanup();
  clients.splice(0).forEach((client) => client.clear());
  globalThis.fetch = originalFetch;
});

test("deduplicates readers and reuses fresh content after remount", async () => {
  let requests = 0;
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0]) => {
    requests += 1;
    return new Response("# Overview");
  }) as typeof fetch;
  const provider = wrapper();
  const first = renderHook(() => useArtifactText("/overview.md"), { wrapper: provider });
  const second = renderHook(() => useArtifactText("/overview.md"), { wrapper: provider });
  await waitFor(() => expect(second.result.current.data).toBe("# Overview"));
  first.unmount();
  second.unmount();
  const next = renderHook(() => useArtifactText("/overview.md"), { wrapper: provider });
  expect(next.result.current.data).toBe("# Overview");
  expect(next.result.current.loading).toBe(false);
  expect(requests).toBe(1);
});

test("aborts an obsolete request and ignores its late result", async () => {
  let resolveOld!: (response: Response) => void;
  let oldSignal: AbortSignal | null | undefined;
  globalThis.fetch = ((href, options) => {
    if (href === "/old.md") {
      oldSignal = options?.signal;
      return new Promise<Response>((resolve) => {
        resolveOld = resolve;
      });
    }
    return Promise.resolve(new Response("# New page"));
  }) as typeof fetch;
  const hook = renderHook(({ href }) => useArtifactText(href), {
    initialProps: { href: "/old.md" },
    wrapper: wrapper(),
  });
  expect(hook.result.current.loading).toBe(true);
  hook.rerender({ href: "/new.md" });
  expect(oldSignal?.aborted).toBe(true);
  expect(hook.result.current.data).toBeUndefined();
  await waitFor(() => expect(hook.result.current.data).toBe("# New page"));
  await act(async () => {
    resolveOld(new Response("# Old page"));
  });
  expect(hook.result.current.data).toBe("# New page");
});

test("validates JSON and lets the reader retry after a network or schema error", async () => {
  let requests = 0;
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0]) => {
    requests += 1;
    if (requests === 1) return new Response("Unavailable", { status: 503 });
    return Response.json(requests === 2 ? { title: 42 } : { title: "Docs" });
  }) as typeof fetch;
  const schema = z.object({ title: z.string() });
  const hook = renderHook(() => useArtifactJson("/docs.json", schema), { wrapper: wrapper() });
  await waitFor(() => expect(hook.result.current.error).toContain("could not be loaded"));
  expect(requests).toBe(1);
  act(() => {
    hook.result.current.retry?.();
  });
  await waitFor(() => expect(requests).toBe(2));
  await waitFor(() => expect(hook.result.current.loading).toBe(false));
  expect(hook.result.current.data).toBeUndefined();
  expect(hook.result.current.error).toContain("could not be loaded");
  act(() => {
    hook.result.current.retry?.();
  });
  await waitFor(() => expect(hook.result.current.data?.title).toBe("Docs"));
  expect(hook.result.current.error).toBeUndefined();
});

test("does not fetch absent resources and preserves readable data after a refresh failure", async () => {
  let requests = 0;
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0]) => {
    requests += 1;
    return requests === 1 ? new Response("# Cached") : new Response("Unavailable", { status: 503 });
  }) as typeof fetch;
  const hook = renderHook(({ href }: { href: string | undefined }) => useArtifactText(href), {
    initialProps: { href: undefined as string | undefined },
    wrapper: wrapper(),
  });
  expect(hook.result.current.loading).toBe(false);
  expect(requests).toBe(0);
  hook.rerender({ href: "/cached.md" });
  await waitFor(() => expect(hook.result.current.data).toBe("# Cached"));
  act(() => {
    hook.result.current.retry?.();
  });
  await waitFor(() => expect(requests).toBe(2));
  expect(hook.result.current.data).toBe("# Cached");
  expect(hook.result.current.error).toBeUndefined();
});

test("isolates cached content between document providers", async () => {
  let requests = 0;
  globalThis.fetch = (async (_input: Parameters<typeof fetch>[0]) => {
    requests += 1;
    return new Response(`Document ${requests}`);
  }) as typeof fetch;
  const first = renderHook(() => useArtifactText("/overview.md"), { wrapper: wrapper() });
  await waitFor(() => expect(first.result.current.data).toBe("Document 1"));
  const second = renderHook(() => useArtifactText("/overview.md"), { wrapper: wrapper() });
  await waitFor(() => expect(second.result.current.data).toBe("Document 2"));
  expect(first.result.current.data).toBe("Document 1");
  expect(requests).toBe(2);
});
