import React from "react";

/**
 * Lightweight, high-performance inline Markdown parser for VasukiSquare publications.
 * Converts:
 * - **bold** and __bold__ to <strong>
 * - *italic* and _italic_ to <em>
 * - ***bold italic*** and ___bold italic___ to <strong><em>
 * - `code` to <code className="rich-code">
 * - [label](url) to <a className="rich-link">
 * - ~~strikethrough~~ to <s>
 * Defends against XSS by operating directly on React node trees without dangerouslySetInnerHTML.
 */
export function renderMarkdownInline(text?: string | null): React.ReactNode {
  if (!text || typeof text !== "string") return null;

  // Single capturing group regex matching standard markdown inline tokens
  const markdownRegex = /(```[\s\S]*?```|`[^`\n]+`|\*\*\*[^*]+\*\*\*|___[^_]+___|\*\*[^*]+\*\*|__[^_]+__|(?<!\w)\*[^*\n]+\*(?!\w)|(?<!\w)_[^_\n]+_(?!\w)|~~[^~\n]+~~|\[[^\]]+\]\([^)]+\))/g;

  const parts = text.split(markdownRegex);
  if (parts.length === 1) return text;

  const nodes: React.ReactNode[] = [];
  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];
    if (!part) continue;

    if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
      nodes.push(
        <code
          key={idx}
          className="rich-code font-mono text-[0.88em] bg-[var(--theme-border,#e2e8f0)] text-[var(--theme-accent,#00ed64)] px-1.5 py-0.5 rounded border border-[var(--theme-border-strong,#cbd5e1)]"
        >
          {part.slice(1, -1)}
        </code>
      );
    } else if (
      (part.startsWith("***") && part.endsWith("***") && part.length >= 6) ||
      (part.startsWith("___") && part.endsWith("___") && part.length >= 6)
    ) {
      nodes.push(
        <strong key={idx} className="font-bold text-[var(--theme-text)]">
          <em className="italic">{part.slice(3, -3)}</em>
        </strong>
      );
    } else if (
      (part.startsWith("**") && part.endsWith("**") && part.length >= 4) ||
      (part.startsWith("__") && part.endsWith("__") && part.length >= 4)
    ) {
      nodes.push(
        <strong key={idx} className="font-bold text-[var(--theme-text)]">
          {part.slice(2, -2)}
        </strong>
      );
    } else if (
      (part.startsWith("*") && part.endsWith("*") && part.length >= 2) ||
      (part.startsWith("_") && part.endsWith("_") && part.length >= 2)
    ) {
      nodes.push(
        <em key={idx} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    } else if (part.startsWith("~~") && part.endsWith("~~") && part.length >= 4) {
      nodes.push(
        <s key={idx} className="line-through opacity-75">
          {part.slice(2, -2)}
        </s>
      );
    } else if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        const [, linkLabel, linkUrl] = linkMatch;
        nodes.push(
          <a
            key={idx}
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="rich-link text-[var(--theme-accent,#00ed64)] underline hover:opacity-85 font-medium"
          >
            {linkLabel}
          </a>
        );
      } else {
        nodes.push(part);
      }
    } else {
      nodes.push(part);
    }
  }

  return nodes.length > 0 ? nodes : text;
}

/**
 * Parses multiline markdown paragraphs into semantic block nodes.
 */
export function renderMarkdownParagraphs(text?: string | null): React.ReactNode {
  if (!text || typeof text !== "string") return null;

  const paragraphs = text.split(/\n\s*\n/);
  if (paragraphs.length <= 1) {
    return renderMarkdownInline(text);
  }

  return (
    <div className="space-y-3">
      {paragraphs.map((p, idx) => (
        <p key={idx} className="leading-relaxed">
          {renderMarkdownInline(p.trim())}
        </p>
      ))}
    </div>
  );
}

