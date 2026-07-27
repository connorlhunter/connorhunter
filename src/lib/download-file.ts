/**
 * Downloads a public file through a Blob so browsers retain the requested file name
 * for cross-origin CloudFront assets.
 *
 * @param href - Public file URL to download.
 * @param filename - File name presented by the browser save flow.
 */
export async function downloadFile(href: string, filename: string): Promise<void> {
  const response = await fetch(href);

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`.trim());
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");

  anchor.download = filename;
  anchor.href = objectUrl;
  anchor.hidden = true;
  document.body.append(anchor);

  try {
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}
