/**
 * @property body - Markdown body after the frontmatter block.
 * @property metadata - Parsed JSON metadata from the frontmatter block.
 */
export interface FrontmatterDocument<TMetadata> {
  readonly body: string;
  readonly metadata: TMetadata;
}

const jsonFrontmatterPattern = /^---\s*\n(?<json>[\s\S]*?)\n---\s*\n?(?<body>[\s\S]*)$/u;

/**
 * @param json - Raw JSON frontmatter text.
 * @returns JSON text with trailing object and array commas removed.
 */
function normalizeJsonFrontmatter(json: string): string {
  return json.replace(/,\s*([}\]])/gu, "$1");
}

/**
 * @param raw - Markdown document with JSON frontmatter delimited by triple dashes.
 * @returns Parsed metadata and trimmed markdown body.
 */
export function parseJsonFrontmatter<TMetadata>(raw: string): FrontmatterDocument<TMetadata> {
  const match = jsonFrontmatterPattern.exec(raw);

  if (!match?.groups?.json || match.groups.body === undefined) {
    throw new Error("Expected JSON frontmatter delimited by ---.");
  }

  return {
    metadata: JSON.parse(normalizeJsonFrontmatter(match.groups.json)) as TMetadata,
    body: match.groups.body.trim(),
  };
}
