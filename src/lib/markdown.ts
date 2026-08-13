import { marked, Renderer, type Tokens } from "marked";

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/gu,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character,
  );
}

function isSafeMarkdownHref(href: string, image = false): boolean {
  if (/[\u0000-\u001f\u007f\\]/u.test(href) || href.startsWith("//")) {
    return false;
  }

  if (/^(?:\/|#|\?|\.\.?\/)/u.test(href)) {
    return true;
  }

  return image ? /^https?:/iu.test(href) : /^(?:https?:|mailto:|tel:)/iu.test(href);
}

const safeMarkdownRenderer = new Renderer();

safeMarkdownRenderer.html = ({ text }: Tokens.HTML | Tokens.Tag): string => escapeHtml(text);

safeMarkdownRenderer.link = function ({ href, title, tokens }: Tokens.Link): string {
  const text = this.parser.parseInline(tokens);

  if (!isSafeMarkdownHref(href)) {
    return text;
  }

  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";

  return `<a href="${escapeHtml(href)}"${titleAttribute}>${text}</a>`;
};

safeMarkdownRenderer.image = ({ href, text, title }: Tokens.Image): string => {
  if (!isSafeMarkdownHref(href, true)) {
    return escapeHtml(text);
  }

  const titleAttribute = title ? ` title="${escapeHtml(title)}"` : "";

  return `<img src="${escapeHtml(href)}" alt="${escapeHtml(text)}"${titleAttribute}>`;
};

marked.use({
  gfm: true,
  breaks: false,
});

/**
 * @param markdown - Markdown text from project content.
 * @returns Rendered HTML for trusted portfolio markdown.
 */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false, renderer: safeMarkdownRenderer }) as string;
}
