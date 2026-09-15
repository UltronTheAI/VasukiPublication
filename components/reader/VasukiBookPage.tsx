"use client";

import React from "react";
import { VasukiBlockRenderer } from "@/components/reader/VasukiBlockRenderer";
import { VasukiHtmlRenderer } from "@/components/reader/VasukiHtmlRenderer";
import { VasukiIcon } from "@/components/vasuki/VasukiIcon";
import type { Page, Book } from "@/lib/types/publication";

interface VasukiBookPageProps {
  page: Page;
  book: Pick<Book, "title" | "subtitle" | "author" | "running_title" | "page_count">;
  themeOverride?: "light" | "dark" | "sepia" | null;
  className?: string;
}

/**
 * Renders an isolated A4 page (210mm x 297mm) with faithful VasukiSquare aesthetics.
 * Encapsulates theme isolation, running headers, footers, chapter openers, structured blocks,
 * and sanitized HTML fallback.
 */
export function VasukiBookPage({
  page,
  book,
  themeOverride,
  className = "",
}: VasukiBookPageProps) {
  // Determine effective theme: user override takes precedence, otherwise page style or page theme
  const effectiveTheme =
    themeOverride ||
    (page.style?.theme as "light" | "dark" | "sepia") ||
    (page.theme as "light" | "dark" | "sepia") ||
    "light";

  const themeClass =
    effectiveTheme === "dark"
      ? "vasuki-theme-dark"
      : effectiveTheme === "sepia"
      ? "vasuki-theme-sepia"
      : "vasuki-theme-light";

  const isCover = page.page_type === "cover" || page.page_number === 1;
  const isChapterOpener =
    page.page_type === "chapter_opener" ||
    page.layout === "chapter_opener" ||
    (page.chapter_number && page.content?.headline && !page.content?.body && (page.content?.blocks?.length ?? 0) <= 2);

  const hasStructuredBlocks = page.content?.blocks && page.content.blocks.length > 0;
  const hasPreRenderedHtml = Boolean(page.html && page.html.trim().length > 0);

  return (
    <div className={`vasuki-book-root w-full h-full flex items-center justify-center select-text ${className}`}>
      <div
        className={`vasuki-page-canvas ${themeClass} shadow-lg rounded-sm border border-[var(--vsk-border)] flex flex-col justify-between p-6 md:p-8 relative transition-colors duration-200`}
        data-page-number={page.page_number}
      >
        {/* =========================================================================
            1. RUNNING HEADER (Hidden on Cover)
           ========================================================================= */}
        {!isCover && (
          <header className="shrink-0 flex items-center justify-between pb-3 mb-4 border-b border-[var(--vsk-border)] text-[11px] font-mono text-[var(--vsk-text-subtle)] select-none">
            <div className="flex items-center gap-2 truncate max-w-[65%]">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                {book.running_title || book.title}
              </span>
              {page.chapter_title && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="truncate">{page.chapter_title}</span>
                </>
              )}
            </div>
            <div className="font-semibold text-[var(--vsk-text-main)]">
              p. {page.page_number}
            </div>
          </header>
        )}

        {/* =========================================================================
            2. PAGE BODY CONTENT
           ========================================================================= */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pr-1 text-sm leading-relaxed custom-scrollbar">
          {/* A. Cover Layout */}
          {isCover && (
            <div className="h-full flex flex-col justify-between py-6 px-2 text-center items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mb-4">
                <VasukiIcon name={page.icon || "BookOpen"} size={22} />
              </div>

              <div className="my-auto space-y-4 max-w-md">
                <div className="inline-block text-[10px] font-mono uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
                  Vasuki Publication
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[var(--vsk-text-main)] leading-tight">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-xs md:text-sm text-[var(--vsk-text-muted)] leading-relaxed">
                    {book.subtitle}
                  </p>
                )}
                {book.author && (
                  <div className="pt-4 text-xs font-semibold text-[var(--vsk-text-main)]">
                    By {book.author}
                  </div>
                )}
              </div>

              <div className="text-[10px] font-mono text-[var(--vsk-text-subtle)]">
                Engine: VasukiSquare • Digital Web Edition
              </div>
            </div>
          )}

          {/* B. Chapter Opener Layout */}
          {!isCover && isChapterOpener && (
            <div className="py-4 space-y-6">
              {/* Chapter Badge */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 text-[#001e2b] font-mono font-extrabold text-lg flex items-center justify-center shadow-xs">
                  {page.chapter_number ? String(page.chapter_number).padStart(2, "0") : "CH"}
                </div>
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                    {page.chapter_name || `Chapter ${page.chapter_number || ""}`}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--vsk-text-main)]">
                    {page.chapter_title || page.content?.headline || "Chapter Introduction"}
                  </h2>
                </div>
              </div>

              {/* Chapter Headline / Summary */}
              {page.content?.headline && page.content.headline !== page.chapter_title && (
                <p className="text-sm md:text-base font-medium text-[var(--vsk-text-main)] leading-relaxed italic border-l-2 border-emerald-500 pl-3">
                  {page.content.headline}
                </p>
              )}

              {/* Key Points */}
              {page.content?.key_points && page.content.key_points.length > 0 && (
                <div className="p-4 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)]">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
                    <VasukiIcon name="Sparkles" size={14} />
                    <span>In this chapter:</span>
                  </div>
                  <ul className="space-y-1.5 text-xs text-[var(--vsk-text-main)]">
                    {page.content.key_points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Blocks within Chapter Opener */}
              {hasStructuredBlocks && (
                <div className="space-y-4 pt-2">
                  {page.content.blocks!.map((block, idx) => (
                    <VasukiBlockRenderer key={idx} block={block} theme={effectiveTheme} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* C. Standard Editorial Content Layout */}
          {!isCover && !isChapterOpener && (
            <div className="space-y-4">
              {/* Headline if present */}
              {page.content?.headline && (
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-[var(--vsk-text-main)] mb-3">
                  {page.content.headline}
                </h2>
              )}

              {/* Body text if present */}
              {page.content?.body && (
                <div className="text-[14px] leading-relaxed text-[var(--vsk-text-main)] space-y-3">
                  {page.content.body.split("\n\n").map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              )}

              {/* Structured Blocks (Primary rendering path) */}
              {hasStructuredBlocks && (
                <div className="space-y-4">
                  {page.content.blocks!.map((block, idx) => (
                    <VasukiBlockRenderer key={idx} block={block} theme={effectiveTheme} />
                  ))}
                </div>
              )}

              {/* Pre-rendered HTML fallback if no structured blocks exist */}
              {!hasStructuredBlocks && hasPreRenderedHtml && (
                <VasukiHtmlRenderer html={page.html!} />
              )}

              {/* Key points if rendered outside opener */}
              {page.content?.key_points && page.content.key_points.length > 0 && !hasStructuredBlocks && (
                <div className="p-3.5 rounded-xl border border-[var(--vsk-border)] bg-[var(--vsk-bg-surface)] my-3">
                  <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <VasukiIcon name="CheckCircle" size={14} />
                    <span>Summary Points:</span>
                  </div>
                  <ul className="space-y-1 text-xs text-[var(--vsk-text-main)]">
                    {page.content.key_points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-500 font-bold">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </main>

        {/* =========================================================================
            3. RUNNING FOOTER (Hidden on Cover)
           ========================================================================= */}
        {!isCover && (
          <footer className="shrink-0 flex items-center justify-between pt-3 mt-4 border-t border-[var(--vsk-border)] text-[11px] font-mono text-[var(--vsk-text-subtle)] select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Vasuki Square Publication</span>
            </div>
            <div>
              {page.page_number} / {book.page_count || "?"}
            </div>
          </footer>
        )}
      </div>
    </div>
  );
}

