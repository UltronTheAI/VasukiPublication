"use client";

import React from "react";
import { VasukiBlockRenderer } from "@/components/reader/VasukiBlockRenderer";
import { VasukiHtmlRenderer } from "@/components/reader/VasukiHtmlRenderer";
import { VasukiIcon } from "@/components/vasuki/VasukiIcon";
import { renderMarkdownInline, renderMarkdownParagraphs } from "@/lib/vasuki/markdown";
import type { Page, Book } from "@/lib/types/publication";

interface VasukiBookPageProps {
  page: Page;
  book: Pick<Book, "title" | "subtitle" | "author" | "running_title" | "page_count"> & {
    chapters?: Book["chapters"];
  };
  nextPage?: Page | null;
  themeOverride?: "light" | "dark" | "sepia" | null;
  className?: string;
}

function extractSvgFromHtml(html?: string | null): string | null {
  if (!html || typeof html !== "string") return null;
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
  return svgMatch ? svgMatch[0] : null;
}

function getLuminance(hexOrColor?: string | null): number | null {
  if (!hexOrColor || typeof hexOrColor !== "string") return null;
  const str = hexOrColor.trim();

  // 1. Hex parsing (#RGB, #RRGGBB, #RRGGBBAA)
  if (str.startsWith("#")) {
    const clean = str.replace("#", "").trim();
    let r = 0;
    let g = 0;
    let b = 0;
    if (clean.length === 3 || clean.length === 4) {
      r = parseInt(clean[0] + clean[0], 16);
      g = parseInt(clean[1] + clean[1], 16);
      b = parseInt(clean[2] + clean[2], 16);
    } else if (clean.length >= 6) {
      r = parseInt(clean.substring(0, 2), 16);
      g = parseInt(clean.substring(2, 4), 16);
      b = parseInt(clean.substring(4, 6), 16);
    } else {
      return null;
    }
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  // 2. rgb / rgba parsing
  const rgbMatch = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    return (r * 299 + g * 587 + b * 114) / 1000;
  }

  return null;
}

function isColorDark(color?: string | null): boolean {
  const lum = getLuminance(color);
  if (lum === null) return false;
  return lum < 145;
}

/**
 * High-fidelity VasukiBookPage renderer reproducing exact VasukiSquare layout,
 * typography, dynamic chapter & page background colors, and MongoDB icons.
 */
export function VasukiBookPage({
  page,
  book,
  nextPage,
  themeOverride,
  className = "",
}: VasukiBookPageProps) {
  const pageRaw = page as unknown as Record<string, unknown>;
  const rawStyle = (page.style || {}) as Record<string, unknown>;
  const nextRaw = (nextPage as unknown as Record<string, unknown>) || {};
  const nextStyle = ((nextPage?.style || {}) as Record<string, unknown>) || {};

  const isCover =
    page.page_type === "cover" ||
    page.layout === "cover" ||
    page.page_number === 1;

  const isChapterOpener =
    page.page_type === "chapter_opener" ||
    page.layout === "chapter_opener" ||
    page.page_type === "opener";

  const currentChapterMeta =
    page.chapter_number && book.chapters
      ? book.chapters.find((c) => c.chapter_number === page.chapter_number)
      : null;

  // 1. Resolve Dynamic MongoDB Page & Chapter Colors and Styles
  const rawBg =
    (rawStyle.background_color as string) ||
    (rawStyle.bg_color as string) ||
    (rawStyle.backgroundColor as string) ||
    (rawStyle.background as string) ||
    (pageRaw.background_color as string) ||
    (pageRaw.bg_color as string) ||
    (pageRaw.background as string) ||
    null;

  const inheritedBg = isChapterOpener && !rawBg
    ? (nextStyle.background_color as string) ||
      (nextStyle.bg_color as string) ||
      (nextStyle.backgroundColor as string) ||
      (nextStyle.background as string) ||
      (nextRaw.background_color as string) ||
      (nextRaw.bg_color as string) ||
      (nextRaw.background as string) ||
      null
    : null;

  const customBg = rawBg || inheritedBg || null;

  const rawGradient =
    (rawStyle.background_gradient as string) ||
    (rawStyle.gradient as string) ||
    (rawStyle.bg_gradient as string) ||
    (pageRaw.background_gradient as string) ||
    (pageRaw.gradient as string) ||
    null;

  const inheritedGradient = isChapterOpener && !rawGradient
    ? (nextStyle.background_gradient as string) ||
      (nextStyle.gradient as string) ||
      (nextStyle.bg_gradient as string) ||
      (nextRaw.background_gradient as string) ||
      (nextRaw.gradient as string) ||
      null
    : null;

  const customGradient = rawGradient || inheritedGradient || null;

  const rawAccent =
    (rawStyle.accent_color as string) ||
    (rawStyle.accentColor as string) ||
    (rawStyle.accent as string) ||
    (pageRaw.accent_color as string) ||
    (pageRaw.accent as string) ||
    null;

  const inheritedAccent = isChapterOpener && !rawAccent
    ? (nextStyle.accent_color as string) ||
      (nextStyle.accentColor as string) ||
      (nextStyle.accent as string) ||
      (nextRaw.accent_color as string) ||
      (nextRaw.accent as string) ||
      null
    : null;

  const customAccent = rawAccent || inheritedAccent || null;

  const rawAccentSoft =
    (rawStyle.accent_soft as string) ||
    (rawStyle.accentSoft as string) ||
    (rawStyle.accent_color_soft as string) ||
    (pageRaw.accent_soft as string) ||
    null;

  const inheritedAccentSoft = isChapterOpener && !rawAccentSoft
    ? (nextStyle.accent_soft as string) ||
      (nextStyle.accentSoft as string) ||
      (nextStyle.accent_color_soft as string) ||
      (nextRaw.accent_soft as string) ||
      null
    : null;

  const customAccentSoft = rawAccentSoft || inheritedAccentSoft || null;

  const rawTextColor =
    (rawStyle.text_color as string) ||
    (rawStyle.textColor as string) ||
    (rawStyle.color as string) ||
    (pageRaw.text_color as string) ||
    (pageRaw.color as string) ||
    null;

  const inheritedTextColor = isChapterOpener && !rawTextColor
    ? (nextStyle.text_color as string) ||
      (nextStyle.textColor as string) ||
      (nextStyle.color as string) ||
      (nextRaw.text_color as string) ||
      (nextRaw.color as string) ||
      null
    : null;

  const customTextColor = rawTextColor || inheritedTextColor || null;

  const rawTextMuted =
    (rawStyle.text_muted as string) ||
    (rawStyle.textMuted as string) ||
    (rawStyle.secondary_color as string) ||
    (rawStyle.text_secondary as string) ||
    (pageRaw.text_muted as string) ||
    null;

  const inheritedTextMuted = isChapterOpener && !rawTextMuted
    ? (nextStyle.text_muted as string) ||
      (nextStyle.textMuted as string) ||
      (nextStyle.secondary_color as string) ||
      (nextStyle.text_secondary as string) ||
      (nextRaw.text_muted as string) ||
      null
    : null;

  const customTextMuted = rawTextMuted || inheritedTextMuted || null;

  const rawBorderColor =
    (rawStyle.border_color as string) ||
    (rawStyle.borderColor as string) ||
    (rawStyle.border as string) ||
    (pageRaw.border_color as string) ||
    (pageRaw.border as string) ||
    null;

  const inheritedBorderColor = isChapterOpener && !rawBorderColor
    ? (nextStyle.border_color as string) ||
      (nextStyle.borderColor as string) ||
      (nextStyle.border as string) ||
      (nextRaw.border_color as string) ||
      (nextRaw.border as string) ||
      null
    : null;

  const customBorderColor = rawBorderColor || inheritedBorderColor || null;

  const rawBorderStrong =
    (rawStyle.border_strong as string) ||
    (rawStyle.borderStrong as string) ||
    (rawStyle.border_color_strong as string) ||
    (pageRaw.border_strong as string) ||
    null;

  const inheritedBorderStrong = isChapterOpener && !rawBorderStrong
    ? (nextStyle.border_strong as string) ||
      (nextStyle.borderStrong as string) ||
      (nextStyle.border_color_strong as string) ||
      (nextRaw.border_strong as string) ||
      null
    : null;

  const customBorderStrong = rawBorderStrong || inheritedBorderStrong || null;

  const rawCardBg =
    (rawStyle.card_bg as string) ||
    (rawStyle.card_background as string) ||
    (rawStyle.cardBg as string) ||
    (rawStyle.surface as string) ||
    (rawStyle.surface_color as string) ||
    (pageRaw.card_bg as string) ||
    null;

  const inheritedCardBg = isChapterOpener && !rawCardBg
    ? (nextStyle.card_bg as string) ||
      (nextStyle.card_background as string) ||
      (nextStyle.cardBg as string) ||
      (nextStyle.surface as string) ||
      (nextStyle.surface_color as string) ||
      (nextRaw.card_bg as string) ||
      null
    : null;

  const customCardBg = rawCardBg || inheritedCardBg || null;

  const rawDecorative =
    (rawStyle.decorative_color as string) ||
    (rawStyle.decorative as string) ||
    (pageRaw.decorative_color as string) ||
    null;

  const inheritedDecorative = isChapterOpener && !rawDecorative
    ? (nextStyle.decorative_color as string) ||
      (nextStyle.decorative as string) ||
      (nextRaw.decorative_color as string) ||
      null
    : null;

  const customDecorative = rawDecorative || inheritedDecorative || null;

  const rawFont =
    (rawStyle.font_family as string) ||
    (rawStyle.fontFamily as string) ||
    (rawStyle.font as string) ||
    (pageRaw.font_family as string) ||
    (pageRaw.font as string) ||
    null;

  const inheritedFont = isChapterOpener && !rawFont
    ? (nextStyle.font_family as string) ||
      (nextStyle.fontFamily as string) ||
      (nextStyle.font as string) ||
      (nextRaw.font_family as string) ||
      (nextRaw.font as string) ||
      null
    : null;

  const customFont = rawFont || inheritedFont || null;

  // 2. Resolve Dynamic MongoDB Page & Chapter Icons
  let htmlIcon: string | null = null;
  if (typeof page.html === "string") {
    const lucideMatch = page.html.match(/class=["'][^"']*lucide-([a-z0-9-]+)[^"']*["']/i);
    if (lucideMatch && lucideMatch[1]) {
      htmlIcon = lucideMatch[1];
    }
  }

  const rawContent = (page.content || {}) as Record<string, unknown>;
  const rawPageIcon =
    (typeof page.icon === "string" && page.icon ? page.icon : null) ||
    (typeof pageRaw.chapter_icon === "string" && pageRaw.chapter_icon ? (pageRaw.chapter_icon as string) : null) ||
    (typeof rawContent.icon === "string" && rawContent.icon ? (rawContent.icon as string) : null) ||
    (typeof rawContent.chapter_icon === "string" && rawContent.chapter_icon ? (rawContent.chapter_icon as string) : null) ||
    htmlIcon ||
    null;

  const inheritedIcon = isChapterOpener && !rawPageIcon
    ? (typeof nextPage?.icon === "string" && nextPage.icon ? nextPage.icon : null) ||
      (typeof nextRaw?.chapter_icon === "string" && nextRaw.chapter_icon ? (nextRaw.chapter_icon as string) : null) ||
      (typeof currentChapterMeta?.icon === "string" && currentChapterMeta.icon ? currentChapterMeta.icon : null) ||
      null
    : null;

  const pageIcon: string | null = rawPageIcon || inheritedIcon || null;

  // 3. Determine Effective Theme & Contrast Invariants
  const isBgDark =
    (customBg ? isColorDark(customBg) : false) ||
    (customGradient
      ? customGradient.includes("#0") ||
        customGradient.includes("#1") ||
        customGradient.includes("#2") ||
        isColorDark(customBg)
      : false);

  const effectiveTheme =
    themeOverride === "dark" || themeOverride === "light"
      ? themeOverride
      : isBgDark
      ? "dark"
      : (rawStyle.theme as "light" | "dark") ||
        (page.theme as "light" | "dark") ||
        (nextPage?.style?.theme as "light" | "dark") ||
        (nextPage?.theme as "light" | "dark") ||
        (currentChapterMeta?.theme as "light" | "dark") ||
        "light";

  const isDarkCanvas = effectiveTheme === "dark" || isBgDark;

  // Enforce high-contrast text colors on dark backgrounds
  const resolvedTextColor = isDarkCanvas
    ? !customTextColor || isColorDark(customTextColor)
      ? "#ffffff"
      : customTextColor
    : customTextColor;

  const resolvedTextSecondary = isDarkCanvas
    ? !customTextMuted || isColorDark(customTextMuted)
      ? "#e2e8f0"
      : customTextMuted
    : customTextMuted;

  const resolvedTextMuted = isDarkCanvas
    ? !customTextMuted || isColorDark(customTextMuted)
      ? "#cbd5e1"
      : customTextMuted
    : customTextMuted;

  const hasStructuredBlocks = Boolean(page.content?.blocks && page.content.blocks.length > 0);
  const hasPreRenderedHtml = Boolean(page.html && page.html.trim().length > 0);

  const isTitlePage =
    !isCover &&
    !hasStructuredBlocks &&
    (page.page_type === "title" ||
      page.page_type === "imprint" ||
      page.layout === "title" ||
      page.layout === "imprint" ||
      (page.page_number === 2 && !page.chapter_number && page.page_type !== "chapter_content" && !page.content?.blocks?.length));

  const isThankYou =
    !isCover &&
    !hasStructuredBlocks &&
    (page.page_type === "thank_you" ||
      page.layout === "thank_you" ||
      (page.page_type !== "chapter_content" && Boolean(book.page_count) && page.page_number === book.page_count && !isChapterOpener));

  const layoutType =
    page.layout ||
    (isCover
      ? "cover"
      : isChapterOpener
      ? "chapter_opener"
      : isTitlePage
      ? "title"
      : isThankYou
      ? "thank_you"
      : "editorial_standard");

  // Check if first block already renders the headline to avoid duplicate headings on TOC/Copyright/Heading pages
  const firstBlockType = page.content?.blocks?.[0]?.type;
  const firstBlockTitle =
    (page.content?.blocks?.[0] as { title?: string; text?: string })?.title ||
    (page.content?.blocks?.[0] as { title?: string; text?: string })?.text;

  const isHeadlineRedundant =
    !page.content?.headline ||
    page.page_type === "toc" ||
    page.page_type === "copyright" ||
    page.layout === "toc" ||
    page.layout === "copyright" ||
    firstBlockType === "toc" ||
    firstBlockType === "copyright" ||
    firstBlockType === "acknowledgement" ||
    (firstBlockType === "heading" &&
      firstBlockTitle?.toLowerCase().trim() === page.content.headline?.toLowerCase().trim()) ||
    firstBlockTitle?.toLowerCase().trim() === page.content.headline?.toLowerCase().trim();

  const hideHeaderFooter = isCover || isChapterOpener || isThankYou;

  // Build Comprehensive Dynamic Inline Style Layer for full MongoDB fidelity
  const computedPageStyle: React.CSSProperties = {
    ...(customGradient
      ? {
          background: customGradient,
          ["--theme-bg" as string]: customBg || "transparent",
        }
      : customBg
      ? {
          backgroundColor: customBg,
          ["--theme-bg" as string]: customBg,
          ["--color-canvas" as string]: customBg,
          ["--color-canvas-dark" as string]: customBg,
        }
      : {}),
    ...(customAccent
      ? {
          ["--theme-accent" as string]: customAccent,
          ["--color-brand-green" as string]: customAccent,
          ["--color-primary" as string]: customAccent,
          ["--theme-accent-soft" as string]: customAccentSoft || `${customAccent}1f`,
        }
      : {}),
    ...(resolvedTextColor
      ? {
          color: resolvedTextColor,
          ["--theme-text" as string]: resolvedTextColor,
          ["--text-primary" as string]: resolvedTextColor,
          ["--text-primary-dark" as string]: resolvedTextColor,
        }
      : isDarkCanvas
      ? {
          color: "#ffffff",
          ["--theme-text" as string]: "#ffffff",
          ["--text-primary" as string]: "#ffffff",
          ["--text-primary-dark" as string]: "#ffffff",
        }
      : {}),
    ...(resolvedTextSecondary
      ? {
          ["--theme-text-secondary" as string]: resolvedTextSecondary,
          ["--text-secondary" as string]: resolvedTextSecondary,
          ["--text-secondary-dark" as string]: resolvedTextSecondary,
        }
      : isDarkCanvas
      ? {
          ["--theme-text-secondary" as string]: "#e2e8f0",
          ["--text-secondary" as string]: "#e2e8f0",
          ["--text-secondary-dark" as string]: "#e2e8f0",
        }
      : {}),
    ...(resolvedTextMuted
      ? {
          ["--theme-text-muted" as string]: resolvedTextMuted,
          ["--theme-text-subtle" as string]: resolvedTextMuted,
          ["--text-muted" as string]: resolvedTextMuted,
          ["--text-muted-dark" as string]: resolvedTextMuted,
        }
      : isDarkCanvas
      ? {
          ["--theme-text-muted" as string]: "#cbd5e1",
          ["--theme-text-subtle" as string]: "#94a3b8",
          ["--text-muted" as string]: "#cbd5e1",
          ["--text-muted-dark" as string]: "#cbd5e1",
        }
      : {}),
    ...(customBorderColor
      ? {
          borderColor: customBorderColor,
          ["--theme-border" as string]: customBorderColor,
          ["--theme-border-strong" as string]: customBorderStrong || customBorderColor,
        }
      : isDarkCanvas
      ? {
          ["--theme-border" as string]: "rgba(255, 255, 255, 0.12)",
          ["--theme-border-strong" as string]: "rgba(255, 255, 255, 0.28)",
        }
      : {}),
    ...(customCardBg
      ? {
          ["--theme-card-bg" as string]: customCardBg,
        }
      : isDarkCanvas
      ? {
          ["--theme-card-bg" as string]: "rgba(255, 255, 255, 0.06)",
        }
      : {}),
    ...(customDecorative
      ? {
          ["--theme-decorative" as string]: customDecorative,
        }
      : {}),
    ...(customFont
      ? {
          fontFamily: customFont,
        }
      : {}),
  };

  return (
    <div className={`vasuki-book-root w-full h-full flex items-center justify-center select-text ${className}`}>
      <div
        className={`page theme-${effectiveTheme} layout-${layoutType}`}
        data-page-number={page.page_number}
        style={computedPageStyle}
      >
        {/* Subtle Decorative Watermark Icon from MongoDB */}
        {pageIcon && !isCover && (
          <div className="decorative-watermark-icon pos-bottom-right" aria-hidden="true">
            <VasukiIcon name={pageIcon} size={140} />
          </div>
        )}

        <div className="page-safe-content">
          {/* =========================================================================
              1. PAGE HEADER (Hidden on Cover, Chapter Opener, Thank You)
             ========================================================================= */}
          {!hideHeaderFooter && (
            <header className="page-header">
              <span
                className="header-chapter truncate flex items-center gap-1.5"
                title={
                  page.chapter_number
                    ? `Chapter ${page.chapter_number}: ${page.chapter_title || ""}`
                    : page.chapter_title || ""
                }
              >
                {pageIcon && (
                  <VasukiIcon
                    name={pageIcon}
                    size={13}
                    className="shrink-0 text-[var(--theme-accent,#00ed64)]"
                  />
                )}
                <span className="truncate">
                  {page.chapter_number
                    ? `Chapter ${page.chapter_number}: ${page.chapter_title || ""}`
                    : page.chapter_title || ""}
                </span>
              </span>
              <span
                className="header-topic truncate"
                title={book.running_title || book.title}
              >
                {book.running_title || book.title}
              </span>
            </header>
          )}

          {/* =========================================================================
              2. PAGE MAIN CONTENT
             ========================================================================= */}
          <main className="page-content custom-scrollbar">
            {/* A. Full-Bleed Cover Layout */}
            {isCover && (
              <div
                className="cover-hero cover-hero-solid"
                style={{
                  backgroundColor: customBg || "#f9fbfa",
                }}
              >
                {/* Background geometric svg layer */}
                <div
                  className="vector-scenery-layer"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    zIndex: 1,
                    opacity: 0.35,
                  }}
                >
                  {hasPreRenderedHtml && extractSvgFromHtml(page.html) ? (
                    <div
                      className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
                      dangerouslySetInnerHTML={{ __html: extractSvgFromHtml(page.html)! }}
                    />
                  ) : (
                    <svg
                      viewBox="0 0 794 1123"
                      width="100%"
                      height="100%"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <circle
                        cx="397"
                        cy="591"
                        r="120"
                        fill="none"
                        stroke="#001e2b"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                      />
                      <circle
                        cx="397"
                        cy="591"
                        r="70"
                        fill={customAccent || "#00ed64"}
                        fillOpacity="0.15"
                        stroke={customAccent || "#00ed64"}
                        strokeWidth="2"
                      />
                      <path
                        d="M 0 1123 L 0 750 Q 397 680 794 750 L 794 1123 Z"
                        fill="#001e2b"
                        opacity="0.08"
                      />
                    </svg>
                  )}
                </div>

                {/* Top brand header */}
                <div
                  className="cover-top-header"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%",
                  }}
                >
                  <div className="cover-category-badge">
                    {page.content?.headline || "VASUKISQUARE EDITION"}
                  </div>
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <VasukiIcon name={pageIcon || "BookOpen"} size={16} />
                  </div>
                </div>

                {/* Title Box */}
                <div
                  className="cover-title-wrapper"
                  style={{
                    position: "relative",
                    zIndex: 2,
                    margin: "auto 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    width: "100%",
                  }}
                >
                  <div className="cover-title-container">
                    <h1 className="cover-title">
                      {book.title}
                    </h1>
                    <div
                      className="cover-divider"
                      style={{
                        width: "36px",
                        height: "2.5px",
                        backgroundColor: customAccent || "#00ed64",
                        borderRadius: "1px",
                        opacity: 0.95,
                      }}
                    />
                    {book.subtitle && (
                      <p className="cover-subtitle">
                        {book.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer strip */}
                <footer className="cover-footer-strip">
                  <span className="cover-footer-author">
                    {book.author || "Vasuki"}
                  </span>
                  <span className="cover-footer-edition">
                    DIGITAL WEB EDITION
                  </span>
                </footer>
              </div>
            )}

            {/* B. Chapter Opener Layout */}
            {!isCover && isChapterOpener && (
              <div className="chapter-opener-block">
                <div className="chapter-icon">
                  <VasukiIcon name={pageIcon || "Sparkles"} size={56} />
                </div>
                <div className="chapter-num">
                  {page.chapter_number ? `Chapter ${page.chapter_number}` : "Chapter"}
                </div>
                <h1 className="chapter-title">
                  {renderMarkdownInline(page.chapter_title || page.content?.headline || "Chapter Introduction")}
                </h1>
                {page.content?.body && (
                  <div className="typo-lead" style={{ marginTop: "16px", maxWidth: "520px" }}>
                    {renderMarkdownParagraphs(page.content.body)}
                  </div>
                )}
                {hasStructuredBlocks && (
                  <div className="w-full text-left" style={{ marginTop: "24px" }}>
                    {page.content!.blocks!.map((block, idx) => (
                      <VasukiBlockRenderer key={idx} block={block} theme={effectiveTheme} />
                    ))}
                  </div>
                )}
                {!hasStructuredBlocks && hasPreRenderedHtml && (
                  <div className="w-full text-left" style={{ marginTop: "20px" }}>
                    <VasukiHtmlRenderer html={page.html!} />
                  </div>
                )}
              </div>
            )}

            {/* C. Title / Imprint Layout */}
            {!isCover && !isChapterOpener && isTitlePage && (
              <div className="title-page-container">
                <div className="title-page-header">
                  <span className="typo-eyebrow">VasukiSquare Architectural Series</span>
                </div>
                <div className="title-page-body">
                  <h1 className="title-page-title">{book.title}</h1>
                  <div className="title-page-divider" />
                  <div className="title-page-subtitle">
                    {book.subtitle
                      ? renderMarkdownInline(book.subtitle)
                      : page.content?.body
                      ? renderMarkdownParagraphs(page.content.body)
                      : "A Definitive Architecture & Implementation Guide"}
                  </div>
                </div>
                <div className="title-page-imprint">
                  <p><strong>VasukiSquare Technical Publishing Engine</strong></p>
                  <p>Researched from primary authoritative sources and verified for production architectures.</p>
                  <p style={{ marginTop: "6px", fontSize: "11px", color: "var(--theme-text-subtle)" }}>
                    First Edition (2026) • All Rights Reserved
                  </p>
                </div>
              </div>
            )}

            {/* D. Thank You Page Layout */}
            {!isCover && !isChapterOpener && !isTitlePage && isThankYou && (
              <div className="thank-you-container">
                <div className="thank-you-brand">
                  <span>VASUKISQUARE TECHNICAL PUBLISHING</span>
                  <span>END OF VOLUME</span>
                </div>
                <div className="thank-you-body">
                  <div className="thank-you-icon">
                    <VasukiIcon name={pageIcon || "CheckCircle2"} size={48} />
                  </div>
                  <div className="thank-you-divider" />
                  <h1 className="thank-you-title">
                    {renderMarkdownInline(page.content?.headline || "THANK YOU")}
                  </h1>
                  <div className="thank-you-statement">
                    {page.content?.body
                      ? renderMarkdownParagraphs(page.content.body)
                      : "Thank you for reading. Researched from primary authoritative sources and rendered deterministically to physical A4 print specifications by VasukiSquare."}
                  </div>
                </div>
                <div className="thank-you-footer">
                  <span>{book.running_title || book.title}</span>
                  <span>FIRST EDITION</span>
                </div>
              </div>
            )}

            {/* E. Standard Editorial Page Layout */}
            {!isCover && !isChapterOpener && !isTitlePage && !isThankYou && (
              <>
                {!isHeadlineRedundant && page.content?.headline && (
                  <h2 className="content-headline">
                    {renderMarkdownInline(page.content.headline)}
                  </h2>
                )}

                {hasStructuredBlocks && (
                  <div className="w-full flex flex-col gap-4 min-h-0 pb-4">
                    {page.content!.blocks!.map((block, idx) => (
                      <VasukiBlockRenderer key={idx} block={block} theme={effectiveTheme} />
                    ))}
                  </div>
                )}

                {!hasStructuredBlocks && hasPreRenderedHtml && (
                  <VasukiHtmlRenderer html={page.html!} />
                )}

                {!hasStructuredBlocks && !hasPreRenderedHtml && page.content?.body && (
                  <div className="content-body">
                    {renderMarkdownParagraphs(page.content.body)}
                  </div>
                )}
              </>
            )}
          </main>

          {/* =========================================================================
              3. PAGE FOOTER (Hidden on Cover, Chapter Opener, Thank You)
             ========================================================================= */}
          {!hideHeaderFooter && (
            <footer className="page-footer">
              <span className="footer-title">
                {book.running_title || book.title}
              </span>
              <span className="footer-page-num">{page.page_number}</span>
            </footer>
          )}
        </div>
      </div>
    </div>
  );
}
