"use client";

import React, { useState } from "react";
import { VasukiIcon } from "@/components/vasuki/VasukiIcon";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import type {
  ContentBlock,
  HeadingBlock,
  TextBlock,
  CodeBlock,
  TerminalBlock,
  CalloutBlock,
  TableBlock,
  ComparisonBlock,
  TimelineBlock,
  ChecklistBlock,
  StepBlock,
  DefinitionBlock,
  ExerciseBlock,
  QuoteBlock,
  StatisticBlock,
  ChartBlock,
  DiagramBlock,
  TocBlock,
  CopyrightBlock,
  AcknowledgementBlock,
  SourceBlock,
  RichSpan,
  TerminalLine,
} from "@/lib/types/publication";

interface BlockRendererProps {
  block: ContentBlock;
  theme?: "light" | "dark" | "sepia";
}

// -----------------------------------------------------------------------------
// Rich Spans Helper
// -----------------------------------------------------------------------------
function renderRichSpans(spans?: RichSpan[], defaultText?: string) {
  if (!spans || spans.length === 0) {
    return defaultText || null;
  }

  return spans.map((span, idx) => {
    let content: React.ReactNode = span.text;

    if (span.code) {
      content = (
        <code key={idx} className="rich-code">
          {content}
        </code>
      );
    }
    if (span.bold) {
      content = <strong key={idx}>{content}</strong>;
    }
    if (span.italic) {
      content = <em key={idx}>{content}</em>;
    }
    if (span.link) {
      content = (
        <a
          key={idx}
          href={span.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="rich-link"
        >
          {content}
        </a>
      );
    }

    return <React.Fragment key={idx}>{content}</React.Fragment>;
  });
}

// -----------------------------------------------------------------------------
// 1. Heading Block
// -----------------------------------------------------------------------------
function RenderHeading({ block }: { block: HeadingBlock }) {
  const { level, text, icon, eyebrow } = block;

  return (
    <div className="heading-block my-4 first:mt-0">
      {eyebrow && <div className="typo-eyebrow mb-1">{eyebrow}</div>}
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <VasukiIcon name={icon} size={18} />
          </div>
        )}
        {level === 1 ? (
          <h1>{text}</h1>
        ) : level === 2 ? (
          <h2>{text}</h2>
        ) : level === 3 ? (
          <h3>{text}</h3>
        ) : (
          <h4>{text}</h4>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. Text Block
// -----------------------------------------------------------------------------
function RenderText({ block }: { block: TextBlock }) {
  if (block.paragraphs && block.paragraphs.length > 0) {
    return (
      <div className="content-body space-y-3 my-3">
        {block.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  return (
    <p className="content-body my-3">
      {renderRichSpans(block.spans, block.text)}
    </p>
  );
}

// -----------------------------------------------------------------------------
// 3. Code Block
// -----------------------------------------------------------------------------
function RenderCode({ block, theme = "light" }: { block: CodeBlock; theme?: string }) {
  const [copied, setCopied] = useState(false);

  // Hide empty code blocks
  if (!block || !block.code || !block.code.trim()) {
    return null;
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access might be restricted
    }
  };

  const lines = block.code.split("\n");

  return (
    <figure className="component-code-figure my-4">
      <div className={`component-code-block theme-${theme}`}>
        {/* Code Header Bar */}
        <div className="code-header">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="code-filename truncate" title={block.filename || block.language || "code"}>
              {block.filename || (block.language ? `${block.language.toLowerCase()}` : "code")}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {block.language && (
              <span className="code-lang-badge">
                {block.language}
              </span>
            )}
            <button
              onClick={handleCopy}
              title="Copy code"
              className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Code Body with Custom Scrollbar & Comfortable Padding */}
        <pre className="code-pre custom-scrollbar">
          <code className={`language-${block.language || "text"}`}>
            <table className="w-full border-collapse">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-white/5">
                    {block.line_numbers !== false && (
                      <td className="pr-3 select-none text-right text-slate-500 text-[11px] w-6 align-top opacity-60">
                        {idx + 1}
                      </td>
                    )}
                    <td className="whitespace-pre font-mono text-[12.5px]">{line || " "}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </code>
        </pre>
      </div>

      {block.caption && (
        <figcaption className="code-caption">
          {block.caption}
        </figcaption>
      )}
    </figure>
  );
}

// -----------------------------------------------------------------------------
// 4. Terminal Block Helper & Sanitization
// -----------------------------------------------------------------------------
interface CleanedTerminalLine {
  text: string;
  kind: "command" | "continuation" | "stdout" | "error" | "warning" | "success" | "comment";
  prompt?: string;
}

function sanitizeTerminalLines(rawLines?: (string | TerminalLine)[]): CleanedTerminalLine[] {
  if (!rawLines || rawLines.length === 0) return [];

  const result: CleanedTerminalLine[] = [];
  let isContinuation = false;

  for (let i = 0; i < rawLines.length; i++) {
    const item = rawLines[i];
    let text = "";
    let kind: CleanedTerminalLine["kind"] = "stdout";
    let prompt = "$";

    if (typeof item === "string") {
      text = item;
      if (text.startsWith("$ ")) {
        kind = "command";
        text = text.slice(2);
      } else if (text.startsWith("> ")) {
        kind = "continuation";
        prompt = ">";
        text = text.slice(2);
      } else if (text.startsWith("# ")) {
        kind = "comment";
      } else {
        kind = "stdout";
      }
    } else if (item && typeof item === "object") {
      text = item.text || "";
      kind = (item.kind as CleanedTerminalLine["kind"]) || "stdout";
      prompt = item.prompt || "$";
    }

    const trimmed = text.trim();

    // 1. Filter out lone dangling backslashes on their own line
    if (trimmed === "\\" || trimmed === "\\\\") {
      if (result.length > 0) {
        const last = result[result.length - 1];
        if (!last.text.trimEnd().endsWith("\\")) {
          last.text = `${last.text.trimEnd()} \\`;
        }
      }
      continue;
    }

    // 2. Skip completely blank lines if at start or end
    if (!trimmed && (result.length === 0 || i === rawLines.length - 1)) {
      continue;
    }

    // 3. Detect JSON payload or sub-argument continuation lines to avoid rogue $ prompts
    if (isContinuation) {
      if (
        kind === "command" &&
        (trimmed.startsWith("-") ||
          trimmed.startsWith("{") ||
          trimmed.startsWith("}") ||
          trimmed.startsWith('"') ||
          trimmed.startsWith("'") ||
          trimmed.startsWith("]") ||
          trimmed.startsWith("/") ||
          trimmed === "}'" ||
          trimmed === "}\"")
      ) {
        kind = "continuation";
      }
    }

    if (kind === "command") {
      if (trimmed.endsWith("\\") || trimmed.includes("-d '{") || trimmed.includes("-d \"{")) {
        isContinuation = true;
      } else {
        isContinuation = false;
      }
    } else if (kind === "continuation") {
      if (trimmed.endsWith("'") || trimmed.endsWith("\"") || trimmed === "}'" || trimmed === "}\"") {
        isContinuation = false;
      }
    }

    result.push({ text, kind, prompt });
  }

  return result;
}

function colorizeJsonString(str: string): React.ReactNode[] {
  const jsonTokenRegex = /("([^"\\]|\\.)*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[{}[\],:])/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = jsonTokenRegex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(str.slice(lastIndex, match.index));
    }
    const token = match[0];
    if (token.endsWith(":")) {
      nodes.push(
        <span key={nodes.length} className="t-key">
          {token.slice(0, -1)}
        </span>,
        <span key={`${nodes.length}-colon`} className="t-punct">
          :
        </span>
      );
    } else if (token.startsWith('"') || token.startsWith("'")) {
      nodes.push(
        <span key={nodes.length} className="t-str">
          {token}
        </span>
      );
    } else if (token === "true" || token === "false" || token === "null") {
      nodes.push(
        <span key={nodes.length} className="t-bool">
          {token}
        </span>
      );
    } else if (/^-?\d/.test(token)) {
      nodes.push(
        <span key={nodes.length} className="t-num">
          {token}
        </span>
      );
    } else if (/[{}[\],]/.test(token)) {
      nodes.push(
        <span key={nodes.length} className="t-punct">
          {token}
        </span>
      );
    } else {
      nodes.push(token);
    }
    lastIndex = jsonTokenRegex.lastIndex;
  }

  if (lastIndex < str.length) {
    nodes.push(str.slice(lastIndex));
  }

  return nodes;
}

function colorizeTerminalLine(text: string, kind: string): React.ReactNode {
  if (!text) return "\u00A0";

  if (kind === "comment" || text.trim().startsWith("#")) {
    return <span className="t-comment">{text}</span>;
  }

  if (kind === "error") {
    return <span className="t-error">{text}</span>;
  }

  if (kind === "warning") {
    return <span className="t-warn">{text}</span>;
  }

  if (kind === "success") {
    return <span className="t-success">{text}</span>;
  }

  // Check for HTTP status line or standard server response
  if (text.startsWith("HTTP/") || /^\d{3}\s+[A-Z]+/.test(text.trim())) {
    const isSuccess = text.includes("200") || text.includes("201");
    const isErr = text.includes("40") || text.includes("50");
    return (
      <span className={isSuccess ? "t-success" : isErr ? "t-error" : "t-subcmd"}>
        {text}
      </span>
    );
  }

  // Tokenize CLI commands, arguments, variables, flags, endpoints, numbers, and JSON
  const tokenRegex = /(https?:\/\/[^\s"'\\]+)|("([^"\\]|\\.)*"|'([^'\\]|\\.)*')|(?:\$[A-Z0-9_{}]+|\$\([^\)]+\))|(--?[a-zA-Z0-9_-]+(?:=[^\s"']*)?)|(\b(?:GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\b)|(\b(?:curl|git|npm|npx|pnpm|yarn|pip|python|python3|node|docker|kubectl|aws|az|gcloud|brew|cargo|go|rustc|deno|bun|sudo|cat|grep|cd|ls|mkdir|rm|touch|chmod|chown|echo|export|set|source|sh|bash|zsh)\b)|(\b\d+(?:\.\d+)?\b)|(\\\s*$)/g;

  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }

    const [
      full,
      url,
      quotedStr,
      ,
      ,
      envVar,
      flag,
      httpMethod,
      cliCmd,
      num,
      trailingSlash,
    ] = match;

    if (url) {
      nodes.push(
        <span key={nodes.length} className="t-url">
          {url}
        </span>
      );
    } else if (quotedStr) {
      if (
        (quotedStr.startsWith("'{") && quotedStr.endsWith("}'")) ||
        (quotedStr.startsWith('"{') && quotedStr.endsWith('}"'))
      ) {
        const quoteChar = quotedStr[0];
        const inner = quotedStr.slice(1, -1);
        nodes.push(
          <span key={`${nodes.length}-q1`} className="t-str">
            {quoteChar}
          </span>,
          ...colorizeJsonString(inner),
          <span key={`${nodes.length}-q2`} className="t-str">
            {quoteChar}
          </span>
        );
      } else {
        nodes.push(
          <span key={nodes.length} className="t-str">
            {quotedStr}
          </span>
        );
      }
    } else if (envVar) {
      nodes.push(
        <span key={nodes.length} className="t-var">
          {envVar}
        </span>
      );
    } else if (flag) {
      nodes.push(
        <span key={nodes.length} className="t-flag">
          {flag}
        </span>
      );
    } else if (httpMethod) {
      nodes.push(
        <span key={nodes.length} className="t-method">
          {httpMethod}
        </span>
      );
    } else if (cliCmd) {
      nodes.push(
        <span key={nodes.length} className="t-cmd">
          {cliCmd}
        </span>
      );
    } else if (num) {
      nodes.push(
        <span key={nodes.length} className="t-num">
          {num}
        </span>
      );
    } else if (trailingSlash) {
      nodes.push(
        <span key={nodes.length} className="t-slash">
          {trailingSlash}
        </span>
      );
    } else {
      nodes.push(full);
    }

    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex));
  }

  return nodes.length > 0 ? nodes : text;
}

function RenderTerminal({ block, theme = "light" }: { block: TerminalBlock; theme?: string }) {
  const cleanedLines = sanitizeTerminalLines(block?.lines);

  // Hide terminal if completely empty
  if (cleanedLines.length === 0) {
    return null;
  }

  const title = block.title ? block.title.trim() : "terminal";
  const shell = block.shell ? block.shell.trim().toUpperCase() : "BASH";

  return (
    <div className={`component-terminal-window theme-${theme} my-4`}>
      {/* Terminal Titlebar with macOS style dots and guaranteed single-line ellipsis */}
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <span className="terminal-title" title={title}>
          {title}
        </span>
        <span className="terminal-shell">
          {shell}
        </span>
      </div>

      {/* Terminal Body with comfortable padding & scroll protection */}
      <div className="terminal-body custom-scrollbar">
        {cleanedLines.map((line, idx) => {
          const isCommand = line.kind === "command";
          const isContinuation = line.kind === "continuation";

          return (
            <div
              key={idx}
              className={`terminal-line is-${line.kind} ${isContinuation ? "is-continuation" : ""}`}
            >
              {isCommand && (
                <span className="terminal-prompt">{line.prompt || "$"}</span>
              )}
              {isContinuation && (
                <span className="terminal-prompt text-emerald-500/50 select-none">&gt;</span>
              )}
              <span className="terminal-content">
                {colorizeTerminalLine(line.text, line.kind)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 5. Callout Block
// -----------------------------------------------------------------------------
function RenderCallout({ block, theme = "light" }: { block: CalloutBlock; theme?: string }) {
  const variant = block.variant || "note";

  const config = {
    note: {
      icon: "Info",
      title: "Note",
    },
    tip: {
      icon: "Lightbulb",
      title: "Tip",
    },
    important: {
      icon: "ShieldAlert",
      title: "Important",
    },
    warning: {
      icon: "AlertTriangle",
      title: "Warning",
    },
    insight: {
      icon: "Sparkles",
      title: "Key Insight",
    },
  }[variant] || {
    icon: "Info",
    title: "Note",
  };

  return (
    <div className={`component-callout theme-${theme} variant-${variant} my-4`}>
      <div className="callout-header">
        <VasukiIcon
          name={block.icon || config.icon}
          size={16}
          className="callout-icon"
        />
        <span className="callout-title">
          {block.title || config.title}
        </span>
      </div>
      <div className="callout-content">
        {block.content}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. Table Block
// -----------------------------------------------------------------------------
function RenderTable({ block }: { block: TableBlock }) {
  const headers = block.headers || block.columns || [];

  return (
    <div className="component-table-container my-4">
      {block.caption && (
        <div className="table-caption">
          {block.caption}
        </div>
      )}
      <table className="component-table">
        {headers.length > 0 && (
          <thead>
            <tr>
              {headers.map((hdr, idx) => (
                <th
                  key={idx}
                  className={
                    block.alignment?.[idx] === "center"
                      ? "text-center"
                      : block.alignment?.[idx] === "right"
                      ? "text-right"
                      : "text-left"
                  }
                >
                  <div className="flex items-center gap-1.5">
                    {block.header_icons?.[idx] && (
                      <VasukiIcon name={block.header_icons[idx]} size={13} />
                    )}
                    <span>{hdr}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {block.rows?.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  className={`${
                    block.alignment?.[cIdx] === "center"
                      ? "text-center"
                      : block.alignment?.[cIdx] === "right"
                      ? "text-right"
                      : "text-left"
                  } ${
                    cIdx === 0 && block.highlight_first_column
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : ""
                  }`}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {block.source_note && (
        <div className="typo-caption italic mt-1.5">
          Source: {block.source_note}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 7. Comparison Block
// -----------------------------------------------------------------------------
function RenderComparison({ block, theme = "light" }: { block: ComparisonBlock; theme?: string }) {
  return (
    <div className={`component-comparison theme-${theme} my-4`}>
      {block.title && (
        <h4 className="typo-heading-5 mb-2">
          {block.title}
        </h4>
      )}
      <div className="comparison-grid grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left Column (Do / Correct) */}
        <div className="comparison-column comparison-left p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)]">
          <div className="comparison-col-header flex items-center gap-2 font-semibold text-xs text-emerald-600 dark:text-emerald-400 mb-2">
            <VasukiIcon name={block.left_icon || "CheckCircle"} size={15} />
            <span>{block.left_title || "Do"}</span>
          </div>
          <ul className="comparison-list space-y-1.5 text-xs leading-relaxed">
            {block.left_items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column (Don't / Incorrect) */}
        <div className="comparison-column comparison-right p-3.5 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)]">
          <div className="comparison-col-header flex items-center gap-2 font-semibold text-xs text-orange-600 dark:text-orange-400 mb-2">
            <VasukiIcon name={block.right_icon || "XCircle"} size={15} />
            <span>{block.right_title || "Don't"}</span>
          </div>
          <ul className="comparison-list space-y-1.5 text-xs leading-relaxed">
            {block.right_items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-orange-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 8. Timeline Block
// -----------------------------------------------------------------------------
function RenderTimeline({ block, theme = "light" }: { block: TimelineBlock; theme?: string }) {
  return (
    <div className={`component-timeline theme-${theme} my-4`}>
      {block.title && (
        <div className="timeline-title">
          {block.title}
        </div>
      )}
      <div className="timeline-track">
        {block.items?.map((item, idx) => {
          const stepItem = item as { title?: string; description?: string; time?: string; year?: string; step?: string };
          const badge = stepItem.time || stepItem.year || stepItem.step || `${idx + 1}`;
          return (
            <div key={idx} className="timeline-item">
              <div className="timeline-marker">
                <span className="timeline-tag">{badge}</span>
              </div>
              <div className="timeline-content">
                <div className="timeline-heading">{stepItem.title}</div>
                {stepItem.description && (
                  <div className="timeline-desc">{stepItem.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 9. Checklist Block
// -----------------------------------------------------------------------------
function RenderChecklist({ block, theme = "light" }: { block: ChecklistBlock; theme?: string }) {
  return (
    <div className={`component-checklist theme-${theme} my-4`}>
      {block.title && (
        <div className="checklist-title">
          {block.title}
        </div>
      )}
      <ul className="checklist-items">
        {block.items?.map((item, idx) => {
          const text = typeof item === "string" ? item : (item as { text: string }).text;
          const checked = typeof item === "object" && (item as { checked?: boolean }).checked;
          return (
            <li key={idx} className="checklist-row">
              <div
                className={`checklist-checkbox w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                  checked
                    ? "bg-emerald-500 text-white"
                    : "border border-[var(--theme-border)] bg-black/5 dark:bg-white/5"
                }`}
              >
                {checked ? "✓" : ""}
              </div>
              <span className={`checklist-text ${checked ? "line-through opacity-70" : ""}`}>{text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 10. Step Block
// -----------------------------------------------------------------------------
function RenderStep({ block, theme = "light" }: { block: StepBlock; theme?: string }) {
  return (
    <div className={`component-steps theme-${theme} my-4`}>
      {block.title && (
        <div className="step-block-title">
          {block.title}
        </div>
      )}
      <div className="step-list">
        {block.steps?.map((stepItem, idx) => {
          const step = stepItem as { step_number?: number; title?: string; description?: string; code?: string; language?: string };
          const num = step.step_number || idx + 1;
          return (
            <div key={idx} className="step-card">
              <div className="step-badge">
                {num}
              </div>
              <div className="step-details">
                <div className="font-semibold text-xs mb-1">
                  {step.title}
                </div>
                {step.description && (
                  <p className="text-xs text-[var(--theme-text-secondary)] leading-relaxed">
                    {step.description}
                  </p>
                )}
                {step.code && (
                  <pre className="mt-2 p-2 rounded-lg bg-[#00141d] text-emerald-300 text-[11px] font-mono overflow-x-auto">
                    <code>{step.code}</code>
                  </pre>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 11. Definition Block
// -----------------------------------------------------------------------------
function RenderDefinition({ block, theme = "light" }: { block: DefinitionBlock; theme?: string }) {
  return (
    <div className={`component-definition theme-${theme} my-4 p-4 rounded-xl border-l-4 border-emerald-500 bg-[var(--theme-card-bg)] border border-[var(--theme-border)]`}>
      <div className="def-header flex items-baseline gap-2 mb-1">
        <span className="def-term font-bold text-sm text-[var(--theme-text)]">{block.term}</span>
        {block.pronunciation && (
          <span className="def-meta font-mono text-xs text-[var(--theme-text-subtle)]">/{block.pronunciation}/</span>
        )}
        {block.part_of_speech && (
          <span className="text-[11px] italic text-emerald-600 dark:text-emerald-400">
            {block.part_of_speech}
          </span>
        )}
      </div>
      <div className="def-body text-xs text-[var(--theme-text-secondary)] leading-relaxed">{block.definition}</div>
      {block.example && (
        <div className="def-example mt-2 text-[11.5px] italic text-[var(--theme-text-muted)] border-t border-[var(--theme-border)] pt-1.5">
          Example: “{block.example}”
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 12. Exercise Block
// -----------------------------------------------------------------------------
function RenderExercise({ block, theme = "light" }: { block: ExerciseBlock; theme?: string }) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className={`component-exercise theme-${theme} my-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/20 dark:bg-indigo-950/20`}>
      <div className="exercise-header flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-xs text-indigo-950 dark:text-indigo-200">
          <VasukiIcon name="Cpu" size={16} className="text-indigo-500" />
          <h3 className="exercise-title text-xs font-bold">{block.title || "Hands-On Exercise"}</h3>
        </div>
        {block.difficulty && (
          <span className="exercise-badge px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
            {block.difficulty}
          </span>
        )}
      </div>

      <div className="exercise-objective text-xs font-medium text-[var(--theme-text)] mb-2.5">
        <strong>Objective:</strong> {block.objective}
      </div>

      {block.instructions && block.instructions.length > 0 && (
        <ol className="exercise-instructions space-y-1 text-xs text-[var(--theme-text-secondary)] mb-3 list-decimal pl-4">
          {block.instructions.map((inst, idx) => (
            <li key={idx}>{inst}</li>
          ))}
        </ol>
      )}

      {block.starter_code && (
        <div className="my-2">
          <div className="text-[10.5px] font-mono text-[var(--theme-text-muted)] mb-1">Starter Code:</div>
          <pre className="p-2.5 rounded-lg bg-[#00141d] text-emerald-300 text-xs font-mono overflow-x-auto">
            <code>{block.starter_code}</code>
          </pre>
        </div>
      )}

      {block.solution && (
        <div className="mt-3 pt-2 border-t border-indigo-500/20">
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            <span>{showSolution ? "Hide Solution" : "Reveal Solution"}</span>
            {showSolution ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          {showSolution && (
            <pre className="mt-2 p-2.5 rounded-lg bg-[#00141d] text-emerald-300 text-xs font-mono overflow-x-auto">
              <code>{block.solution}</code>
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 13. Quote Block
// -----------------------------------------------------------------------------
function RenderQuote({ block }: { block: QuoteBlock }) {
  return (
    <div className="component-quote my-4 p-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 italic text-[var(--theme-text)]">
      <blockquote className="text-sm leading-relaxed mb-2">“{block.quote}”</blockquote>
      {(block.author || block.attribution) && (
        <div className="quote-author text-xs font-semibold not-italic text-emerald-600 dark:text-emerald-400 text-right">
          — {block.author || block.attribution}
          {block.role && <span className="font-normal text-[var(--theme-text-muted)]"> ({block.role})</span>}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 14. Statistic Block
// -----------------------------------------------------------------------------
function RenderStatistic({ block }: { block: StatisticBlock }) {
  return (
    <div className="component-statistic my-4 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-center">
      {block.icon && (
        <div className="inline-flex p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
          <VasukiIcon name={block.icon} size={20} />
        </div>
      )}
      <div className="typo-stat-number text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
        {block.stat || block.value || "—"}
      </div>
      <div className="stat-label text-xs font-semibold text-[var(--theme-text)] mt-1">
        {block.label}
      </div>
      {block.context && (
        <p className="stat-context text-[11px] text-[var(--theme-text-muted)] mt-1 max-w-sm mx-auto">
          {block.context}
        </p>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 15. Chart / Diagram Block
// -----------------------------------------------------------------------------
function RenderChartOrDiagram({ block }: { block: ChartBlock | DiagramBlock }) {
  return (
    <div className="component-chart my-4 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)]">
      {block.title && (
        <div className="flex items-center gap-2 font-semibold text-xs text-[var(--theme-text)] mb-2">
          <VasukiIcon name="BarChart3" size={15} className="text-emerald-500" />
          <span>{block.title}</span>
        </div>
      )}
      {"values" in block && block.categories && block.values ? (
        <div className="space-y-2 my-2">
          {block.categories.map((cat, idx) => {
            const val = block.values?.[0]?.[idx] || 0;
            const maxVal = Math.max(...(block.values?.[0] || [100]));
            const pct = Math.min(100, Math.round((val / (maxVal || 1)) * 100));
            return (
              <div key={idx} className="text-xs">
                <div className="flex justify-between text-[11px] text-[var(--theme-text-muted)] mb-0.5">
                  <span>{cat}</span>
                  <span className="font-mono font-semibold">{val} {block.unit || ""}</span>
                </div>
                <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-3 rounded bg-black/5 dark:bg-white/5 font-mono text-[11px] text-[var(--theme-text-muted)] text-center">
          {"code" in block && block.code ? block.code : "Visual Diagram Component"}
        </div>
      )}
      {"caption" in block && block.caption ? (
        <div className="text-[10.5px] text-[var(--theme-text-subtle)] mt-2 text-center italic">
          {block.caption}
        </div>
      ) : "source_note" in block && block.source_note ? (
        <div className="text-[10.5px] text-[var(--theme-text-subtle)] mt-2 text-center italic">
          Source: {block.source_note}
        </div>
      ) : null}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 16. TOC Block
// -----------------------------------------------------------------------------
function RenderToc({ block }: { block: TocBlock }) {
  return (
    <div className="component-toc my-4 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)]">
      <h3 className="toc-header text-base font-bold text-[var(--theme-text)] mb-3 flex items-center gap-2">
        <VasukiIcon name="ListOrdered" size={18} className="text-emerald-500" />
        <span>{block.title || "Table of Contents"}</span>
      </h3>
      <div className="toc-entries space-y-2">
        {block.entries?.map((entry, idx) => (
          <div key={idx} className="toc-entry flex items-center justify-between text-xs border-b border-[var(--theme-border)] pb-1.5 last:border-0">
            <div className="flex items-center gap-2 text-[var(--theme-text)]">
              {entry.chapter_number && (
                <span className="toc-chapter-num font-mono text-emerald-600 dark:text-emerald-400 font-semibold w-5">
                  {entry.chapter_number}.
                </span>
              )}
              <span className="toc-title">{entry.title}</span>
            </div>
            <span className="toc-page-num font-mono text-[var(--theme-text-subtle)]">p. {entry.page_number}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 17. Copyright / Acknowledgement Block
// -----------------------------------------------------------------------------
function RenderCopyright({ block }: { block: CopyrightBlock | AcknowledgementBlock }) {
  return (
    <div className="copyright-container my-6 p-4 rounded-xl border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-xs text-[var(--theme-text-muted)] space-y-2">
      <div className="copyright-title font-bold text-sm text-[var(--theme-text)]">{block.title}</div>
      {"rights_notice" in block && block.rights_notice && <div className="copyright-meta">{block.rights_notice}</div>}
      {"disclaimer" in block && block.disclaimer && <div className="copyright-disclaimer italic">{block.disclaimer}</div>}
      {"contributors" in block && block.contributors && (
        <div>
          <strong>Contributors:</strong> {block.contributors.join(", ")}
        </div>
      )}
      <div className="text-[10px] text-[var(--theme-text-subtle)] pt-2 border-t border-[var(--theme-border)]">
        Published via VasukiPublication • Engine: VasukiSquare
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 18. Source Block
// -----------------------------------------------------------------------------
function RenderSource({ block }: { block: SourceBlock }) {
  return (
    <div className="component-source-card my-2 p-3 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-card-bg)] text-xs">
      <div className="source-header flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] uppercase text-[var(--theme-text-muted)]">
          {block.publisher || "REFERENCE"}
        </span>
        {block.url && (
          <a
            href={block.url}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="source-url-btn text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-semibold"
          >
            Source ↗
          </a>
        )}
      </div>
      <div className="source-title font-semibold text-[var(--theme-text)]">
        {block.title}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Block Dispatcher
// -----------------------------------------------------------------------------
export function VasukiBlockRenderer({ block, theme = "light" }: BlockRendererProps) {
  if (!block || typeof block !== "object") return null;

  switch (block.type) {
    case "heading":
      return <RenderHeading block={block as HeadingBlock} />;
    case "text":
      return <RenderText block={block as TextBlock} />;
    case "code":
      return <RenderCode block={block as CodeBlock} theme={theme} />;
    case "terminal":
      return <RenderTerminal block={block as TerminalBlock} theme={theme} />;
    case "callout":
      return <RenderCallout block={block as CalloutBlock} theme={theme} />;
    case "table":
      return <RenderTable block={block as TableBlock} />;
    case "comparison":
      return <RenderComparison block={block as ComparisonBlock} theme={theme} />;
    case "timeline":
      return <RenderTimeline block={block as TimelineBlock} theme={theme} />;
    case "checklist":
      return <RenderChecklist block={block as ChecklistBlock} theme={theme} />;
    case "step":
      return <RenderStep block={block as StepBlock} theme={theme} />;
    case "definition":
      return <RenderDefinition block={block as DefinitionBlock} theme={theme} />;
    case "exercise":
      return <RenderExercise block={block as ExerciseBlock} theme={theme} />;
    case "quote":
      return <RenderQuote block={block as QuoteBlock} />;
    case "statistic":
      return <RenderStatistic block={block as StatisticBlock} />;
    case "chart":
    case "diagram":
      return <RenderChartOrDiagram block={block as ChartBlock | DiagramBlock} />;
    case "toc":
      return <RenderToc block={block as TocBlock} />;
    case "copyright":
    case "acknowledgement":
      return <RenderCopyright block={block as CopyrightBlock | AcknowledgementBlock} />;
    case "source":
      return <RenderSource block={block as SourceBlock} />;
    default:
      // Fallback for unknown block types
      if ("text" in block && typeof block.text === "string") {
        return <p className="content-body my-3 text-xs leading-relaxed">{block.text}</p>;
      }
      return null;
  }
}
