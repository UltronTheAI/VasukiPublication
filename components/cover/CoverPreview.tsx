"use client";

import React from "react";
import Image from "next/image";
import type { Book, Cover, CoverDesignPlan } from "@/lib/types/publication";
import { extractCleanPageHtml } from "@/lib/security/html";
import { VasukiIcon } from "@/components/vasuki/VasukiIcon";

interface CoverTheme {
  id: string;
  bg: string;
  cardBg: string;
  text: string;
  subtext: string;
  accent: string;
  border: string;
  cardBorder: string;
  isLight?: boolean;
}

const THEMES: CoverTheme[] = [
  {
    id: "emerald_deep",
    bg: "#021c1e",
    cardBg: "#001e2b",
    text: "#ffffff",
    subtext: "#94a3b8",
    accent: "#00ed64",
    border: "#0e383b",
    cardBorder: "rgba(0, 237, 100, 0.2)",
  },
  {
    id: "sapphire_tech",
    bg: "#09122c",
    cardBg: "#0d1b3e",
    text: "#ffffff",
    subtext: "#93c5fd",
    accent: "#38bdf8",
    border: "#1e295d",
    cardBorder: "rgba(56, 189, 248, 0.25)",
  },
  {
    id: "obsidian_gold",
    bg: "#121214",
    cardBg: "#1a1a1f",
    text: "#ffffff",
    subtext: "#d1d5db",
    accent: "#f59e0b",
    border: "#2b2b36",
    cardBorder: "rgba(245, 158, 11, 0.25)",
  },
  {
    id: "amethyst_cyber",
    bg: "#160d29",
    cardBg: "#221340",
    text: "#ffffff",
    subtext: "#d8b4fe",
    accent: "#c084fc",
    border: "#3b1e6d",
    cardBorder: "rgba(192, 132, 252, 0.25)",
  },
  {
    id: "crimson_security",
    bg: "#1c0f13",
    cardBg: "#29151c",
    text: "#ffffff",
    subtext: "#fda4af",
    accent: "#fb7185",
    border: "#4c1d2c",
    cardBorder: "rgba(251, 113, 133, 0.25)",
  },
  {
    id: "teal_nordic",
    bg: "#061f24",
    cardBg: "#0c2e35",
    text: "#ffffff",
    subtext: "#99f6e4",
    accent: "#2dd4bf",
    border: "#154d58",
    cardBorder: "rgba(45, 212, 191, 0.25)",
  },
  {
    id: "warm_editorial",
    bg: "#fcfaf7",
    cardBg: "#ffffff",
    text: "#1c1917",
    subtext: "#57534e",
    accent: "#ea580c",
    border: "#e7e5e4",
    cardBorder: "#e7e5e4",
    isLight: true,
  },
  {
    id: "indigo_minimal",
    bg: "#0f172a",
    cardBg: "#1e293b",
    text: "#ffffff",
    subtext: "#cbd5e1",
    accent: "#818cf8",
    border: "#334155",
    cardBorder: "rgba(129, 140, 248, 0.25)",
  },
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function resolveTheme(
  design: CoverDesignPlan,
  book: Book
): { theme: CoverTheme; styleType: string } {
  const seedStr =
    design.palette_theme ||
    design.background_color ||
    book.category ||
    book.topic ||
    book.slug ||
    book.title ||
    "vasuki";

  const hash = hashString(seedStr);
  const theme = THEMES[hash % THEMES.length];

  // Derive style category
  const styles = [
    "blueprint",
    "circuit",
    "network",
    "terminal",
    "geometric",
    "waves",
    "isometric",
  ];
  const styleType = design.cover_style || styles[hash % styles.length];

  // If design explicitly specified accent or background, override theme
  const finalTheme = { ...theme };
  if (design.accent_color && design.accent_color.startsWith("#")) {
    finalTheme.accent = design.accent_color;
  }
  if (design.background_color && design.background_color.startsWith("#")) {
    finalTheme.bg = design.background_color;
  }

  return { theme: finalTheme, styleType };
}

function resolveHeroIconName(design: CoverDesignPlan, book: Book): string {
  if (design.hero_icon) return design.hero_icon;
  if (book.chapters?.[0]?.icon) return book.chapters[0].icon;

  const cat = (book.category || "").toLowerCase();
  if (cat.includes("data") || cat.includes("sql") || cat.includes("mongo")) return "Database";
  if (cat.includes("rust") || cat.includes("system") || cat.includes("hardware")) return "Cpu";
  if (cat.includes("security") || cat.includes("auth") || cat.includes("crypto")) return "ShieldCheck";
  if (cat.includes("terminal") || cat.includes("cli") || cat.includes("devops")) return "Terminal";
  if (cat.includes("network") || cat.includes("distributed") || cat.includes("cloud")) return "Network";
  if (cat.includes("git") || cat.includes("version") || cat.includes("workflow")) return "GitBranch";
  if (cat.includes("code") || cat.includes("programming") || cat.includes("pattern")) return "Code2";

  return "Sparkles";
}

/**
 * Dynamic Generative Vector Scenery & Technical Schematics
 */
function VectorScenery({
  styleType,
  accentColor,
  isLight,
}: {
  styleType: string;
  accentColor: string;
  isLight?: boolean;
}) {
  const strokeBase = isLight ? "#0f172a" : "#ffffff";

  switch (styleType) {
    case "blueprint":
      return (
        <svg
          viewBox="0 0 794 1123"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        >
          {/* Blueprint Grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke={strokeBase} strokeWidth="0.75" opacity="0.3" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          {/* Schematic Circles and Dimension Lines */}
          <circle cx="397" cy="561" r="220" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="397" cy="561" r="140" fill="none" stroke={strokeBase} strokeWidth="1" />
          <line x1="100" y1="561" x2="694" y2="561" stroke={accentColor} strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />
          <line x1="397" y1="200" x2="397" y2="923" stroke={accentColor} strokeWidth="1" strokeDasharray="4 8" opacity="0.6" />
          {/* Isometric cubes in background */}
          <polygon points="397,420 500,480 397,540 294,480" fill="none" stroke={strokeBase} strokeWidth="1.5" opacity="0.5" />
          <polygon points="500,480 500,600 397,660 397,540" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.5" />
          <polygon points="294,480 397,540 397,660 294,600" fill="none" stroke={strokeBase} strokeWidth="1.5" opacity="0.3" />
        </svg>
      );

    case "circuit":
      return (
        <svg
          viewBox="0 0 794 1123"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        >
          {/* CPU Wafer and PCB Traces */}
          <rect x="257" y="421" width="280" height="280" rx="16" fill="none" stroke={accentColor} strokeWidth="2" opacity="0.8" />
          <rect x="287" y="451" width="220" height="220" rx="8" fill="none" stroke={strokeBase} strokeWidth="1" opacity="0.4" />
          {/* Bus Traces */}
          <path d="M 0 300 L 200 300 L 257 440" fill="none" stroke={strokeBase} strokeWidth="1.5" opacity="0.6" />
          <path d="M 0 340 L 180 340 L 257 480" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.8" />
          <path d="M 794 800 L 600 800 L 537 660" fill="none" stroke={strokeBase} strokeWidth="1.5" opacity="0.6" />
          <path d="M 794 760 L 620 760 L 537 620" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.8" />
          <circle cx="200" cy="300" r="4" fill={accentColor} />
          <circle cx="180" cy="340" r="4" fill={strokeBase} />
          <circle cx="600" cy="800" r="4" fill={accentColor} />
          <circle cx="620" cy="760" r="4" fill={strokeBase} />
        </svg>
      );

    case "network":
      return (
        <svg
          viewBox="0 0 794 1123"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        >
          {/* Distributed Topology Mesh */}
          <polygon points="397,350 620,480 540,750 250,750 174,480" fill="none" stroke={strokeBase} strokeWidth="1.5" opacity="0.4" />
          <line x1="397" y1="350" x2="540" y2="750" stroke={accentColor} strokeWidth="1" strokeDasharray="4 4" />
          <line x1="397" y1="350" x2="250" y2="750" stroke={accentColor} strokeWidth="1" strokeDasharray="4 4" />
          <line x1="174" y1="480" x2="620" y2="480" stroke={strokeBase} strokeWidth="1" />
          {/* Nodes */}
          <circle cx="397" cy="350" r="10" fill={accentColor} opacity="0.9" />
          <circle cx="620" cy="480" r="8" fill={strokeBase} opacity="0.8" />
          <circle cx="540" cy="750" r="8" fill={accentColor} opacity="0.9" />
          <circle cx="250" cy="750" r="8" fill={strokeBase} opacity="0.8" />
          <circle cx="174" cy="480" r="8" fill={accentColor} opacity="0.9" />
          <circle cx="397" cy="560" r="32" fill="none" stroke={accentColor} strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>
      );

    case "terminal":
      return (
        <svg
          viewBox="0 0 794 1123"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-20"
        >
          {/* Terminal Window Chrome */}
          <rect x="120" y="240" width="554" height="643" rx="12" fill="none" stroke={strokeBase} strokeWidth="1.5" />
          <line x1="120" y1="290" x2="674" y2="290" stroke={strokeBase} strokeWidth="1.5" />
          <circle cx="150" cy="265" r="5" fill="#ef4444" />
          <circle cx="170" cy="265" r="5" fill="#f59e0b" />
          <circle cx="190" cy="265" r="5" fill="#10b981" />
          {/* Code line silhouettes */}
          <line x1="150" y1="330" x2="280" y2="330" stroke={accentColor} strokeWidth="4" strokeLinecap="round" />
          <line x1="150" y1="360" x2="420" y2="360" stroke={strokeBase} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <line x1="180" y1="390" x2="360" y2="390" stroke={strokeBase} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
          <line x1="180" y1="420" x2="480" y2="420" stroke={accentColor} strokeWidth="3" strokeLinecap="round" opacity="0.8" />
          <line x1="150" y1="450" x2="220" y2="450" stroke={strokeBase} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </svg>
      );

    case "waves":
    default:
      return (
        <svg
          viewBox="0 0 794 1123"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-25"
        >
          {/* Sun & Waves */}
          <circle cx="397" cy="520" r="100" fill="none" stroke={accentColor} strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="397" cy="520" r="60" fill={accentColor} fillOpacity="0.1" stroke={accentColor} strokeWidth="1.5" />
          <path d="M 0 750 Q 200 680 397 750 T 794 750 L 794 1123 L 0 1123 Z" fill={strokeBase} opacity="0.12" />
          <path d="M 0 840 Q 200 780 397 840 T 794 840 L 794 1123 L 0 1123 Z" fill={accentColor} opacity="0.2" />
          <path d="M 0 940 Q 200 890 397 940 T 794 940 L 794 1123 L 0 1123 Z" fill={strokeBase} opacity="0.4" />
        </svg>
      );
  }
}

interface CoverPreviewProps {
  book: Book;
  cover?: Cover | null;
  size?: "sm" | "md" | "lg" | "hero" | "detail";
  className?: string;
  priority?: boolean;
}

/**
 * Exact Cover Preview Component.
 * Faithfully renders MongoDB cover document HTML or dynamic VasukiSquare vector artwork
 * unique to each technical book.
 */
export function CoverPreview({
  book,
  cover,
  size = "md",
  className = "",
}: CoverPreviewProps) {
  const design = (cover?.design || {}) as CoverDesignPlan;

  const title = cover?.title || book.title || "Untitled Publication";
  const subtitle = cover?.subtitle || design.subtitle || book.subtitle || "";
  const author = cover?.author || design.author || book.author || "Vasuki";
  const edition = design.edition || "FIRST EDITION";
  const categoryBadge =
    design.category_badge || book.category || book.discovery?.category || "TECHNICAL MANUAL";

  // Check if cover has pre-rendered exact HTML from MongoDB
  const rawCoverHtml = cover?.html;
  const coverHtml =
    rawCoverHtml && typeof rawCoverHtml === "string" && rawCoverHtml.trim().length > 0
      ? extractCleanPageHtml(rawCoverHtml)
      : null;

  // Resolve unique theme, vector scenery, and hero icon
  const { theme, styleType } = resolveTheme(design, book);
  const heroIconName = resolveHeroIconName(design, book);

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

  // If MongoDB contains full pre-rendered HTML for this cover
  if (coverHtml) {
    return (
      <div
        role="img"
        aria-label={`Cover artwork for ${title}`}
        className={`relative select-none overflow-hidden rounded-xl shadow-md transition-all duration-300 aspect-[1/1.44] vasuki-book-root ${sizeClasses} ${className}`}
      >
        <div
          className="w-full h-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: coverHtml }}
          suppressHydrationWarning
        />
      </div>
    );
  }

  // Exact VasukiSquare Vector Cover Design
  return (
    <div
      role="img"
      aria-label={`Cover artwork for ${title}`}
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        borderColor: theme.border,
      }}
      className={`relative select-none overflow-hidden rounded-xl shadow-md transition-all duration-300 flex flex-col justify-between aspect-[1/1.44] border ${sizeClasses} ${className}`}
    >
      {/* Background Vector Art Layer (Unique per book & style) */}
      <VectorScenery
        styleType={styleType}
        accentColor={theme.accent}
        isLight={theme.isLight}
      />

      {/* Main Content Area (Header Badge, Hero Icon & Floating Card) */}
      <div className={`relative z-10 flex-1 flex flex-col justify-between ${contentPadding}`}>
        {/* Top Header Chrome */}
        <div className="flex items-center justify-between gap-1">
          <span
            style={{
              backgroundColor: theme.cardBg,
              color: theme.text,
              borderColor: theme.cardBorder,
            }}
            className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold border shadow-xs truncate max-w-[70%]"
          >
            {categoryBadge}
          </span>
          <div
            style={{
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              color: theme.accent,
            }}
            className="w-6 h-6 rounded-full border flex items-center justify-center shadow-xs shrink-0"
          >
            <VasukiIcon name={heroIconName} size={14} className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Floating Dark Title Card */}
        <div className="my-auto">
          <div
            style={{
              backgroundColor: theme.cardBg,
              color: theme.text,
              borderColor: theme.cardBorder,
            }}
            className="p-3.5 sm:p-4 rounded-lg border shadow-lg max-w-full text-left backdrop-blur-xs"
          >
            <h3
              className="font-serif font-bold text-sm sm:text-base md:text-lg leading-tight tracking-tight line-clamp-3"
              style={{ fontFamily: "var(--font-serif), Georgia, serif", color: theme.text }}
            >
              {title}
            </h3>
            <div
              className="w-7 h-0.5 my-1.5 rounded-full"
              style={{ backgroundColor: theme.accent }}
            />
            {subtitle && (
              <p
                style={{ color: theme.subtext }}
                className="font-normal leading-snug line-clamp-2 text-[10px] sm:text-[11px]"
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Strip (Full width flush with card border and corners) */}
      <div
        style={{
          backgroundColor: theme.cardBg,
          color: theme.text,
          borderColor: theme.border,
        }}
        className={`relative z-10 w-full border-t flex items-center justify-between shrink-0 ${footerPadding}`}
      >
        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
          <Image
            src="/Vasuki.png"
            alt="Vasuki"
            width={14}
            height={14}
            className="w-3 h-3 object-contain shrink-0"
          />
          <span className="truncate font-bold" style={{ color: theme.text }}>
            {author}
          </span>
        </div>
        <span
          className="font-mono tracking-wider uppercase shrink-0 text-[8px] sm:text-[9px]"
          style={{ color: theme.subtext }}
        >
          {edition}
        </span>
      </div>
    </div>
  );
}
