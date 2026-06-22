/**
 * @param href - Internal href to push into the browser history.
 * @returns Same-origin href normalized for history, when possible.
 */
function historyHref(href: string): string {
  try {
    const url = new URL(href, window.location.href);

    return url.origin === window.location.origin ? `${url.pathname}${url.search}${url.hash}` : href;
  } catch {
    return href;
  }
}

/**
 * @param href - Internal href to push into the browser history.
 * @returns Nothing; the current document stays mounted and the router can respond to history.
 */
export function navigateInPlace(href: string): void {
  const nextHref = historyHref(href);
  const currentHref = `${window.location.pathname}${window.location.search}${window.location.hash}`;

  if (currentHref === nextHref || window.location.href === href) {
    return;
  }

  try {
    window.history.pushState(window.history.state, "", nextHref);
  } catch {
    window.location.href = href;
    return;
  }

  const event =
    typeof window.PopStateEvent === "function"
      ? new window.PopStateEvent("popstate", { state: window.history.state })
      : new window.Event("popstate");

  window.dispatchEvent(event);
}
