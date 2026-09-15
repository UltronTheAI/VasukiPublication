/**
 * VasukiPublication Data Models & TypeScript Types
 * Strictly aligned with VasukiSquare's MongoDB publication schemas.
 */

export const CURRENT_SCHEMA_VERSION = 1;
export const CURRENT_RENDERER_VERSION = "0.1.0";

export type Theme = "light" | "dark";

export type PublicationStatus = "draft" | "published" | "unpublished";
export type PublicationVisibility = "public" | "private";

export interface PublicationInfo {
  status: PublicationStatus;
  visibility: PublicationVisibility;
  published_at?: string | Date | null;
  updated_at?: string | Date | null;
}

export type PublicationState = PublicationInfo;

export interface FeaturedInfo {
  pinned: boolean;
  position?: number | null;
}

export type FeaturedState = FeaturedInfo;

export interface DiscoveryInfo {
  search_title: string;
  keywords: string[];
  category?: string | null;
}

export type BookDiscovery = DiscoveryInfo;

export interface SeoInfo {
  title: string;
  description: string;
  canonical_slug: string;
}

export type BookSEO = SeoInfo;

export interface BookStats {
  views: number;
  opens: number;
}

export interface ChapterMetadata {
  chapter_number: number;
  title: string;
  summary?: string | null;
  icon?: string | null;
  page_count: number;
  theme: Theme;
}

export type BookChapter = ChapterMetadata;

export interface Book {
  _id?: string;
  id: string;
  schema_version: number;
  renderer_version: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  running_title?: string | null;
  author?: string | null;
  topic?: string;
  prompt?: string;
  description: string;
  book_type?: string | null;
  publication_profile?: string | null;
  category?: string | null;
  target_audience?: string | null;
  tone?: string | null;
  technical_depth?: string | null;
  status: PublicationStatus | string;
  chapter_count: number;
  page_count: number;
  starting_page_id?: string | null;
  cover_id?: string | null;
  chapters: ChapterMetadata[];
  publication: PublicationInfo;
  featured: FeaturedInfo;
  discovery: DiscoveryInfo;
  seo: SeoInfo;
  stats: BookStats;
  created_at: string | Date;
  updated_at: string | Date;
  [key: string]: unknown;
}

export interface SourceCitation {
  url: string;
  title?: string | null;
  claim?: string | null;
  quote?: string | null;
  page_number?: number | null;
}

export interface RichSpan {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  link?: string | null;
  color?: string | null;
}

export interface TerminalLine {
  kind?: "command" | "stdout" | "output" | "success" | "warning" | "error" | "comment";
  text: string;
  prompt?: string | null;
}

export interface CodeBlock {
  type: "code";
  language: string;
  filename?: string | null;
  code: string;
  caption?: string | null;
  line_numbers?: boolean;
}

export interface TerminalBlock {
  type: "terminal";
  title: string;
  shell: string;
  lines: (string | TerminalLine)[];
}

export interface TableBlock {
  type: "table";
  caption?: string | null;
  columns?: string[];
  headers?: string[];
  header_icons?: (string | null)[];
  rows: string[][];
  alignment?: ("left" | "center" | "right")[];
  icons?: (string | null)[][];
  highlight_first_column?: boolean;
  source_note?: string | null;
}

export interface SourceBlock {
  type: "source";
  title: string;
  publisher?: string | null;
  url: string;
  accessed_at?: string | null;
  mode?: "card" | "inline";
  source_number?: number | null;
}

export interface CalloutBlock {
  type: "callout";
  variant: "note" | "tip" | "important" | "warning" | "insight";
  title?: string | null;
  icon?: string | null;
  content: string;
}

export interface IconTextItem {
  icon: string;
  title?: string | null;
  text: string;
}

export interface IconTextBlock {
  type: "icon_text";
  title?: string | null;
  items: IconTextItem[];
}

export interface ChartBlock {
  type: "chart";
  chart_type: "bar" | "line" | "comparison";
  title: string;
  subtitle?: string | null;
  categories?: string[];
  labels?: string[];
  series_names?: string[];
  values?: number[][];
  x_label?: string | null;
  y_label?: string | null;
  source_note?: string | null;
  source_ids?: string[];
  unit?: string;
}

export interface DiagramBlock {
  type: "diagram";
  title?: string | null;
  caption?: string | null;
  mermaid_code?: string | null;
  code?: string | null;
  aspect_ratio?: string;
}

export interface QuoteBlock {
  type: "quote";
  quote: string;
  attribution?: string | null;
  author?: string | null;
  role?: string | null;
  affiliation?: string | null;
}

export interface StatisticBlock {
  type: "statistic";
  stat?: string | null;
  value?: string | null;
  label: string;
  context?: string | null;
  description?: string | null;
  icon?: string | null;
}

export interface ImageBlock {
  type: "image";
  src: string;
  caption?: string | null;
  alt?: string | null;
  aspect_ratio?: string;
}

export interface TextBlock {
  type: "text";
  text: string;
  typography_role?: string | null;
  spans?: RichSpan[];
  paragraphs?: string[];
}

export interface HeadingBlock {
  type: "heading";
  level: number;
  text: string;
  icon?: string | null;
  eyebrow?: string | null;
  typography_role?: string | null;
}

export interface AcknowledgementBlock {
  type: "acknowledgement";
  title: string;
  lead?: string | null;
  body?: string;
  paragraphs?: string[];
  contributors?: string[];
  signature?: string | null;
  affiliation?: string | null;
  icon?: string | null;
}

export interface CopyrightBlock {
  type: "copyright";
  title: string;
  book_title: string;
  book_subtitle?: string | null;
  author?: string | null;
  rights_holder?: string | null;
  year?: string | number | null;
  edition?: string | null;
  isbn?: string | null;
  publisher?: string | null;
  engine?: string | null;
  website?: string | null;
  rights_notice?: string | null;
  distribution_restrictions?: string | null;
  license_notes?: string | null;
  disclaimer?: string | null;
  ordering_info?: string | null;
}

export interface TocEntry {
  chapter_number?: number | null;
  title: string;
  page_number: number;
  icon?: string | null;
}

export interface TocBlock {
  type: "toc";
  title: string;
  subtitle?: string | null;
  entries: TocEntry[];
}

export interface ComparisonBlock {
  type: "comparison";
  title?: string | null;
  left_title: string;
  left_items: string[];
  right_title: string;
  right_items: string[];
  left_icon?: string;
  right_icon?: string;
}

export interface TimelineItem {
  time?: string | null;
  year?: string | null;
  step?: string | null;
  title: string;
  description: string;
}

export interface TimelineBlock {
  type: "timeline";
  title?: string | null;
  items: (TimelineItem | Record<string, string>)[];
}

export interface ChecklistItem {
  text: string;
  checked?: boolean;
}

export interface ChecklistBlock {
  type: "checklist";
  title?: string | null;
  items: (ChecklistItem | Record<string, unknown> | string)[];
}

export interface StepItem {
  step_number?: number | null;
  title: string;
  description: string;
  code?: string | null;
  language?: string;
}

export interface StepBlock {
  type: "step";
  title?: string | null;
  steps: (StepItem | Record<string, unknown>)[];
}

export interface DefinitionBlock {
  type: "definition";
  term: string;
  definition: string;
  pronunciation?: string | null;
  part_of_speech?: string | null;
  example?: string | null;
}

export interface ExerciseBlock {
  type: "exercise";
  title: string;
  objective: string;
  instructions: string[];
  difficulty?: string;
  starter_code?: string | null;
  solution?: string | null;
  hints?: string[];
}

export type ContentBlock =
  | CodeBlock
  | TerminalBlock
  | TableBlock
  | SourceBlock
  | CalloutBlock
  | IconTextBlock
  | ChartBlock
  | DiagramBlock
  | QuoteBlock
  | StatisticBlock
  | ImageBlock
  | TextBlock
  | HeadingBlock
  | AcknowledgementBlock
  | CopyrightBlock
  | TocBlock
  | ComparisonBlock
  | TimelineBlock
  | ChecklistBlock
  | StepBlock
  | DefinitionBlock
  | ExerciseBlock
  | { type: string; [key: string]: unknown };

export interface PageContent {
  headline?: string | null;
  body?: string | null;
  key_points?: string[];
  code_snippets?: Record<string, string>[];
  callouts?: Record<string, string>[];
  blocks?: ContentBlock[];
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface PageStyle {
  theme: Theme;
  font_family?: string;
  accent_color?: string;
  background_color?: string | null;
  text_color?: string | null;
  text_muted?: string | null;
  border_color?: string | null;
  opener_template?: string | null;
  layout_variant?: string | null;
  custom_css?: string | null;
  [key: string]: unknown;
}

export interface Page {
  _id?: string;
  id: string;
  book_id: string;
  page_number: number;
  page_type: string;
  chapter_number?: number | null;
  chapter_name?: string | null;
  chapter_title?: string | null;
  theme: Theme;
  layout: string;
  previous_page_id?: string | null;
  next_page_id?: string | null;
  icon?: string | null;
  content: PageContent;
  style: PageStyle;
  sources?: SourceCitation[];
  html?: string;
  validation?: Record<string, unknown>;
  schema_version: number;
  renderer_version: string;
  created_at: string | Date;
  updated_at: string | Date;
  [key: string]: unknown;
}

export type BookPage = Page;

export interface CoverDesignPlan {
  concept_name?: string;
  cover_style?: string;
  visual_subject?: string;
  mood?: string;
  composition_style?: string;
  background_style?: string;
  title_alignment?: "left" | "center" | "right";
  title_position?: "top" | "upper_third" | "middle" | "lower_third" | "bottom";
  subtitle_position?: string;
  typography_style?: string;
  accent_elements?: string[];
  icon_strategy?: string;
  hero_icon?: string | null;
  border_strategy?: string;
  spacing_strategy?: string;
  visual_density?: string;
  contrast_mode?: string;
  decorative_geometry?: string;
  category_badge?: string | null;
  rationale?: string;
  palette_theme?: string;
  accent_color?: string;
  background_color?: string;
  title?: string;
  subtitle?: string | null;
  category?: string;
  tone?: string;
  audience?: string;
  author?: string | null;
  edition?: string | null;
  cover_seed?: number;
  [key: string]: unknown;
}

export type CoverDesign = CoverDesignPlan;

export interface Cover {
  _id?: string;
  id: string;
  book_id: string;
  width: number;
  height: number;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  design: CoverDesignPlan | Record<string, unknown>;
  html?: string;
  image_path?: string | null;
  schema_version: number;
  renderer_version: string;
  created_at: string | Date;
  updated_at: string | Date;
  [key: string]: unknown;
}

export type BookCover = Cover;

export interface AdStats {
  impressions: number;
  clicks: number;
}

export type AdPlacement =
  | "home_banner"
  | "home_sidebar"
  | "saved_banner"
  | "saved_sidebar"
  | (string & {});

export interface Ad {
  _id?: string;
  id: string;
  title: string;
  headline: string;
  description: string;
  sponsor: string;
  url: string;
  placements: (AdPlacement | string)[];
  priority: 1 | 2 | 3 | number;
  active: boolean;
  starts_at?: string | Date | null;
  ends_at?: string | Date | null;
  stats: AdStats;
  created_at: string | Date;
  updated_at: string | Date;
  [key: string]: unknown;
}

export type Advertisement = Ad;

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface SitemapEntry {
  slug: string;
  updated_at: string | Date;
}

