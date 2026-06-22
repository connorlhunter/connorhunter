import { Window } from "happy-dom";

const window = new Window();

class IntersectionObserverMock implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = "";
  readonly scrollMargin = "";
  readonly thresholds = [];

  disconnect(): void {}

  observe(): void {}

  takeRecords(): Array<IntersectionObserverEntry> {
    return [];
  }

  unobserve(): void {}
}

Object.assign(window, {
  Error,
  matchMedia: (query: string): MediaQueryList => ({
    addEventListener: () => {},
    addListener: () => {},
    dispatchEvent: () => false,
    matches: false,
    media: query,
    onchange: null,
    removeEventListener: () => {},
    removeListener: () => {},
  }),
  scrollTo: () => {},
  SyntaxError,
  TypeError,
});

Object.assign(globalThis, {
  document: window.document,
  history: window.history,
  HTMLElement: window.HTMLElement,
  IntersectionObserver: IntersectionObserverMock,
  location: window.location,
  navigator: window.navigator,
  Node: window.Node,
  scrollTo: window.scrollTo,
  SVGElement: window.SVGElement,
  window,
});

Object.assign(window, {
  IntersectionObserver: IntersectionObserverMock,
});
