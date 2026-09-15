/**
 * VasukiSquare Book Render Tokens & Theme Definitions
 * 
 * IMPORTANT:
 * These tokens define the visual contract for VasukiSquare generated books.
 * They are intentionally ISOLATED from the VasukiPublication website UI design system (DESIGN.md).
 * The book reading experience renders inside an isolated viewport that preserves these tokens.
 */

export const VASUKI_COLOR_TOKENS = {
  // Brand & Primary Accent
  PRIMARY: "#00ed64",
  PRIMARY_DEEP: "#00b545",
  PRIMARY_PRESSED: "#008c34",
  ON_PRIMARY: "#001e2b",

  BRAND_GREEN: "#00ed64",
  BRAND_GREEN_DARK: "#00684a",
  BRAND_GREEN_MID: "#00a35c",
  BRAND_GREEN_SOFT: "#c3f0d2",

  BRAND_TEAL_DEEP: "#001e2b",
  BRAND_TEAL: "#003d4f",
  BRAND_TEAL_MID: "#00684a",

  // Category Accents
  ACCENT_PURPLE: "#7b3ff2",
  ACCENT_ORANGE: "#fa6e39",
  ACCENT_PINK: "#f06bb8",
  ACCENT_BLUE: "#3d4f9f",

  // Semantic
  SEMANTIC_WARNING_BG: "#fff8e0",
  SEMANTIC_WARNING_TEXT: "#946f3f",

  // Canvas & Surfaces
  CANVAS: "#ffffff",
  CANVAS_DARK: "#001e2b",
  SURFACE: "#f9fbfa",
  SURFACE_SOFT: "#f4f7f6",
  SURFACE_FEATURE: "#e3fcef",

  // Borders & Dividers
  HAIRLINE: "#e1e5e8",
  HAIRLINE_SOFT: "#eceff1",
  HAIRLINE_STRONG: "#c1ccd6",
  HAIRLINE_DARK: "#1c2d38",

  // Text / Typography
  INK: "#001e2b",
  CHARCOAL: "#1c2d38",
  SLATE: "#3d4f5b",
  STEEL: "#5c6c7a",
  STONE: "#7c8c9a",
  MUTED: "#a8b3bc",

  ON_DARK: "#ffffff",
  ON_DARK_MUTED: "#a8b3bc",

  // Semantic Light
  TEXT_PRIMARY_LIGHT: "#001e2b",
  TEXT_SECONDARY_LIGHT: "#3d4f5b",
  TEXT_MUTED_LIGHT: "#5c6c7a",
  TEXT_SUBTLE_LIGHT: "#7c8c9a",

  // Semantic Dark
  TEXT_PRIMARY_DARK: "#ffffff",
  TEXT_SECONDARY_DARK: "#e1e5e8",
  TEXT_MUTED_DARK: "#c1ccd6",
  TEXT_SUBTLE_DARK: "#a8b3bc",
} as const;

export type VasukiColorTokenName = keyof typeof VASUKI_COLOR_TOKENS;

/**
 * Dimensions and proportions for A4 page rendering.
 */
export const VASUKI_LAYOUT_METRICS = {
  A4_ASPECT_RATIO: 210 / 297, // ~0.707 (Width / Height)
  A4_WIDTH_MM: 210,
  A4_HEIGHT_MM: 297,
  BASE_PADDING_PERCENT: 6.5, // Standard inner page margin in percent
  HEADER_HEIGHT_PX: 40,
  FOOTER_HEIGHT_PX: 36,
  BORDER_RADIUS_CARD: "8px",
  BORDER_RADIUS_CALLOUT: "6px",
  BORDER_RADIUS_CODE: "6px",
} as const;

/**
 * Font families specified for VasukiSquare publications.
 */
export const VASUKI_FONTS = {
  BODY: "'Euclid Circular A', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  HEADING: "'Euclid Circular A', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  CODE: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
} as const;

/**
 * Resolves whether a chapter number defaults to light or dark theme.
 * VasukiSquare convention: Chapter 1 is light, Chapter 2 is dark, alternating or explicit.
 */
export function getVasukiChapterTheme(chapterNumber: number): "light" | "dark" {
  // Odd chapters are light, even chapters are dark
  return chapterNumber % 2 === 0 ? "dark" : "light";
}

