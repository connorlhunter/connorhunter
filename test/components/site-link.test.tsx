import { createRef, type ReactNode } from "react";
import { afterEach, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { SiteLink } from "@/components/ui/site-link";

afterEach(cleanup);

function renderLinks(children: ReactNode) {
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: createRootRoute({ component: () => children }),
    defaultNotFoundComponent: () => children,
  });
  render(<RouterProvider router={router} />);
  return router;
}

test("keeps search and fragment navigation in the router and forwards the anchor ref", async () => {
  const ref = createRef<HTMLAnchorElement>();
  const router = renderLinks(
    <SiteLink href="/projects?view=all#selected" ref={ref}>
      Projects
    </SiteLink>,
  );
  const link = await screen.findByRole("link", { name: "Projects" });
  expect(ref.current).toBe(link as HTMLAnchorElement);
  expect(link.getAttribute("href")).toBe("/projects?view=all#selected");
  fireEvent.click(link);
  await waitFor(() => expect(router.state.location.pathname).toBe("/projects"));
  expect(router.state.location.search).toEqual({ view: "all" });
  expect(router.state.location.hash).toBe("selected");
});

test("leaves modified clicks and cancelled navigation to the caller", async () => {
  const router = renderLinks(
    <>
      <SiteLink href="/projects">Projects</SiteLink>
      <SiteLink href="/skills" onClick={(event) => event.preventDefault()}>
        Cancelled
      </SiteLink>
    </>,
  );
  const link = await screen.findByRole("link", { name: "Projects" });
  for (const modifier of ["ctrlKey", "metaKey", "shiftKey", "altKey"]) {
    expect(fireEvent.click(link, { [modifier]: true })).toBe(true);
    expect(router.state.location.pathname).toBe("/");
  }
  expect(fireEvent.click(link, { button: 1 })).toBe(true);
  fireEvent.click(screen.getByRole("link", { name: "Cancelled" }));
  expect(router.state.location.pathname).toBe("/");
});

test("preserves native behavior for external destinations, files, downloads, and new tabs", async () => {
  const router = renderLinks(
    <>
      <SiteLink href="https://example.com/">External</SiteLink>
      <SiteLink href="//example.com/">Protocol relative</SiteLink>
      <SiteLink href="/resume.pdf?download=1">File</SiteLink>
      <SiteLink href="/resume" download="resume.pdf">
        Download
      </SiteLink>
      <SiteLink href="/projects" target="_blank" rel="noreferrer">
        New tab
      </SiteLink>
    </>,
  );
  for (const name of ["External", "Protocol relative", "File", "Download", "New tab"]) {
    const link = await screen.findByRole("link", { name });
    expect(fireEvent.click(link)).toBe(true);
    expect(router.state.location.pathname).toBe("/");
  }
  expect(screen.getByRole("link", { name: "Download" }).getAttribute("download")).toBe(
    "resume.pdf",
  );
  expect(screen.getByRole("link", { name: "New tab" }).getAttribute("target")).toBe("_blank");
});
