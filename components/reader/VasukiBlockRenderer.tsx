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
        <code key={idx} className="px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 font-mono text-[0.88em] text-emerald-600 dark:text-emerald-400">
          {content}
        </code>
      );
    }
    if (span.bold) {
      content = <strong key={idx} className="font-semibold">{content}</strong>;
    }
    if (span.italic) {
      content = <em key={idx} className="italic">{content}</em>;
    }
    if (span.link) {
      content = (
        <a
          key={idx}
          href={span.link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-emerald-600 dark:text-emerald-400 underline decoration-emerald-500/40 hover:decoration-emerald-500 transition-colors"
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
    <div className="my-4 first:mt-0">
      {eyebrow && (
        <div className="text-[11px] font-mono uppercase tracking-wider font-semibold text-emerald-600 dark:text-emerald-400 mb-1">
          {eyebrow}
        </div>
      )}
      <div className="flex items-center gap-2.5">
        {icon && (
          <div className="shrink-0 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <VasukiIcon name={icon} size={18} />
          </div>
        )}
        {level === 1 ? (
          <h1 className="text-2xl font-bold tracking-tight leading-tight">{text}</h1>
        ) : level === 2 ? (
          <h2 className="text-xl font-bold tracking-tight leading-snug">{text}</h2>
        ) : level === 3 ? (
          <h3 className="text-lg font-semibold tracking-tight leading-snug">{text}</h3>
        ) : (
          <h4 className="text-base font-semibold tracking-tight">{text}</h4>
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
      <div className="space-y-3 my-3 text-[14.5px] leading-relaxed text-[var(--vsk-text-main)]">
        {block.paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  return (
    <p className="my-3 text-[14.5px] leading-relaxed text-[var(--vsk-text-main)]">
      {renderRichSpans(block.spans, block.text)}
    </p>
  );
}

// -----------------------------------------------------------------------------
// 3. Code Block
// -----------------------------------------------------------------------------
function RenderCode({ block }: { block: CodeBlock }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(block.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard access might be restricted
    }
  };

  const lines = (block.code || "").split("\n");

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-emerald-500/20 bg-[#001e2b] text-slate-100 shadow-sm text-xs font-mono">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#00141d] border-b border-emerald-500/15 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">
            {block.filename || block.language || "code"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {block.language && (
            <span className="uppercase text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-emerald-400">
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

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/5">
                {block.line_numbers !== false && (
                  <td className="pr-3 select-none text-right text-slate-600 text-[10.5px] w-6 align-top">
                    {idx + 1}
                  </td>
                )}
                <td className="whitespace-pre font-mono text-[12px] text-emerald-100">{line || " "}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {block.caption && (
        <div className="px-3.5 py-1.5 text-[11px] text-slate-400 bg-[#00141d]/50 border-t border-white/5 italic">
          {block.caption}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. Terminal Block
// -----------------------------------------------------------------------------
function RenderTerminal({ block }: { block: TerminalBlock }) {
  return (
    <div className="my-4 rounded-xl overflow-hidden border border-slate-700/60 bg-[#04141d] text-slate-200 shadow-sm text-xs font-mono">
      {/* Terminal Titlebar with macOS style dots */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#000d14] border-b border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {block.title || block.shell || "terminal"}
        </span>
        <div className="w-8" />
      </div>

      {/* Terminal Lines */}
      <div className="p-3.5 space-y-1.5 overflow-x-auto leading-relaxed text-[12px]">
        {block.lines?.map((line, idx) => {
          if (typeof line === "string") {
            const isCommand = line.startsWith("$ ") || line.startsWith("> ");
            return (
              <div key={idx} className="flex gap-2">
                {isCommand ? (
                  <span className="text-emerald-400 font-bold select-none">{line.slice(0, 2)}</span>
                ) : null}
                <span className={isCommand ? "text-slate-100" : "text-slate-300"}>
                  {isCommand ? line.slice(2) : line}
                </span>
              </div>
            );
          }

          const lineObj = line as TerminalLine;
          const prompt = lineObj.prompt || "$";
          const kind = lineObj.kind || "stdout";

          let colorClass = "text-slate-300";
          if (kind === "command") colorClass = "text-emerald-300 font-medium";
          if (kind === "success") colorClass = "text-emerald-400 font-medium";
          if (kind === "error") colorClass = "text-rose-400";
          if (kind === "warning") colorClass = "text-amber-400";
          if (kind === "comment") colorClass = "text-slate-500 italic";

          return (
            <div key={idx} className="flex gap-2">
              {kind === "command" && (
                <span className="text-emerald-500 select-none font-bold">{prompt} </span>
              )}
              <span className={colorClass}>{lineObj.text}</span>
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
function RenderCallout({ block }: { block: CalloutBlock }) {
  const variant = block.variant || "note";

  const config = {
    note: {
      border: "border-blue-500/30 bg-blue-50/50 dark:bg-blue-950/20 text-blue-950 dark:text-blue-100",
      iconColor: "text-blue-600 dark:text-blue-400",
      defaultIcon: "Info",
      defaultTitle: "Note",
    },
    tip: {
      border: "border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-100",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      defaultIcon: "Lightbulb",
      defaultTitle: "Tip",
    },
    important: {
      border: "border-purple-500/30 bg-purple-50/50 dark:bg-purple-950/20 text-purple-950 dark:text-purple-100",
      iconColor: "text-purple-600 dark:text-purple-400",
      defaultIcon: "ShieldCheck",
      defaultTitle: "Important",
    },
    warning: {
      border: "border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 text-amber-950 dark:text-amber-100",
      iconColor: "text-amber-600 dark:text-amber-400",
      defaultIcon: "AlertTriangle",
      defaultTitle: "Warning",
    },
    insight: {
      border: "border-teal-500/30 bg-teal-50/50 dark:bg-teal-950/20 text-teal-950 dark:text-teal-100",
      iconColor: "text-teal-600 dark:text-teal-400",
      defaultIcon: "Sparkles",
      defaultTitle: "Key Insight",
    },
  }[variant] || {
    border: "border-slate-500/30 bg-slate-50/50 dark:bg-slate-900/20 text-slate-900 dark:text-slate-100",
    iconColor: "text-slate-600 dark:text-slate-400",
    defaultIcon: "Info",
    defaultTitle: "Note",
  };

  return (
    <div className={`my-4 p-4 rounded-xl border ${config.border} shadow-xs`}>
      <div className="flex items-center gap-2 mb-1.5">
        <VasukiIcon
          name={block.icon || config.defaultIcon}
          className={`shrink-0 ${config.iconColor}`}
          size={16}
        />
        <span className="font-semibold text-xs uppercase tracking-wider">
          {block.title || config.defaultTitle}
        </span>
      </div>
      <p className="text-[13.5px] leading-relaxed opacity-90 pl-6">
        {block.content}
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 6. Table Block
// -----------------------------------------------------------------------------
function RenderTable({ block }: { block: TableBlock }) {
  const headers = block.headers || block.columns || [];

  return (
    <div className="my-4 rounded-xl overflow-hidden border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)] shadow-xs">
      {block.caption && (
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--vsk-text-muted)] border-b border-[var(--vsk-border)]">
          {block.caption}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          {headers.length > 0 && (
            <thead>
              <tr className="border-b border-[var(--vsk-border)] bg-black/5 dark:bg-white/5">
                {headers.map((hdr, idx) => (
                  <th
                    key={idx}
                    className={`px-3.5 py-2.5 font-semibold text-[var(--vsk-text-main)] ${
                      block.alignment?.[idx] === "center"
                        ? "text-center"
                        : block.alignment?.[idx] === "right"
                        ? "text-right"
                        : "text-left"
                    }`}
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
              <tr
                key={rIdx}
                className="border-b border-[var(--vsk-border)] last:border-0 hover:bg-emerald-500/5 transition-colors"
              >
                {row.map((cell, cIdx) => (
                  <td
                    key={cIdx}
                    className={`px-3.5 py-2.5 text-[var(--vsk-text-main)] leading-relaxed ${
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
      </div>
      {block.source_note && (
        <div className="px-3.5 py-1.5 text-[10.5px] text-[var(--vsk-text-subtle)] border-t border-[var(--vsk-border)] italic">
          Source: {block.source_note}
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 7. Comparison Block
// -----------------------------------------------------------------------------
function RenderComparison({ block }: { block: ComparisonBlock }) {
  return (
    <div className="my-4">
      {block.title && (
        <h4 className="text-sm font-semibold mb-2 text-[var(--vsk-text-main)]">
          {block.title}
        </h4>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Left Column */}
        <div className="p-3.5 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)]">
          <div className="flex items-center gap-2 font-semibold text-xs text-emerald-600 dark:text-emerald-400 mb-2">
            <VasukiIcon name={block.left_icon || "CheckCircle"} size={15} />
            <span>{block.left_title}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[var(--vsk-text-main)] leading-relaxed">
            {block.left_items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column */}
        <div className="p-3.5 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)]">
          <div className="flex items-center gap-2 font-semibold text-xs text-blue-600 dark:text-blue-400 mb-2">
            <VasukiIcon name={block.right_icon || "Layers"} size={15} />
            <span>{block.right_title}</span>
          </div>
          <ul className="space-y-1.5 text-xs text-[var(--vsk-text-main)] leading-relaxed">
            {block.right_items?.map((item, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="text-blue-500 font-bold">•</span>
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
function RenderTimeline({ block }: { block: TimelineBlock }) {
  return (
    <div className="my-4">
      {block.title && (
        <h4 className="text-sm font-semibold mb-3 text-[var(--vsk-text-main)]">
          {block.title}
        </h4>
      )}
      <div className="relative pl-6 space-y-4 border-l-2 border-emerald-500/30 ml-2">
        {block.items?.map((item, idx) => {
          const stepItem = item as { title?: string; description?: string; time?: string; year?: string; step?: string };
          const badge = stepItem.time || stepItem.year || stepItem.step || `${idx + 1}`;
          return (
            <div key={idx} className="relative group">
              <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#001e2b]" />
              <div className="text-[10.5px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold mb-0.5">
                {badge}
              </div>
              <div className="font-semibold text-xs text-[var(--vsk-text-main)]">
                {stepItem.title}
              </div>
              <p className="text-xs text-[var(--vsk-text-muted)] leading-relaxed mt-0.5">
                {stepItem.description}
              </p>
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
function RenderChecklist({ block }: { block: ChecklistBlock }) {
  return (
    <div className="my-4 p-3.5 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)]">
      {block.title && (
        <div className="flex items-center gap-2 font-semibold text-xs text-[var(--vsk-text-main)] mb-2.5">
          <VasukiIcon name="CheckCircle" size={15} className="text-emerald-500" />
          <span>{block.title}</span>
        </div>
      )}
      <div className="space-y-2 text-xs">
        {block.items?.map((item, idx) => {
          const text = typeof item === "string" ? item : (item as { text: string }).text;
          const checked = typeof item === "object" && (item as { checked?: boolean }).checked;
          return (
            <div key={idx} className="flex items-center gap-2 text-[var(--vsk-text-main)]">
              <div
                className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                  checked
                    ? "bg-emerald-500 text-white"
                    : "border border-[var(--vsk-border)] bg-white/40 dark:bg-black/20"
                }`}
              >
                {checked ? "✓" : ""}
              </div>
              <span className={checked ? "line-through opacity-70" : ""}>{text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 10. Step Block
// -----------------------------------------------------------------------------
function RenderStep({ block }: { block: StepBlock }) {
  return (
    <div className="my-4 space-y-3">
      {block.title && (
        <h4 className="text-sm font-semibold text-[var(--vsk-text-main)] mb-1">
          {block.title}
        </h4>
      )}
      {block.steps?.map((stepItem, idx) => {
        const step = stepItem as { step_number?: number; title?: string; description?: string; code?: string; language?: string };
        const num = step.step_number || idx + 1;
        return (
          <div
            key={idx}
            className="p-3.5 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)] flex gap-3"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500 text-[#001e2b] font-bold text-xs flex items-center justify-center shrink-0">
              {num}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-[var(--vsk-text-main)] mb-1">
                {step.title}
              </div>
              <p className="text-xs text-[var(--vsk-text-muted)] leading-relaxed">
                {step.description}
              </p>
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
  );
}

// -----------------------------------------------------------------------------
// 11. Definition Block
// -----------------------------------------------------------------------------
function RenderDefinition({ block }: { block: DefinitionBlock }) {
  return (
    <div className="my-4 p-4 rounded-xl border-l-4 border-emerald-500 bg-[var(--vsk-bg-surface)] border border-[var(--vsk-border)]">
      <div className="flex items-baseline gap-2 mb-1">
        <span className="font-bold text-sm text-[var(--vsk-text-main)]">{block.term}</span>
        {block.pronunciation && (
          <span className="font-mono text-xs text-[var(--vsk-text-subtle)]">/{block.pronunciation}/</span>
        )}
        {block.part_of_speech && (
          <span className="text-[11px] italic text-emerald-600 dark:text-emerald-400">
            {block.part_of_speech}
          </span>
        )}
      </div>
      <p className="text-xs text-[var(--vsk-text-main)] leading-relaxed">{block.definition}</p>
      {block.example && (
        <div className="mt-2 text-[11.5px] italic text-[var(--vsk-text-muted)] border-t border-[var(--vsk-border)] pt-1.5">
          Example: “{block.example}”
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 12. Exercise Block
// -----------------------------------------------------------------------------
function RenderExercise({ block }: { block: ExerciseBlock }) {
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="my-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-950/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 font-semibold text-xs text-indigo-950 dark:text-indigo-200">
          <VasukiIcon name="Cpu" size={16} className="text-indigo-500" />
          <span>{block.title || "Hands-On Exercise"}</span>
        </div>
        {block.difficulty && (
          <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
            {block.difficulty}
          </span>
        )}
      </div>

      <p className="text-xs font-medium text-[var(--vsk-text-main)] mb-2.5">
        <strong>Objective:</strong> {block.objective}
      </p>

      {block.instructions && block.instructions.length > 0 && (
        <div className="space-y-1 text-xs text-[var(--vsk-text-muted)] mb-3">
          {block.instructions.map((inst, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-indigo-500 font-bold">{idx + 1}.</span>
              <span>{inst}</span>
            </div>
          ))}
        </div>
      )}

      {block.starter_code && (
        <div className="my-2">
          <div className="text-[10.5px] font-mono text-slate-400 mb-1">Starter Code:</div>
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
    <div className="my-4 p-4 rounded-xl border-l-4 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10 italic text-[var(--vsk-text-main)]">
      <p className="text-sm leading-relaxed mb-2">“{block.quote}”</p>
      {(block.author || block.attribution) && (
        <div className="text-xs font-semibold not-italic text-emerald-600 dark:text-emerald-400 text-right">
          — {block.author || block.attribution}
          {block.role && <span className="font-normal text-[var(--vsk-text-muted)]"> ({block.role})</span>}
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
    <div className="my-4 p-4 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)] text-center">
      {block.icon && (
        <div className="inline-flex p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-2">
          <VasukiIcon name={block.icon} size={20} />
        </div>
      )}
      <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tracking-tight">
        {block.stat || block.value || "—"}
      </div>
      <div className="text-xs font-semibold text-[var(--vsk-text-main)] mt-1">
        {block.label}
      </div>
      {block.context && (
        <p className="text-[11px] text-[var(--vsk-text-muted)] mt-1 max-w-sm mx-auto">
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
    <div className="my-4 p-4 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)]">
      {block.title && (
        <div className="flex items-center gap-2 font-semibold text-xs text-[var(--vsk-text-main)] mb-2">
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
                <div className="flex justify-between text-[11px] text-[var(--vsk-text-muted)] mb-0.5">
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
        <div className="p-3 rounded bg-black/5 dark:bg-white/5 font-mono text-[11px] text-[var(--vsk-text-muted)] text-center">
          {"code" in block && block.code ? block.code : "Visual Diagram Component"}
        </div>
      )}
      {"caption" in block && block.caption ? (
        <div className="text-[10.5px] text-[var(--vsk-text-subtle)] mt-2 text-center italic">
          {block.caption}
        </div>
      ) : "source_note" in block && block.source_note ? (
        <div className="text-[10.5px] text-[var(--vsk-text-subtle)] mt-2 text-center italic">
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
    <div className="my-4 p-4 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)]">
      <h3 className="text-base font-bold text-[var(--vsk-text-main)] mb-3 flex items-center gap-2">
        <VasukiIcon name="ListOrdered" size={18} className="text-emerald-500" />
        <span>{block.title || "Table of Contents"}</span>
      </h3>
      <div className="space-y-2">
        {block.entries?.map((entry, idx) => (
          <div key={idx} className="flex items-center justify-between text-xs border-b border-[var(--vsk-border)] pb-1.5 last:border-0">
            <div className="flex items-center gap-2 text-[var(--vsk-text-main)]">
              {entry.chapter_number && (
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold w-5">
                  {entry.chapter_number}.
                </span>
              )}
              <span>{entry.title}</span>
            </div>
            <span className="font-mono text-[var(--vsk-text-subtle)]">p. {entry.page_number}</span>
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
    <div className="my-6 p-4 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)] text-xs text-[var(--vsk-text-muted)] space-y-2">
      <div className="font-bold text-sm text-[var(--vsk-text-main)]">{block.title}</div>
      {"rights_notice" in block && block.rights_notice && <p>{block.rights_notice}</p>}
      {"disclaimer" in block && block.disclaimer && <p className="italic">{block.disclaimer}</p>}
      {"contributors" in block && block.contributors && (
        <div>
          <strong>Contributors:</strong> {block.contributors.join(", ")}
        </div>
      )}
      <div className="text-[10px] text-[var(--vsk-text-subtle)] pt-2 border-t border-[var(--vsk-border)]">
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
    <div className="my-2 p-2.5 rounded-lg border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)] text-xs flex items-center justify-between">
      <div>
        <div className="font-medium text-[var(--vsk-text-main)]">{block.title}</div>
        {block.publisher && <div className="text-[10.5px] text-[var(--vsk-text-subtle)]">{block.publisher}</div>}
      </div>
      {block.url && (
        <a
          href={block.url}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-medium"
        >
          Source ↗
        </a>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Main Block Dispatcher
// -----------------------------------------------------------------------------
export function VasukiBlockRenderer({ block }: BlockRendererProps) {
  if (!block || typeof block !== "object") return null;

  switch (block.type) {
    case "heading":
      return <RenderHeading block={block as HeadingBlock} />;
    case "text":
      return <RenderText block={block as TextBlock} />;
    case "code":
      return <RenderCode block={block as CodeBlock} />;
    case "terminal":
      return <RenderTerminal block={block as TerminalBlock} />;
    case "callout":
      return <RenderCallout block={block as CalloutBlock} />;
    case "table":
      return <RenderTable block={block as TableBlock} />;
    case "comparison":
      return <RenderComparison block={block as ComparisonBlock} />;
    case "timeline":
      return <RenderTimeline block={block as TimelineBlock} />;
    case "checklist":
      return <RenderChecklist block={block as ChecklistBlock} />;
    case "step":
      return <RenderStep block={block as StepBlock} />;
    case "definition":
      return <RenderDefinition block={block as DefinitionBlock} />;
    case "exercise":
      return <RenderExercise block={block as ExerciseBlock} />;
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
        return <p className="my-3 text-xs leading-relaxed">{block.text}</p>;
      }
      return null;
  }
}
