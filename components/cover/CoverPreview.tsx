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

export function CoverPreview({
  book,
  cover,
  size = "md",
  className = "",
}: CoverPreviewProps) {
  // Extract design parameters from Cover or fallback deterministically to book metadata
  const design = (cover?.design || {}) as CoverDesignPlan;
  
  const title = cover?.title || book.title || "Untitled Publication";
  const subtitle = cover?.subtitle || design.subtitle || book.subtitle || "";
  const author = cover?.author || design.author || book.author || "VasukiSquare Editorial";
  const edition = design.edition || "First Edition";
  const categoryBadge = design.category_badge || book.category || book.discovery?.category || "PRACTICAL GUIDE";
  
  const accentColor = design.accent_color || "#00ed64";
  const rawBgColor = design.background_color || "#001e2b";
  const contrastMode = design.contrast_mode || "high_contrast_dark";
  const isDark = contrastMode.includes("dark") || rawBgColor.toLowerCase().includes("001") || rawBgColor.toLowerCase().includes("1c2");
  
  const compositionStyle = design.composition_style || "asymmetric_left";
  const backgroundStyle = design.background_style || "solid_light";
  const decorativeGeometry = design.decorative_geometry || "database_nodes";
  const heroIconName = design.hero_icon || "sparkles";
  const typographyStyle = design.typography_style || "modern_technical";
  const accentElements = design.accent_elements || ["horizontal_rule"];

  // Size styling mapping
  const sizeClasses = {
    sm: "w-28 h-40 text-[9px] p-3",
    md: "w-44 h-64 text-[11px] p-4",
    lg: "w-56 h-80 text-xs p-5",
    hero: "w-64 h-92 sm:w-72 sm:h-104 text-sm p-6",
    detail: "w-full max-w-[320px] aspect-[1/1.44] text-xs sm:text-sm p-6 shadow-xl",
  }[size];

  // Base background and text class
  let bgStyleClasses = "bg-[#001e2b] text-white";
  if (!isDark) {
    bgStyleClasses = "bg-[#ffffff] text-[#001e2b] border border-[#e1e5e8]";
  }

  // Typography class based on typography_style
  let titleFontClass = "font-bold tracking-tight";
  if (typographyStyle === "editorial_display") {
    titleFontClass = "font-serif font-bold tracking-normal";
  } else if (typographyStyle === "compact_heavy") {
    titleFontClass = "font-black uppercase tracking-tighter leading-tight";
  } else if (typographyStyle === "ultra_light_spaced") {
    titleFontClass = "font-light tracking-widest uppercase";
  }

  return (
    <div
      role="img"
      aria-label={`Cover artwork for ${title}`}
      className={`relative select-none overflow-hidden rounded-lg shadow-sm transition-all duration-200 flex flex-col justify-between aspect-[1/1.44] ${sizeClasses} ${bgStyleClasses} ${className}`}
      style={{
        backgroundColor: rawBgColor,
      }}
    >
      {/* Background Decorative Patterns */}
      {backgroundStyle === "subtle_grid" && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${accentColor} 1px, transparent 1px)`,
            backgroundSize: "16px 16px",
          }}
        />
      )}
      {backgroundStyle === "layered_mesh" && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 10% 20%, ${accentColor} 0%, transparent 60%), radial-gradient(circle at 90% 80%, #7b3ff2 0%, transparent 60%)`,
          }}
        />
      )}
      {backgroundStyle === "radial_glow" && (
        <div
          className="absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-25 blur-xl pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
      )}
      {backgroundStyle === "split_tone" && (
        <div
          className="absolute top-0 right-0 w-1/3 h-full opacity-10 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Decorative Geometric Motifs */}
      {decorativeGeometry === "circuit_grid" && (
        <div className="absolute top-3 right-3 opacity-20 pointer-events-none">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <path d="M0 12h24v24h24" stroke={accentColor} strokeWidth="1.5" />
            <circle cx="24" cy="12" r="3" fill={accentColor} />
            <circle cx="48" cy="36" r="3" fill={accentColor} />
          </svg>
        </div>
      )}
      {decorativeGeometry === "database_nodes" && (
        <div className="absolute bottom-14 right-3 opacity-15 pointer-events-none">
          <svg width="44" height="44" viewBox="0 0 40 40" fill="none">
            <circle cx="10" cy="10" r="4" stroke={accentColor} strokeWidth="1.2" />
            <circle cx="30" cy="10" r="4" stroke={accentColor} strokeWidth="1.2" />
            <circle cx="20" cy="30" r="4" stroke={accentColor} strokeWidth="1.2" />
            <line x1="10" y1="10" x2="30" y2="10" stroke={accentColor} strokeWidth="0.8" />
            <line x1="10" y1="10" x2="20" y2="30" stroke={accentColor} strokeWidth="0.8" />
            <line x1="30" y1="10" x2="20" y2="30" stroke={accentColor} strokeWidth="0.8" />
          </svg>
        </div>
      )}
      {decorativeGeometry === "structural_rings" && (
        <div className="absolute -bottom-8 -right-8 opacity-15 pointer-events-none">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
            <circle cx="40" cy="40" r="36" stroke={accentColor} strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="40" cy="40" r="24" stroke={accentColor} strokeWidth="1.5" />
            <circle cx="40" cy="40" r="12" stroke={accentColor} strokeWidth="1" />
          </svg>
        </div>
      )}

      {/* Top Header Chrome */}
      <div className="relative z-10 flex items-center justify-between gap-1">
        <span
          className="font-mono text-[9px] uppercase tracking-wider px-2 py-0.5 rounded font-semibold border"
          style={{
            color: accentColor,
            borderColor: `${accentColor}40`,
            backgroundColor: `${accentColor}15`,
          }}
        >
          {categoryBadge}
        </span>
        <div className="opacity-85" style={{ color: accentColor }}>
          <HeroIcon iconName={heroIconName} className="w-4 h-4" />
        </div>
      </div>

      {/* Title & Composition block */}
      <div
        className={`relative z-10 my-auto ${
          compositionStyle === "centered_editorial"
            ? "text-center"
            : compositionStyle === "bottom_weighted"
            ? "text-left mt-auto mb-4"
            : "text-left"
        }`}
      >
        {/* Accent Bar or Element */}
        {accentElements.includes("horizontal_rule") && (
          <div
            className="w-7 h-0.5 mb-2.5 rounded-full"
            style={{
              backgroundColor: accentColor,
              margin: compositionStyle === "centered_editorial" ? "0 auto 10px auto" : "0 0 10px 0",
            }}
          />
        )}

        <h3 className={`${titleFontClass} leading-snug line-clamp-3 text-inherit`}>
          {title}
        </h3>

        {subtitle && (
          <p className="mt-1.5 opacity-80 font-normal leading-tight line-clamp-2 text-[10px] sm:text-[11px]">
            {subtitle}
          </p>
        )}
      </div>

      {/* Bottom Footer Chrome */}
      <div
        className="relative z-10 pt-2.5 border-t flex items-center justify-between text-[9px] sm:text-[10px] opacity-75"
        style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }}
      >
        <span className="truncate max-w-[70%] font-medium">{author}</span>
        <span className="font-mono text-[8px] sm:text-[9px] tracking-tight shrink-0">{edition}</span>
      </div>
    </div>
  );
}
