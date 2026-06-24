import { describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { publicConfig } from "@/config/public-env";
import { createDrawerResizeController } from "@/features/viewer/drawer/file-viewer-drawer-resize";
import {
  readDrawerStateSnapshot,
  writeDrawerStateSnapshot,
} from "@/features/viewer/drawer/file-viewer-drawer-state";
import {
  clampFileViewerDrawerHeight,
  FileViewerDrawer,
} from "@/features/viewer/file-viewer-drawer";
import { useFileViewerDrawer } from "@/features/viewer/hooks/use-file-viewer-drawer";

function MissingDrawerRefs(): null {
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const handleRef = useRef<HTMLButtonElement | null>(null);

  useFileViewerDrawer({ drawerRef, handleRef });

  return null;
}

function drawerStateStorageKey(stateKey: string): string {
  return `${publicConfig.appStorageNamespace}.file-viewer-drawer.${stateKey}`;
}

function setMeasuredHeight(element: HTMLElement, height: number): void {
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height,
  });
  element.getBoundingClientRect = () =>
    (() => {
      const styledHeight = Number.parseFloat(element.style.height);
      const measuredHeight = Number.isFinite(styledHeight) ? styledHeight : height;

      return {
        bottom: measuredHeight,
        height: measuredHeight,
        left: 0,
        right: 0,
        top: 0,
        width: 320,
        x: 0,
        y: 0,
      } as DOMRect;
    })();
}

function setSectionMetrics(element: HTMLElement, offsetTop: number, height: number): void {
  Object.defineProperty(element, "offsetTop", {
    configurable: true,
    get: () => offsetTop,
  });
  Object.defineProperty(element, "scrollHeight", {
    configurable: true,
    get: () => height,
  });
}

function mockAnimationFrame(): () => void {
  const requestDescriptor = Object.getOwnPropertyDescriptor(window, "requestAnimationFrame");
  const cancelDescriptor = Object.getOwnPropertyDescriptor(window, "cancelAnimationFrame");

  Object.defineProperty(window, "requestAnimationFrame", {
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    },
  });
  Object.defineProperty(window, "cancelAnimationFrame", {
    configurable: true,
    value: () => undefined,
  });

  return () => {
    if (requestDescriptor) {
      Object.defineProperty(window, "requestAnimationFrame", requestDescriptor);
    }
    if (cancelDescriptor) {
      Object.defineProperty(window, "cancelAnimationFrame", cancelDescriptor);
    }
  };
}

describe("FileViewerDrawer", () => {
  test("clamps requested heights to collapsed, expanded, and viewport bounds", () => {
    expect(clampFileViewerDrawerHeight(240, 20, 800)).toBe(0);
    expect(clampFileViewerDrawerHeight(240, 100, 800)).toBe(0);
    expect(clampFileViewerDrawerHeight(240, 180, 800)).toBe(180);
    expect(clampFileViewerDrawerHeight(240, 900, 800)).toBe(240);
    expect(clampFileViewerDrawerHeight(80, 80, 800)).toBe(80);
    expect(clampFileViewerDrawerHeight(240, 20, 800, 40)).toBe(40);
    expect(clampFileViewerDrawerHeight(180, 170, 800, 0, [80, 180])).toBe(180);
    expect(clampFileViewerDrawerHeight(180, 95, 800, 0, [80, 180])).toBe(80);
    expect(clampFileViewerDrawerHeight(180, 95, 800, 0, [80, 180], true)).toBe(95);
    expect(clampFileViewerDrawerHeight(180, 95, 800, 0, [80, 180], true, 28)).toBe(80);
    expect(clampFileViewerDrawerHeight(180, 112, 800, 0, [80, 180], true, 28, 80, 44)).toBe(80);
    expect(clampFileViewerDrawerHeight(180, 130, 800, 0, [80, 180], true, 28, 80, 44)).toBe(130);
    expect(clampFileViewerDrawerHeight(180, 20, 800, 0, [80, 180])).toBe(0);
  });

  test("collapses and expands from the resize handle", () => {
    render(
      <FileViewerDrawer ariaLabel="Viewer controls">
        <span>Project</span>
      </FileViewerDrawer>,
    );

    const drawer = screen.getByRole("group", { name: "Viewer controls" });
    const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    setMeasuredHeight(drawer, 160);

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
    expect(drawer.style.height).toBe("0px");
    expect(handle.getAttribute("aria-expanded")).toBe("false");
    expect(handle.getAttribute("aria-label")).toBe("Expand viewer drawer");

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
    expect(drawer.style.height).toBe("160px");
    expect(handle.getAttribute("aria-expanded")).toBe("true");
    expect(handle.getAttribute("aria-label")).toBe("Collapse viewer drawer");

    cleanup();
  });

  test("uses drag gestures to clamp the drawer height", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <FileViewerDrawer ariaLabel="Viewer controls">
          <span>Project</span>
        </FileViewerDrawer>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      setMeasuredHeight(drawer, 180);

      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: -80, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: -80, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");
      expect(document.documentElement.classList.contains("is-resizing-file-viewer-drawer")).toBe(
        false,
      );
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("ignores pointer events before dragging and suppresses the click after a drag", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <FileViewerDrawer ariaLabel="Viewer controls">
          <span>Project</span>
        </FileViewerDrawer>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      setMeasuredHeight(drawer, 180);

      expect(fireEvent.pointerMove(handle, { clientY: 180, pointerId: 1 })).toBe(true);
      expect(fireEvent.pointerUp(handle, { clientY: 180, pointerId: 1 })).toBe(true);

      window.dispatchEvent(new window.Event("resize"));

      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 220, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 220, pointerId: 1 });

      expect(fireEvent.click(handle)).toBe(false);
      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("cancels pending drawer resize frames and coalesces requests", () => {
    const requestDescriptor = Object.getOwnPropertyDescriptor(window, "requestAnimationFrame");
    const cancelDescriptor = Object.getOwnPropertyDescriptor(window, "cancelAnimationFrame");
    const drawer = document.createElement("div");
    const handle = document.createElement("button");
    let cancelledFrame = 0;
    let scheduledCallback: FrameRequestCallback | undefined;

    setMeasuredHeight(drawer, 180);
    document.body.append(drawer, handle);
    Object.defineProperty(window, "requestAnimationFrame", {
      configurable: true,
      value: (callback: FrameRequestCallback) => {
        scheduledCallback = callback;
        return 42;
      },
    });
    Object.defineProperty(window, "cancelAnimationFrame", {
      configurable: true,
      value: (frame: number) => {
        cancelledFrame = frame;
      },
    });

    try {
      const resize = createDrawerResizeController({ drawer, handle });

      resize.request(120, false);
      resize.request(140, false);

      expect(resize.snapshot()).toEqual({ allowAnchorCollapse: false, height: 140 });

      resize.cancel();

      expect(cancelledFrame).toBe(42);
      expect(resize.snapshot()).toEqual({ allowAnchorCollapse: false, height: null });

      resize.request(150, false);
      scheduledCallback?.(0);

      expect(drawer.style.height).toBe("150px");
    } finally {
      drawer.remove();
      handle.remove();
      if (requestDescriptor) {
        Object.defineProperty(window, "requestAnimationFrame", requestDescriptor);
      }
      if (cancelDescriptor) {
        Object.defineProperty(window, "cancelAnimationFrame", cancelDescriptor);
      }
    }
  });

  test("ignores invalid drawer state snapshots and restores valid memory state", () => {
    const invalidStateKey = "invalid-state";
    const malformedStateKey = "malformed-state";
    const validStateKey = "valid-state";

    window.sessionStorage.setItem(
      drawerStateStorageKey(invalidStateKey),
      JSON.stringify({ anchorCollapsed: true, full: true, height: "bad" }),
    );
    window.sessionStorage.setItem(drawerStateStorageKey(malformedStateKey), "{bad json");

    expect(readDrawerStateSnapshot(invalidStateKey)).toBeUndefined();
    expect(readDrawerStateSnapshot(malformedStateKey)).toBeUndefined();

    writeDrawerStateSnapshot(validStateKey, {
      anchorCollapsed: true,
      full: false,
      height: 144,
    });

    expect(readDrawerStateSnapshot(validStateKey)).toEqual({
      anchorCollapsed: true,
      full: false,
      height: 144,
    });
  });

  test("skips drawer setup when refs are unavailable", () => {
    expect(() => {
      render(<MissingDrawerRefs />);
    }).not.toThrow();

    cleanup();
  });

  test("moves the handle to the previous container and hides that container when dragged up", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <span>Project</span>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const header = screen.getByTestId("viewer-header");
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      setMeasuredHeight(drawer, 180);

      fireEvent.click(handle);
      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 40, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 40, pointerId: 1 });

      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
      expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");

      fireEvent.pointerDown(handle, { clientY: 40, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 220, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 220, pointerId: 1 });

      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
      expect(drawer.style.height).toBe("180px");
      expect(handle.getAttribute("aria-label")).toBe("Collapse viewer drawer");
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("clicks through drawer and header section collapse states", () => {
    render(
      <>
        <header data-testid="viewer-header">Header</header>
        <FileViewerDrawer ariaLabel="Viewer controls">
          <span>Project</span>
        </FileViewerDrawer>
      </>,
    );

    const drawer = screen.getByRole("group", { name: "Viewer controls" });
    const header = screen.getByTestId("viewer-header");
    const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    setMeasuredHeight(drawer, 160);

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
    expect(handle.getAttribute("aria-label")).toBe("Collapse viewer sections");

    fireEvent.click(handle);

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
    expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");

    fireEvent.click(handle);

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
    expect(handle.getAttribute("aria-label")).toBe("Collapse viewer drawer");

    cleanup();
  });

  test("uses an explicit anchor id when the header is not the previous sibling", () => {
    render(
      <>
        <header data-testid="viewer-header" id="viewer-header-anchor">
          Header
        </header>
        <div aria-hidden="true" />
        <FileViewerDrawer anchorId="viewer-header-anchor" ariaLabel="Viewer controls">
          <span>Project</span>
        </FileViewerDrawer>
      </>,
    );

    const drawer = screen.getByRole("group", { name: "Viewer controls" });
    const header = screen.getByTestId("viewer-header");
    const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    setMeasuredHeight(drawer, 160);

    fireEvent.click(handle);
    fireEvent.click(handle);

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
    expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");

    cleanup();
  });

  test("snaps marked drawer sections one at a time before collapsing the header", () => {
    render(
      <>
        <header data-testid="viewer-header">Header</header>
        <FileViewerDrawer ariaLabel="Viewer controls">
          <div data-file-viewer-drawer-section>Project and desktop</div>
          <div data-file-viewer-drawer-section>Views</div>
        </FileViewerDrawer>
      </>,
    );

    const drawer = screen.getByRole("group", { name: "Viewer controls" });
    const header = screen.getByTestId("viewer-header");
    const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");
    setMeasuredHeight(drawer, 180);
    setSectionMetrics(sections[0] as HTMLElement, 0, 80);
    setSectionMetrics(sections[1] as HTMLElement, 80, 100);

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
    expect(drawer.style.height).toBe("80px");
    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
    expect(drawer.style.height).toBe("0px");
    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
    expect(handle.getAttribute("aria-label")).toBe("Collapse viewer sections");

    fireEvent.click(handle);

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);

    cleanup();
  });

  test("keeps drawer bottom padding visible at intermediate snap points", () => {
    render(
      <>
        <header data-testid="viewer-header">Header</header>
        <FileViewerDrawer ariaLabel="Viewer controls">
          <div data-file-viewer-drawer-section>Project and desktop</div>
          <div data-file-viewer-drawer-section>Views</div>
        </FileViewerDrawer>
      </>,
    );

    const drawer = screen.getByRole("group", { name: "Viewer controls" });
    const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    const content = drawer.querySelector<HTMLElement>(".file-viewer-drawer-content");
    const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");

    if (!content) {
      throw new Error("Expected drawer content.");
    }

    content.style.paddingBottom = "16px";
    setMeasuredHeight(drawer, 212);
    setSectionMetrics(sections[0] as HTMLElement, 0, 80);
    setSectionMetrics(sections[1] as HTMLElement, 96, 100);

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
    expect(drawer.style.height).toBe("96px");

    cleanup();
  });

  test("drags marked drawer sections continuously before snapping on release", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <div data-file-viewer-drawer-section>Project and desktop</div>
            <div data-file-viewer-drawer-section>Views</div>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");
      setMeasuredHeight(drawer, 180);
      setSectionMetrics(sections[0] as HTMLElement, 0, 80);
      setSectionMetrics(sections[1] as HTMLElement, 80, 100);

      fireEvent.pointerDown(handle, { clientY: 180, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 130, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
      expect(drawer.classList.contains("file-viewer-drawer--magnetized")).toBe(false);
      expect(drawer.style.height).toBe("130px");

      fireEvent.pointerUp(handle, { clientY: 130, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
      expect(drawer.classList.contains("file-viewer-drawer--magnetized")).toBe(false);
      expect(drawer.style.height).toBe("80px");
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("magnetizes marked drawer sections while dragging near a snap point", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <div data-file-viewer-drawer-section>Project and desktop</div>
            <div data-file-viewer-drawer-section>Views</div>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");
      setMeasuredHeight(drawer, 180);
      setSectionMetrics(sections[0] as HTMLElement, 0, 80);
      setSectionMetrics(sections[1] as HTMLElement, 80, 100);

      fireEvent.pointerDown(handle, { clientY: 180, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 104, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--magnetized")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(false);
      expect(drawer.style.height).toBe("80px");

      fireEvent.pointerMove(handle, { clientY: 112, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--magnetized")).toBe(true);
      expect(drawer.style.height).toBe("80px");

      fireEvent.pointerMove(handle, { clientY: 130, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--magnetized")).toBe(false);
      expect(drawer.style.height).toBe("130px");

      fireEvent.pointerUp(handle, { clientY: 130, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--magnetized")).toBe(false);
      expect(drawer.style.height).toBe("80px");
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("keeps a zero-height drawer collapse separate from header hiding", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <div data-file-viewer-drawer-section>Project and desktop</div>
            <div data-file-viewer-drawer-section>Views</div>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const header = screen.getByTestId("viewer-header");
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");
      setMeasuredHeight(drawer, 180);
      setSectionMetrics(sections[0] as HTMLElement, 0, 80);
      setSectionMetrics(sections[1] as HTMLElement, 80, 100);

      fireEvent.pointerDown(handle, { clientY: 180, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 0, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 0, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");
      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
      expect(handle.getAttribute("aria-label")).toBe("Collapse viewer sections");

      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 40, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 40, pointerId: 1 });

      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
      expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("hides the header anchor on the first drag when pulled past the top magnet", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <div data-file-viewer-drawer-section>Project and desktop</div>
            <div data-file-viewer-drawer-section>Views</div>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const header = screen.getByTestId("viewer-header");
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      const sections = drawer.querySelectorAll<HTMLElement>("[data-file-viewer-drawer-section]");
      setMeasuredHeight(drawer, 180);
      setSectionMetrics(sections[0] as HTMLElement, 0, 80);
      setSectionMetrics(sections[1] as HTMLElement, 80, 100);

      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: -100, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: -100, pointerId: 1 });

      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");
      expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("keeps the header anchor collapsed when the top drag is nudged before release", () => {
    const restoreAnimationFrame = mockAnimationFrame();

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <span>Project</span>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const header = screen.getByTestId("viewer-header");
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      setMeasuredHeight(drawer, 180);

      fireEvent.click(handle);
      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 110, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");
      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);

      fireEvent.pointerMove(handle, { clientY: 80, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 125, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 125, pointerId: 1 });

      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(handle.getAttribute("aria-label")).toBe("Expand viewer sections");
    } finally {
      cleanup();
      restoreAnimationFrame();
    }
  });

  test("keeps the mobile collapsed handle overlaid without adding drawer height", () => {
    const restoreAnimationFrame = mockAnimationFrame();
    const originalMatchMedia = window.matchMedia;

    window.matchMedia = (query: string): MediaQueryList => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: query === "(max-width: 860px)",
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    });

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls">
            <span>Project</span>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const header = screen.getByTestId("viewer-header");
      const handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
      setMeasuredHeight(drawer, 180);

      fireEvent.click(handle);

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");

      fireEvent.pointerDown(handle, { clientY: 120, pointerId: 1 });
      fireEvent.pointerMove(handle, { clientY: 114, pointerId: 1 });
      fireEvent.pointerUp(handle, { clientY: 114, pointerId: 1 });

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");
      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
    } finally {
      cleanup();
      window.matchMedia = originalMatchMedia;
      restoreAnimationFrame();
    }
  });

  test("restores mobile collapsed state as a zero-height overlay", () => {
    const originalMatchMedia = window.matchMedia;
    const stateKey = "test-legacy-mobile-collapsed-overlay";

    window.matchMedia = (query: string): MediaQueryList => ({
      addEventListener: () => {},
      addListener: () => {},
      dispatchEvent: () => false,
      matches: query === "(max-width: 860px)",
      media: query,
      onchange: null,
      removeEventListener: () => {},
      removeListener: () => {},
    });
    window.sessionStorage.setItem(
      drawerStateStorageKey(stateKey),
      JSON.stringify({ anchorCollapsed: false, full: false, height: 40 }),
    );

    try {
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls" stateKey={stateKey}>
            <span>Project</span>
          </FileViewerDrawer>
        </>,
      );

      const drawer = screen.getByRole("group", { name: "Viewer controls" });
      const header = screen.getByTestId("viewer-header");

      expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
      expect(drawer.style.height).toBe("0px");
      expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(false);
    } finally {
      cleanup();
      window.sessionStorage.removeItem(drawerStateStorageKey(stateKey));
      window.matchMedia = originalMatchMedia;
    }
  });

  test("preserves keyed drawer collapse state across remounts", () => {
    const stateKey = "test-preserve-drawer-collapse";
    const renderDrawer = (): ReturnType<typeof render> =>
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls" stateKey={stateKey}>
            <span>Project</span>
          </FileViewerDrawer>
        </>,
      );

    const firstRender = renderDrawer();
    let drawer = screen.getByRole("group", { name: "Viewer controls" });
    let handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    setMeasuredHeight(drawer, 160);

    fireEvent.click(handle);

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
    expect(drawer.style.height).toBe("0px");
    firstRender.unmount();

    renderDrawer();
    drawer = screen.getByRole("group", { name: "Viewer controls" });
    handle = screen.getByRole("button", { name: "Collapse viewer sections" });

    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
    expect(drawer.style.height).toBe("0px");
    expect(handle.getAttribute("aria-expanded")).toBe("false");
    expect(window.sessionStorage.getItem(drawerStateStorageKey(stateKey))).toContain('"height":0');

    cleanup();
  });

  test("preserves keyed header collapse state across remounts", () => {
    const stateKey = "test-preserve-drawer-anchor-collapse";
    const renderDrawer = (): ReturnType<typeof render> =>
      render(
        <>
          <header data-testid="viewer-header">Header</header>
          <FileViewerDrawer ariaLabel="Viewer controls" stateKey={stateKey}>
            <span>Project</span>
          </FileViewerDrawer>
        </>,
      );

    const firstRender = renderDrawer();
    let drawer = screen.getByRole("group", { name: "Viewer controls" });
    let header = screen.getByTestId("viewer-header");
    let handle = screen.getByRole("button", { name: "Collapse viewer drawer" });
    setMeasuredHeight(drawer, 160);

    fireEvent.click(handle);
    fireEvent.click(handle);

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
    firstRender.unmount();

    renderDrawer();
    drawer = screen.getByRole("group", { name: "Viewer controls" });
    header = screen.getByTestId("viewer-header");
    handle = screen.getByRole("button", { name: "Expand viewer sections" });

    expect(header.classList.contains("file-viewer-drawer-anchor--collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--anchor-collapsed")).toBe(true);
    expect(drawer.classList.contains("file-viewer-drawer--collapsed")).toBe(true);
    expect(handle.getAttribute("aria-expanded")).toBe("false");

    cleanup();
  });
});
