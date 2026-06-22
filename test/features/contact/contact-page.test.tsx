import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ContactPage } from "@/features/contact/contact-page";
import { mockContent } from "../../mock-content";

describe("ContactPage", () => {
  test("renders the resume and contact cards with framed icons", () => {
    render(<ContactPage content={mockContent} />);

    expect(document.querySelectorAll(".resume-document-icon")).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Resume" }).getAttribute("href")).toBe("/resume");

    cleanup();
  });
});
