import { copyFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const sourcePath = fileURLToPath(
  new URL("../../node_modules/pdfjs-dist/build/pdf.worker.mjs", import.meta.url),
);
const targetPath = fileURLToPath(new URL("../../public/pdf.worker.mjs", import.meta.url));

if (!existsSync(sourcePath)) {
  throw new Error("Missing PDF.js worker. Run `bun install` before syncing the PDF worker.");
}

mkdirSync(dirname(targetPath), { recursive: true });
copyFileSync(sourcePath, targetPath);
console.log(`Synced PDF.js worker to ${targetPath}`);
