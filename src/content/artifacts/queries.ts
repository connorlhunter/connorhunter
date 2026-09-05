import { useCallback } from "react";
import { QueryClient, useQuery, type UseQueryResult } from "@tanstack/react-query";
import type { z } from "zod";

/** One resource cache per document, never shared between server requests. */
export function createResourceQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 30_000, gcTime: 300_000, retry: false } },
  });
}

export interface ArtifactState<T> {
  readonly data?: T | undefined;
  readonly error?: string | undefined;
  readonly loading: boolean;
  readonly retry?: () => void;
}

async function fetchArtifact(href: string, accept: string, signal: AbortSignal): Promise<Response> {
  const response = await fetch(href, { headers: { Accept: accept }, signal });
  if (!response.ok) throw new Error(`Artifact request failed with ${response.status}.`);
  return response;
}

function artifactState<T>(query: UseQueryResult<T>, enabled: boolean): ArtifactState<T> {
  return {
    data: query.data,
    error:
      query.isError && query.data === undefined
        ? "This resource could not be loaded. Please try again."
        : undefined,
    loading: enabled && query.isPending,
    retry: () => {
      void query.refetch();
    },
  };
}

/** Shares validated JSON by URL and cancels requests when their last reader leaves. */
export function useArtifactJson<T>(
  href: string | undefined,
  schema: z.ZodType<T>,
): ArtifactState<T> {
  const select = useCallback((value: unknown) => schema.parse(value), [schema]);
  const query = useQuery({
    queryKey: ["artifact", "json", href],
    enabled: Boolean(href),
    queryFn: async ({ signal }): Promise<unknown> =>
      (await fetchArtifact(href!, "application/json", signal)).json(),
    select,
  });
  return artifactState(query, Boolean(href));
}

/** Shares Markdown by URL without showing the previous page while a new request loads. */
export function useArtifactText(href: string | undefined): ArtifactState<string> {
  const query = useQuery({
    queryKey: ["artifact", "text", href],
    enabled: Boolean(href),
    queryFn: async ({ signal }) => (await fetchArtifact(href!, "text/markdown", signal)).text(),
  });
  return artifactState(query, Boolean(href));
}
