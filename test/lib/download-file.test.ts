import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { downloadFile } from "@/lib/download-file";

describe("downloadFile", () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, "document");

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    if (documentDescriptor) {
      Object.defineProperty(globalThis, "document", documentDescriptor);
    } else {
      Reflect.deleteProperty(globalThis, "document");
    }
  });

  test("downloads a fetched public file with the requested name", async () => {
    const fetchFile = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("resume", { status: 200 }),
    );
    const createObjectUrl = spyOn(URL, "createObjectURL").mockReturnValue("blob:resume");
    const revokeObjectUrl = spyOn(URL, "revokeObjectURL");
    let removed = false;
    const anchor = {
      click: () => undefined,
      download: "",
      hidden: false,
      href: "",
      remove: () => {
        removed = true;
      },
    };
    const append = spyOn({ append: (_element: unknown) => undefined }, "append").mockImplementation(
      (element) => {
        expect(element).toBe(anchor);
      },
    );

    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        body: { append: append as unknown as (node: Node) => void },
        createElement: () => anchor,
      },
    });

    try {
      await downloadFile("https://assets.example.com/resume.pdf", "example-resume.pdf");

      expect(fetchFile).toHaveBeenCalledWith("https://assets.example.com/resume.pdf");
      expect(createObjectUrl).toHaveBeenCalledTimes(1);
      expect(anchor.download).toBe("example-resume.pdf");
      expect(anchor.href).toBe("blob:resume");
      expect(anchor.hidden).toBe(true);
      expect(removed).toBe(true);
      expect(revokeObjectUrl).toHaveBeenCalledWith("blob:resume");
    } finally {
      fetchFile.mockRestore();
      createObjectUrl.mockRestore();
      revokeObjectUrl.mockRestore();
    }
  });

  test("surfaces failed public-file requests", async () => {
    const fetchFile = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("missing", { status: 404, statusText: "Not Found" }),
    );

    try {
      await expect(
        downloadFile("https://assets.example.com/missing.pdf", "missing.pdf"),
      ).rejects.toThrow("Download failed: 404 Not Found");
    } finally {
      fetchFile.mockRestore();
    }
  });
});
