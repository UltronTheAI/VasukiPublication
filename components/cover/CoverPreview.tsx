"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import type { Book, Cover, CoverDesignPlan } from "@/lib/types/publication";

function extractSvgFromHtml(html?: string | null): string | null {
  if (!html || typeof html !== "string") return null;
  const svgMatch = html.match(/<svg[\s\S]*?<\/svg>/i);
  return svgMatch ? svgMatch[0] : null;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Fallback Generative Vector Scenery when no MongoDB SVG is present
 */
function FallbackVectorScenery({
  category = "",
  accentColor = "#00ed64",
}: {
  category?: string;
  accentColor?: string;
}) {
  const hash = hashString(category || "vasuki");
  const variant = hash % 3;

  if (variant === 0) {
    // Concentric Target / Orbital Circles
    return (
      <svg
        viewBox="0 0 794 1123"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full opacity-35"
      >
        <line x1="397" y1="100" x2="397" y2="1023" stroke="#111827" strokeWidth="0.8" strokeDasharray="6 6" opacity="0.4" />
        <line x1="100" y1="561" x2="694" y2="561" stroke="#111827" strokeWidth="0.8" strokeDasharray="6 6" opacity="0.4" />
        <circle cx="397" cy="561" r="280" fill="none" stroke="#111827" strokeWidth="1" opacity="0.3" />
        <circle cx="397" cy="561" r="180" fill="none" stroke="#111827" strokeWidth="1" opacity="0.5" />
        <circle cx="430" cy="520" r="70" fill="#1e293b" fillOpacity="0.85" />
        <circle cx="370" cy="600" r="60" fill="none" stroke="#111827" strokeWidth="1.5" opacity="0.6" />
        <circle cx="397" cy="561" r="120" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.6" />
      </svg>
    );
  }

  if (variant === 1) {
    // Architectural Blueprint & Geometric Grid
    return (
      <svg
        viewBox="0 0 794 1123"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
        className="w-full h-full opacity-30"
      >
        <circle cx="397" cy="561" r="220" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6 6" />
        <circle cx="397" cy="561" r="130" fill="none" stroke="#111827" strokeWidth="1.5" />
        <polygon points="397,400 520,470 397,540 274,470" fill="none" stroke="#111827" strokeWidth="1.5" opacity="0.5" />
        <polygon points="520,470 520,610 397,680 397,540" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.6" />
        <polygon points="274,470 397,540 397,680 274,610" fill="none" stroke="#111827" strokeWidth="1.5" opacity="0.4" />
      </svg>
    );
  }

  // Scenery Mountain Horizon
  return (
    <svg
      viewBox="0 0 794 1123"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      className="w-full h-full opacity-30"
    >
      <circle cx="397" cy="591" r="77.5" fill="#111827" fillOpacity="0.08" stroke="#111827" strokeWidth="2.5" strokeOpacity="0.35" />
      <path d="M 0 1123 L 0 651.1 Q 238.2 591.1 397.0 651.1 Q 595.5 699.1 794 627.1 L 794 1123 Z" fill="#111827" opacity="0.15" />
      <path d="M 0 1123 L 0 831.1 Q 238.2 741.1 397.0 831.1 Q 595.5 903.1 794 795.1 L 794 1123 Z" fill="#111827" opacity="0.35" />
      <path d="M 0 1123 L 0 1071.1 Q 238.2 951.1 397.0 1071.1 Q 595.5 1167.1 794 1023.1 L 794 1123 Z" fill="#111827" opacity="0.65" />
      <path
        d="M 277.9 1123 C 333.48 954.55, 571.68 842.25, 492.28 729.95 C 412.88 651.34, 349.36 631.11, 391.0 591.1 L 403.0 591.1 C 381.12 631.1, 460.52 651.34, 539.92 729.95 C 619.32 842.25, 412.88 954.55, 516.1 1123 Z"
        fill="#111827"
        opacity="0.92"
      />
    </svg>
  );
}

interface CoverPreviewProps {
  book: Book;
  cover?: Cover | null;
  size?: "sm" | "md" | "lg" | "hero" | "detail";
  className?: string;
  priority?: boolean;
}

/**
 * High-Fidelity Cover Preview Component.
 * Reproduces the exact VasukiSquare book cover geometry:
 * 1. Background Vector Scenery Art (from MongoDB cover.html or page.html)
 * 2. Top-Left Category Badge ("PRACTICAL GUIDE", "SYSTEM ARCHITECTURE")
 * 3. Centered Floating Dark Title Card (Title, Accent Bar, Subtitle)
 * 4. Full-Width Bottom Footer Strip (Author Name, "FIRST EDITION")
 */
export function CoverPreview({
  book,
  cover,
  size = "md",
  className = "",
}: CoverPreviewProps) {
  const design = (cover?.design || {}) as CoverDesignPlan;

  const title = cover?.title || book.title || "Untitled Publication";
  const subtitle = cover?.subtitle || design.subtitle || book.subtitle || "A Definitive Practical Guide";
  const author = cover?.author || design.author || book.author || "Vasuki";
  const edition = design.edition || "FIRST EDITION";
  const categoryBadge = (
    design.category_badge ||
    book.category ||
    book.discovery?.category ||
    "PRACTICAL GUIDE"
  ).toUpperCase();

  const accentColor = design.accent_color || "#00ed64";

  // Extract custom SVG artwork from MongoDB cover HTML if present
  const customSvg = useMemo(() => {
    return extractSvgFromHtml(cover?.html);
  }, [cover?.html]);

  // Size styling mapping
  const sizeClasses = {
    sm: "w-28 h-40 text-[9px]",
    md: "w-44 h-64 text-[11px]",
    lg: "w-56 h-80 text-xs",
    hero: "w-64 h-92 sm:w-72 sm:h-104 text-sm",
    detail: "w-full max-w-[320px] aspect-[1/1.44] text-xs sm:text-sm shadow-xl",
  }[size];

  const contentPadding = {
    sm: "p-2.5",
    md: "p-3.5",
    lg: "p-4",
    hero: "p-4 sm:p-5",
    detail: "p-5 sm:p-6",
  }[size];

  const footerPadding = {
    sm: "px-2.5 py-1.5 text-[8px]",
    md: "px-3.5 py-2 text-[9px]",
    lg: "px-4 py-2 text-[9px]",
    hero: "px-4 py-2.5 sm:px-5 sm:py-3 text-[9px] sm:text-[10px]",
    detail: "px-5 py-2.5 sm:px-6 sm:py-3 text-[9px] sm:text-[10px]",
  }[size];

  return (
    <div
      role="img"
      aria-label={`Cover artwork for ${title}`}
      className={`relative select-none overflow-hidden rounded-xl shadow-md transition-all duration-300 flex flex-col justify-between aspect-[1/1.44] bg-[#f9fbfa] text-[#001e2b] border border-[#e1e5e8] ${sizeClasses} ${className}`}
    >
      {/* 1. Background Vector Scenery Art Layer (Direct from MongoDB SVG or generative variant) */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0">
        {customSvg ? (
          <div
            className="w-full h-full opacity-40 [&>svg]:w-full [&>svg]:h-full [&>svg]:object-cover"
            dangerouslySetInnerHTML={{ __html: customSvg }}
          />
        ) : (
          <FallbackVectorScenery
            category={categoryBadge}
            accentColor={accentColor}
          />
        )}
      </div>

      {/* 2. Main Content Area (Top-Left Badge & Floating Title Card) */}
      <div className={`relative z-10 flex-1 flex flex-col justify-between ${contentPadding}`}>
        {/* Top-Left Category Badge */}
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-[#001e2b] text-white border border-white/12 shadow-xs truncate max-w-[85%]">
            {categoryBadge}
          </span>
          <div className="flex items-center gap-1">
            <Image
              src="/Vasuki.png"
              alt="Vasuki Logo"
              width={16}
              height={16}
              className="w-3.5 h-3.5 object-contain"
            />
          </div>
        </div>

        {/* Floating Dark Title Card */}
        <div className="my-auto">
          <div className="bg-[#001e2b] text-white p-3.5 sm:p-4 rounded-lg border border-white/15 shadow-xl max-w-full text-left backdrop-blur-xs">
            <h3
              className="font-serif font-bold text-sm sm:text-base leading-tight text-white tracking-tight line-clamp-3"
              style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
            >
              {title}
            </h3>
            <div
              className="w-7 h-0.5 my-1.5 rounded-full"
              style={{ backgroundColor: accentColor }}
            />
            {subtitle && (
              <p className="opacity-85 font-normal leading-snug line-clamp-2 text-[10px] sm:text-[11px] text-slate-300">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Full-Width Footer Strip */}
      <div className={`relative z-10 w-full bg-[#001e2b] text-white border-t border-white/15 flex items-center justify-between shrink-0 ${footerPadding}`}>
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <Image
            src="/Vasuki.png"
            alt="Vasuki"
            width={14}
            height={14}
            className="w-3 h-3 object-contain shrink-0"
          />
          <span className="truncate font-bold text-white text-[9px] sm:text-[10px]">{author}</span>
        </div>
        <span className="font-mono tracking-widest text-slate-300 uppercase shrink-0 text-[8px] sm:text-[9px] font-semibold">
          {edition}
        </span>
      </div>
    </div>
  );
}
