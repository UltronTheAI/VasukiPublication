import React from "react";
import type { Book, Cover, CoverDesignPlan } from "@/lib/types/publication";
import { resolveVasukiIconName } from "@/lib/vasuki/icon-map";
import {
  Sparkles,
  BookOpen,
  Terminal,
  Code,
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Zap,
  Compass,
  GitBranch,
  Workflow,
  Network,
  HardDrive,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Clock,
  Activity,
  FileText,
  Lightbulb,
  Award,
  Target,
  Feather,
  Bookmark,
  File,
  type LucideIcon,
} from "lucide-react";

const ICON_COMPONENTS: Record<string, LucideIcon> = {
  Sparkles,
  BookOpen,
  Book: BookOpen,
  Terminal,
  Code,
  Layers,
  Database,
  Cpu,
  ShieldCheck,
  Shield: ShieldCheck,
  Zap,
  Compass,
  GitBranch,
  Workflow,
  Network,
  HardDrive,
  CheckCircle,
  TrendingUp,
  BarChart3,
  Clock,
  Activity,
  FileText,
  Lightbulb,
  Award,
  Target,
  Feather,
  Bookmark,
  File,
};

function HeroIcon({ iconName, className }: { iconName?: string | null; className?: string }) {
  const resolved = resolveVasukiIconName(iconName, "Sparkles");
  const IconComponent = ICON_COMPONENTS[resolved] || Sparkles;
  return <IconComponent className={className} />;
}

interface CoverPreviewProps {
  book: Book;
  cover?: Cover | null;
  size?: "sm" | "md" | "lg" | "hero" | "detail";
  className?: string;
  priority?: boolean;
}

/**
 * High-fidelity CoverPreview reproducing VasukiSquare vector scenery artwork,
 * category badge, floating title card, and author footer strip.
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
    design.category_badge || book.category || book.discovery?.category || "PRACTICAL GUIDE";

  const accentColor = design.accent_color || "#00ed64";
  const heroIconName = design.hero_icon || "BookOpen";

  // Size styling mapping
  const sizeClasses = {
    sm: "w-28 h-40 text-[9px] p-2.5",
    md: "w-44 h-64 text-[11px] p-3.5",
    lg: "w-56 h-80 text-xs p-4.5",
    hero: "w-64 h-92 sm:w-72 sm:h-104 text-sm p-5",
    detail: "w-full max-w-[320px] aspect-[1/1.44] text-xs sm:text-sm p-6 shadow-xl",
  }[size];

  return (
    <div
      role="img"
      aria-label={`Cover artwork for ${title}`}
      className={`relative select-none overflow-hidden rounded-xl shadow-md transition-all duration-300 flex flex-col justify-between aspect-[1/1.44] bg-[#f9fbfa] text-[#001e2b] border border-[#e1e5e8] ${sizeClasses} ${className}`}
    >
      {/* Background Vector Scenery Art Layer (Sun, Rays, Mountain Road) */}
      <div
        className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-0"
        style={{ opacity: 0.22 }}
      >
        <svg
          viewBox="0 0 794 1123"
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          {/* Sun */}
          <circle
            cx="397.0"
            cy="591.1"
            r="77.5"
            fill="#111827"
            fillOpacity="0.08"
            stroke="#111827"
            strokeWidth="2.5"
            strokeOpacity="0.35"
          />
          {/* Sun rays */}
          <line x1="304.5" y1="591.1" x2="264.5" y2="591.1" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="313.2" y1="552.0" x2="276.9" y2="535.1" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="337.6" y1="520.3" x2="311.9" y2="489.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="373.1" y1="501.8" x2="362.7" y2="463.2" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="413.1" y1="500.0" x2="420.0" y2="460.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="450.0" y1="515.4" x2="473.0" y2="482.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="477.1" y1="544.9" x2="511.7" y2="524.9" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          <line x1="489.1" y1="583.0" x2="529.0" y2="579.6" stroke="#111827" strokeWidth="1.5" strokeOpacity="0.25" />
          {/* Mountain & Hill Horizons */}
          <path d="M 0 1123 L 0 651.1 Q 238.2 591.1 397.0 651.1 Q 595.5 699.1 794 627.1 L 794 1123 Z" fill="#111827" opacity="0.15" />
          <path d="M 0 1123 L 0 831.1 Q 238.2 741.1 397.0 831.1 Q 595.5 903.1 794 795.1 L 794 1123 Z" fill="#111827" opacity="0.35" />
          <path d="M 0 1123 L 0 1071.1 Q 238.2 951.1 397.0 1071.1 Q 595.5 1167.1 794 1023.1 L 794 1123 Z" fill="#111827" opacity="0.65" />
          {/* Winding road path */}
          <path
            d="M 277.9 1123 C 333.48 954.55, 571.68 842.25, 492.28 729.95 C 412.88 651.34, 349.36 631.11, 391.0 591.1 L 403.0 591.1 C 381.12 631.1, 460.52 651.34, 539.92 729.95 C 619.32 842.25, 412.88 954.55, 516.1 1123 Z"
            fill="#111827"
            opacity="0.92"
          />
        </svg>
      </div>

      {/* Top Header Chrome */}
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-bold bg-[#001e2b] text-white border border-white/10 shadow-xs">
          {categoryBadge}
        </span>
        <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-700 flex items-center justify-center">
          <HeroIcon iconName={heroIconName} className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Floating Dark Title Card */}
      <div className="relative z-10 my-auto">
        <div className="bg-[#001e2b] text-white p-3.5 sm:p-4 rounded-lg border border-white/12 shadow-lg max-w-full text-left">
          <h3
            className="font-serif font-bold text-sm sm:text-base md:text-lg leading-tight text-white tracking-tight line-clamp-3"
            style={{ fontFamily: "var(--font-serif), Georgia, serif" }}
          >
            {title}
          </h3>
          <div
            className="w-7 h-0.5 my-1.5 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          {subtitle && (
            <p className="opacity-80 font-normal leading-snug line-clamp-2 text-[10px] sm:text-[11px] text-slate-300">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Bottom Footer Strip */}
      <div className="relative z-10 -mx-3.5 -mb-3.5 sm:-mx-6 sm:-mb-6 px-3.5 py-2 sm:px-6 sm:py-2.5 bg-[#001e2b] text-white border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[10px]">
        <span className="truncate max-w-[70%] font-bold text-white">{author}</span>
        <span className="font-mono text-[8px] sm:text-[9px] tracking-wider text-slate-300 uppercase shrink-0">
          {edition}
        </span>
      </div>
    </div>
  );
}
