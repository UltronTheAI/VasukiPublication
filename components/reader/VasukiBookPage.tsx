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

function extractSvgFromHtml(html?: string | null): string | null {
  if (!html || typeof html !== "string") return null;
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
  return svgMatch ? svgMatch[0] : null;
}

function isHexDark(hex?: string | null): boolean {
  if (!hex || typeof hex !== "string") return false;
  const clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  }
  return false;
}

/**
 * High-fidelity VasukiBookPage renderer reproducing exact VasukiSquare layout,
 * typography, dynamic chapter & page background colors, and MongoDB icons.
 */
export function VasukiBookPage({
  page,
  book,
  themeOverride,
  className = "",
}: VasukiBookPageProps) {
  const pageRaw = page as unknown as Record<string, unknown>;
  const rawStyle = (page.style || {}) as Record<string, unknown>;

  // 1. Resolve Dynamic MongoDB Page & Chapter Colors and Styles
  const customBg =
    (rawStyle.background_color as string) ||
    (rawStyle.bg_color as string) ||
    (rawStyle.backgroundColor as string) ||
    (rawStyle.background as string) ||
    (pageRaw.background_color as string) ||
    (pageRaw.bg_color as string) ||
    (pageRaw.background as string) ||
    null;

  const customGradient =
    (rawStyle.background_gradient as string) ||
    (rawStyle.gradient as string) ||
    (rawStyle.bg_gradient as string) ||
    (pageRaw.background_gradient as string) ||
    (pageRaw.gradient as string) ||
    null;

  const customAccent =
    (rawStyle.accent_color as string) ||
    (rawStyle.accentColor as string) ||
    (rawStyle.accent as string) ||
    (pageRaw.accent_color as string) ||
    (pageRaw.accent as string) ||
    null;

  const customAccentSoft =
    (rawStyle.accent_soft as string) ||
    (rawStyle.accentSoft as string) ||
    (rawStyle.accent_color_soft as string) ||
    (pageRaw.accent_soft as string) ||
    null;

  const customTextColor =
    (rawStyle.text_color as string) ||
    (rawStyle.textColor as string) ||
    (rawStyle.color as string) ||
    (pageRaw.text_color as string) ||
    (pageRaw.color as string) ||
    null;

  const customTextMuted =
    (rawStyle.text_muted as string) ||
    (rawStyle.textMuted as string) ||
    (rawStyle.secondary_color as string) ||
    (rawStyle.text_secondary as string) ||
    (pageRaw.text_muted as string) ||
    null;

  const customBorderColor =
    (rawStyle.border_color as string) ||
    (rawStyle.borderColor as string) ||
    (rawStyle.border as string) ||
    (pageRaw.border_color as string) ||
    (pageRaw.border as string) ||
    null;

  const customBorderStrong =
    (rawStyle.border_strong as string) ||
    (rawStyle.borderStrong as string) ||
    (rawStyle.border_color_strong as string) ||
    (pageRaw.border_strong as string) ||
    null;

  const customCardBg =
    (rawStyle.card_bg as string) ||
    (rawStyle.card_background as string) ||
    (rawStyle.cardBg as string) ||
    (rawStyle.surface as string) ||
    (rawStyle.surface_color as string) ||
    (pageRaw.card_bg as string) ||
    null;

  const customDecorative =
    (rawStyle.decorative_color as string) ||
    (rawStyle.decorative as string) ||
    (pageRaw.decorative_color as string) ||
    null;

  const customFont =
    (rawStyle.font_family as string) ||
    (rawStyle.fontFamily as string) ||
    (rawStyle.font as string) ||
    (pageRaw.font_family as string) ||
    (pageRaw.font as string) ||
    null;

  // 2. Resolve Dynamic MongoDB Page & Chapter Icons
  const rawContent = (page.content || {}) as Record<string, unknown>;
  const pageIcon: string | null =
    (typeof page.icon === "string" && page.icon ? page.icon : null) ||
    (typeof pageRaw.chapter_icon === "string" && pageRaw.chapter_icon ? (pageRaw.chapter_icon as string) : null) ||
    (typeof rawContent.icon === "string" && rawContent.icon ? (rawContent.icon as string) : null) ||
    (typeof rawContent.chapter_icon === "string" && rawContent.chapter_icon ? (rawContent.chapter_icon as string) : null) ||
    null;

  // 3. Determine Effective Theme (Auto-detect dark bg from MongoDB if not explicit)
  const effectiveTheme =
    themeOverride === "dark" || themeOverride === "light"
      ? themeOverride
      : (page.style?.theme as "light" | "dark") ||
        (page.theme as "light" | "dark") ||
        (customBg ? (isHexDark(customBg) ? "dark" : "light") : "light");

  const isCover =
    page.page_type === "cover" ||
    page.layout === "cover" ||
    page.page_number === 1;

  const isChapterOpener =
    page.page_type === "chapter_opener" ||
    page.layout === "chapter_opener" ||
    (!isCover && Boolean(page.chapter_number && page.content?.headline && !page.content?.body && (page.content?.blocks?.length ?? 0) <= 2));

  const isTitlePage =
    !isCover &&
    (page.page_type === "title" ||
      page.page_type === "imprint" ||
      page.layout === "title" ||
      page.layout === "imprint" ||
      page.page_number === 2);

  const isThankYou =
    !isCover &&
    (page.page_type === "thank_you" ||
      page.layout === "thank_you" ||
      (Boolean(book.page_count) && page.page_number === book.page_count && !isChapterOpener));

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

  const hasStructuredBlocks = Boolean(page.content?.blocks && page.content.blocks.length > 0);
  const hasPreRenderedHtml = Boolean(page.html && page.html.trim().length > 0);

  // If page.html contains a full outer .page container generated by VasukiSquare
  if (!isCover && hasPreRenderedHtml && page.html!.includes('class="page')) {
    return (
      <div className={`vasuki-book-root w-full h-full flex items-center justify-center select-text ${className}`}>
        <VasukiHtmlRenderer html={page.html!} />
      </div>
    );
  }

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
    ...(customTextColor
      ? {
          color: customTextColor,
          ["--theme-text" as string]: customTextColor,
          ["--text-primary" as string]: customTextColor,
          ["--text-primary-dark" as string]: customTextColor,
        }
      : {}),
    ...(customTextMuted
      ? {
          ["--theme-text-muted" as string]: customTextMuted,
          ["--theme-text-secondary" as string]: customTextMuted,
          ["--theme-text-subtle" as string]: customTextMuted,
        }
      : {}),
    ...(customBorderColor
      ? {
          borderColor: customBorderColor,
          ["--theme-border" as string]: customBorderColor,
          ["--theme-border-strong" as string]: customBorderStrong || customBorderColor,
        }
      : {}),
    ...(customCardBg
      ? {
          ["--theme-card-bg" as string]: customCardBg,
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
                  padding: "36px 30px 70px 30px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  width: "100%",
                  boxSizing: "border-box",
                  position: "relative",
                  overflow: "hidden",
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
                  style={{
                    position: "relative",
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    className="cover-category-badge"
                    style={{
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                      color: "#ffffff",
                      backgroundColor: "#001e2b",
                      padding: "4px 10px",
                      borderRadius: "3px",
                      border: "1px solid rgba(255, 255, 255, 0.12)",
                      boxShadow: "0 2px 6px rgba(0, 0, 0, 0.25)",
                      display: "inline-block",
                    }}
                  >
                    {page.content?.headline || "VASUKISQUARE EDITION"}
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                    <VasukiIcon name={pageIcon || "BookOpen"} size={18} />
                  </div>
                </div>

                {/* Title Box */}
                <div
                  style={{
                    position: "relative",
                    zIndex: 2,
                    margin: "auto 0",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    className="cover-title-container"
                    style={{
                      backgroundColor: "#001e2b",
                      padding: "24px 28px",
                      borderRadius: "6px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      boxShadow: "0 10px 24px -6px rgba(0, 0, 0, 0.5)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      textAlign: "left",
                      gap: "12px",
                      width: "fit-content",
                      maxWidth: "100%",
                      boxSizing: "border-box",
                    }}
                  >
                    <h1
                      className="cover-title"
                      style={{
                        fontFamily: "var(--font-serif), Georgia, serif",
                        fontSize: "28px",
                        fontWeight: 700,
                        lineHeight: 1.18,
                        color: "#ffffff",
                        letterSpacing: "-0.5px",
                        maxWidth: "460px",
                        wordBreak: "break-word",
                        margin: 0,
                      }}
                    >
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
                      <p
                        className="cover-subtitle"
                        style={{
                          fontFamily: "var(--font-display), sans-serif",
                          fontSize: "12.5px",
                          fontWeight: 400,
                          lineHeight: 1.45,
                          color: "#cbd5e1",
                          maxWidth: "440px",
                          margin: 0,
                          wordBreak: "break-word",
                        }}
                      >
                        {book.subtitle}
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer strip */}
                <footer
                  className="cover-footer-strip"
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    width: "100%",
                    backgroundColor: "#001e2b",
                    zIndex: 10,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 28px",
                    boxSizing: "border-box",
                    borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {book.author || "Vasuki"}
                  </span>
                  <span
                    style={{
                      fontSize: "10px",
                      fontWeight: 500,
                      color: "#cbd5e1",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                    }}
                  >
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
                  {page.chapter_title || page.content?.headline || "Chapter Introduction"}
                </h1>
                {page.content?.body && (
                  <p className="typo-lead" style={{ marginTop: "16px", maxWidth: "520px" }}>
                    {page.content.body}
                  </p>
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
                  <p className="title-page-subtitle">
                    {book.subtitle || (page.content && page.content.body) || "A Definitive Architecture & Implementation Guide"}
                  </p>
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
                    {page.content?.headline || "THANK YOU"}
                  </h1>
                  <p className="thank-you-statement">
                    {page.content?.body ||
                      "Thank you for reading. Researched from primary authoritative sources and rendered deterministically to physical A4 print specifications by VasukiSquare."}
                  </p>
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
                {page.content?.headline && (
                  <h2 className="content-headline">
                    {page.content.headline}
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
                    {page.content.body.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
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
