import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createResourceQueryClient } from "@/content/artifacts/queries";
import { ProjectCoveragePage } from "@/features/projects/project-coverage-page";
import { mockContent } from "../../mock-content";

const originalFetch = globalThis.fetch;
afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

test("exposes the selected coverage surface and resets when the project changes", async () => {
  const metric = { covered: 1, found: 1 };
  const file = { path: "src/example.ts", lines: metric, functions: metric };
  globalThis.fetch = (async (_input) =>
    Response.json({
      schemaVersion: 2,
      minimumCoverage: 95,
      updatedAt: "2026-09-05",
      surfaces: [
        { id: "ui", label: "UI", totals: file, files: [{ ...file, path: "src/ui.ts" }] },
        {
          id: "scripts",
          label: "Scripts",
          totals: file,
          files: [{ ...file, path: "scripts/build.ts" }],
        },
      ],
    })) as typeof fetch;
  const client = createResourceQueryClient();
  const first = mockContent.projects[0]!;
  const second = mockContent.projects[1]!;
  const view = render(
    <QueryClientProvider client={client}>
      <ProjectCoveragePage project={first} />
    </QueryClientProvider>,
  );
  try {
    const group = await screen.findByRole("group", { name: "Coverage surface" });
    expect(within(group).getByRole("button", { name: "UI", pressed: true })).toBeTruthy();
    fireEvent.click(within(group).getByRole("button", { name: "Scripts" }));
    expect(within(group).getByRole("button", { name: "Scripts", pressed: true })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "scripts/build.ts" })).toBeTruthy();
    view.rerender(
      <QueryClientProvider client={client}>
        <ProjectCoveragePage project={second} />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "UI", pressed: true })).toBeTruthy(),
    );
    expect(screen.getByRole("cell", { name: "src/ui.ts" })).toBeTruthy();
    expect(screen.queryByRole("cell", { name: "scripts/build.ts" })).toBeNull();
  } finally {
    view.unmount();
    client.clear();
  }
});
