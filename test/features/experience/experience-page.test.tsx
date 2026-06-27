import { describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import { ExperiencePage } from "@/features/experience/experience-page";
import { mockContent } from "../../mock-content";

describe("ExperiencePage", () => {
  test("renders section icons and an external certification credential link", () => {
    const certification = mockContent.certifications[0];
    if (!certification) throw new Error("Missing certification fixture.");

    render(<ExperiencePage content={mockContent} />);

    expect(screen.getByRole("heading", { level: 2, name: "Work" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Education" })).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "Certifications" })).toBeTruthy();
    expect(document.querySelectorAll(".content-card-icon")).toHaveLength(3);

    const certificationHeading = screen.getByRole("heading", {
      level: 3,
      name: certification.title,
    });
    const issuer = screen.getByText(certification.issuer);
    const issuedLabel = screen.getByText("Issued");
    const issuedDate = screen.getByText(certification.date);
    const credentialLink = screen.getByRole("link", {
      name: `${certification.title}: View credential`,
    });

    expect(certificationHeading.tagName).toBe("H3");
    expect(issuer.tagName).toBe("DD");
    expect(issuedLabel.tagName).toBe("DT");
    expect(issuedDate.tagName).toBe("TIME");
    expect(issuedDate.parentElement?.tagName).toBe("DD");
    expect(credentialLink.getAttribute("href")).toBe(certification.href);
    expect(credentialLink.getAttribute("target")).toBe("_blank");
    expect(credentialLink.getAttribute("rel")).toBe("noreferrer");
    expect(credentialLink.className).toContain("hover:-translate-y-0.5");
    expect(credentialLink.className).toContain("hover:bg-(--accent-soft)");
    expect(screen.queryByText("Reissued")).toBeNull();

    cleanup();
  });

  test("renders optional certification reissuance history", () => {
    const certification = mockContent.certifications[0];
    if (!certification) throw new Error("Missing certification fixture.");

    render(
      <ExperiencePage
        content={{
          ...mockContent,
          certifications: [
            {
              ...certification,
              reissuanceDates: ["Example Reissuance One", "Example Reissuance Two"],
            },
          ],
        }}
      />,
    );

    expect(screen.getAllByText("Reissued")).toHaveLength(2);
    for (const date of ["Example Reissuance One", "Example Reissuance Two"]) {
      const dateElement = screen.getByText(date);
      expect(dateElement.tagName).toBe("TIME");
      expect(dateElement.parentElement?.tagName).toBe("DD");
    }

    cleanup();
  });
});
