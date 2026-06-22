import { marked } from "marked";

marked.use({
  gfm: true,
  breaks: false,
});

/**
 * @param markdown - Markdown text from project content.
 * @returns Rendered HTML for trusted portfolio markdown.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}
