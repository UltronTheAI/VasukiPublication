import { z } from "zod";
import { CURRENT_SCHEMA_VERSION, CURRENT_RENDERER_VERSION } from "@/lib/types/publication";

export const themeSchema = z.enum(["light", "dark"]);

export const publicationStatusSchema = z.enum(["draft", "published", "unpublished"]);
export const publicationVisibilitySchema = z.enum(["public", "private"]);

export const publicationInfoSchema = z.object({
  status: publicationStatusSchema.default("draft"),
  visibility: publicationVisibilitySchema.default("public"),
  published_at: z.union([z.string(), z.date()]).nullish(),
  updated_at: z.union([z.string(), z.date()]).nullish(),
});

export const featuredInfoSchema = z.object({
  pinned: z.boolean().default(false),
  position: z.number().int().min(1).max(5).nullish(),
});

export const discoveryInfoSchema = z.object({
  search_title: z.string().default(""),
  keywords: z.array(z.string()).default([]),
  category: z.string().nullish(),
});

export const seoInfoSchema = z.object({
  title: z.string().default(""),
  description: z.string().default(""),
  canonical_slug: z.string().default(""),
});

export const bookStatsSchema = z.object({
  views: z.number().int().nonnegative().default(0),
  opens: z.number().int().nonnegative().default(0),
});

export const chapterMetadataSchema = z.object({
  chapter_number: z.number().int().positive(),
  title: z.string(),
  summary: z.string().nullish(),
  icon: z.string().nullish(),
  page_count: z.number().int().nonnegative().default(0),
  theme: themeSchema.default("light"),
});

export const pageStyleSchema = z.object({
  theme: themeSchema.default("light"),
  font_family: z.string().optional(),
  accent_color: z.string().optional(),
  background_color: z.string().nullish(),
  text_color: z.string().nullish(),
  text_muted: z.string().nullish(),
  border_color: z.string().nullish(),
  opener_template: z.string().nullish(),
  layout_variant: z.string().nullish(),
  custom_css: z.string().nullish(),
}).passthrough();

export const pageContentSchema = z.object({
  headline: z.string().nullish(),
  body: z.string().nullish(),
  key_points: z.array(z.string()).default([]),
  code_snippets: z.array(z.record(z.string(), z.string())).default([]),
  callouts: z.array(z.record(z.string(), z.string())).default([]),
  blocks: z.array(z.record(z.string(), z.unknown())).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
}).passthrough();

export const pageSchema = z.object({
  id: z.string(),
  book_id: z.string(),
  page_number: z.number().int().positive(),
  page_type: z.string().default("editorial"),
  chapter_number: z.number().int().nullish(),
  chapter_name: z.string().nullish(),
  chapter_title: z.string().nullish(),
  theme: themeSchema.default("light"),
  layout: z.string().default("editorial"),
  previous_page_id: z.string().nullish(),
  next_page_id: z.string().nullish(),
  icon: z.string().nullish(),
  content: pageContentSchema.default({
    key_points: [],
    code_snippets: [],
    callouts: [],
    blocks: [],
    metadata: {},
  }),
  style: pageStyleSchema.default({ theme: "light" }),
  sources: z.array(z.record(z.string(), z.unknown())).default([]),
  html: z.string().default(""),
  validation: z.record(z.string(), z.unknown()).default({}),
  schema_version: z.number().int().default(CURRENT_SCHEMA_VERSION),
  renderer_version: z.string().default(CURRENT_RENDERER_VERSION),
}).passthrough();

export const coverSchema = z.object({
  id: z.string(),
  book_id: z.string(),
  width: z.number().int().default(1600),
  height: z.number().int().default(2560),
  title: z.string(),
  subtitle: z.string().nullish(),
  author: z.string().nullish(),
  design: z.record(z.string(), z.unknown()).default({}),
  html: z.string().default(""),
  image_path: z.string().nullish(),
  schema_version: z.number().int().default(CURRENT_SCHEMA_VERSION),
  renderer_version: z.string().default(CURRENT_RENDERER_VERSION),
}).passthrough();

export const bookSchema = z.object({
  id: z.string(),
  schema_version: z.number().int().default(CURRENT_SCHEMA_VERSION),
  renderer_version: z.string().default(CURRENT_RENDERER_VERSION),
  slug: z.string(),
  title: z.string(),
  subtitle: z.string().nullish(),
  running_title: z.string().nullish(),
  author: z.string().nullish(),
  topic: z.string().default(""),
  prompt: z.string().default(""),
  description: z.string().default(""),
  book_type: z.string().nullish(),
  publication_profile: z.string().nullish(),
  category: z.string().nullish(),
  target_audience: z.string().nullish(),
  tone: z.string().nullish(),
  technical_depth: z.string().nullish(),
  status: z.string().default("draft"),
  chapter_count: z.number().int().default(0),
  page_count: z.number().int().default(0),
  starting_page_id: z.string().nullish(),
  cover_id: z.string().nullish(),
  chapters: z.array(chapterMetadataSchema).default([]),
  publication: publicationInfoSchema.default({ status: "draft", visibility: "public" }),
  featured: featuredInfoSchema.default({ pinned: false }),
  discovery: discoveryInfoSchema.default({ search_title: "", keywords: [] }),
  seo: seoInfoSchema.default({ title: "", description: "", canonical_slug: "" }),
  stats: bookStatsSchema.default({ views: 0, opens: 0 }),
}).passthrough();
