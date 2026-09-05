import type { ComponentPropsWithRef, ReactNode } from "react";
import { Link, useRouter } from "@tanstack/react-router";

/** Uses client navigation for app paths, preserving native links for files and external destinations. */
export function SiteLink({
  href,
  download,
  target,
  ...props
}: ComponentPropsWithRef<"a">): ReactNode {
  const router = useRouter({ warn: false });
  if (
    router &&
    href?.startsWith("/") &&
    !href.startsWith("//") &&
    !/\.[^/]+$/u.test(href.split(/[?#]/u)[0] ?? "") &&
    download === undefined &&
    (!target || target === "_self")
  ) {
    return <Link {...props} to={href} {...(target ? { target } : {})} />;
  }
  return <a {...props} href={href} download={download} target={target} />;
}
