import type { ReactNode } from "react";
import type { DocumentBlock, DocumentInline } from "@/content/schema";
import { projectResourceHref } from "./project-resource-routes";

interface DocumentBlocksProps {
  readonly blocks: ReadonlyArray<DocumentBlock>;
  readonly projectSlug: string;
}

/** Renders safe document blocks without injecting markup. */
export function DocumentBlocks({ blocks, projectSlug }: DocumentBlocksProps): ReactNode {
  return (
    <>{blocks.map((block, index) => renderBlock(block, projectSlug, `${block.type}-${index}`))}</>
  );
}

function renderBlock(block: DocumentBlock, projectSlug: string, key: string): ReactNode {
  if (block.type === "heading") {
    const level = Math.min(Math.max(block.level ?? 2, 1), 6);
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag className={`resource-heading resource-heading--${level}`} id={block.id} key={key}>
        {renderInline(block.content, projectSlug)}
      </Tag>
    );
  }
  if (block.type === "paragraph") {
    return (
      <p className="resource-paragraph" key={key}>
        {renderInline(block.content, projectSlug)}
      </p>
    );
  }
  if (block.type === "code") {
    return (
      <pre className="resource-code" key={key}>
        <code data-language={block.language}>{block.value}</code>
      </pre>
    );
  }
  if (block.type === "rule") return <hr className="resource-rule" key={key} />;
  if (block.type === "quote") {
    return (
      <blockquote className="resource-quote" key={key}>
        <DocumentBlocks blocks={block.content} projectSlug={projectSlug} />
      </blockquote>
    );
  }
  if (block.type === "list") {
    const List = block.ordered ? "ol" : "ul";
    return (
      <List className="resource-list" key={key}>
        {block.items.map((item, itemIndex) => (
          <li key={`${key}-${itemIndex}`}>
            <DocumentBlocks blocks={item} projectSlug={projectSlug} />
          </li>
        ))}
      </List>
    );
  }
  return (
    <div className="resource-table-wrap" key={key}>
      <table className="resource-table">
        <tbody>
          {block.rows.map((row, rowIndex) => (
            <tr key={`${key}-${rowIndex}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${key}-${rowIndex}-${cellIndex}`}>{renderInline(cell, projectSlug)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(items: ReadonlyArray<DocumentInline>, projectSlug: string): ReactNode {
  return items.map((item, index) => {
    const key = `${item.type}-${index}`;
    if (item.type === "text") return <span key={key}>{item.value}</span>;
    if (item.type === "code")
      return (
        <code className="resource-inline-code" key={key}>
          {item.value}
        </code>
      );
    if (item.type === "strong") return <strong key={key}>{item.value}</strong>;
    if (item.type === "emphasis") return <em key={key}>{item.value}</em>;
    const href = item.target
      ? projectResourceHref(
          projectSlug,
          item.target.kind === "document" ? "docs" : "diagrams",
          item.target.id,
        )
      : item.href;
    const external = Boolean(href && /^https?:/iu.test(href));
    return href ? (
      <a
        href={href}
        key={key}
        rel={external ? "noreferrer" : undefined}
        target={external ? "_blank" : undefined}
      >
        {renderInline(item.children, projectSlug)}
      </a>
    ) : (
      <span key={key}>{renderInline(item.children, projectSlug)}</span>
    );
  });
}
