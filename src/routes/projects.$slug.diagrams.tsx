import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/projects/$slug/diagrams")({
  component: Outlet,
});
