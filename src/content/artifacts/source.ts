import { artifactUrl, publicConfig } from "@/config/public-env";

/**
 * @property readJson - Reads and parses JSON content by artifact path.
 * @property readText - Reads text content by artifact path.
 */
export interface ArtifactTextSource {
  readonly readJson: (path: string) => Promise<unknown>;
  readonly readText: (path: string) => Promise<string>;
}

/**
 * @param path - User or manifest supplied artifact path.
 * @returns A safe relative artifact path.
 */
function normalizeArtifactPath(path: string): string {
  const normalizedPath = path.replace(/^\/+/u, "");

  if (
    normalizedPath.includes("\0") ||
    normalizedPath.split("/").some((segment) => segment === "..")
  ) {
    throw new Error(`Unsafe artifact path: ${path}`);
  }

  return normalizedPath;
}

/**
 * @param path - Safe artifact path under the configured artifact origin.
 * @returns Fetched artifact text content.
 */
async function fetchArtifactText(path: string): Promise<string> {
  const href = artifactUrl(normalizeArtifactPath(path));
  let response: Response;

  try {
    response = await fetch(href, {
      headers: {
        Accept: "text/markdown, application/json, image/svg+xml, text/plain, */*",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    throw new Error(`Failed to fetch artifact ${href}: ${message}`, { cause: error });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch artifact ${href}: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/**
 * @description Default artifact source backed by the configured public origin.
 */
export const configuredArtifactTextSource: ArtifactTextSource = {
  async readJson(path) {
    return JSON.parse(await this.readText(path));
  },
  readText: fetchArtifactText,
};

/**
 * @param path - Artifact JSON path to read.
 * @returns Parsed JSON from the configured artifact source.
 */
export function readArtifactJson(path: string): Promise<unknown> {
  return configuredArtifactTextSource.readJson(path);
}

/**
 * @param path - Artifact text path to read.
 * @returns Text from the configured artifact source.
 */
export function readArtifactText(path: string): Promise<string> {
  return configuredArtifactTextSource.readText(path);
}
