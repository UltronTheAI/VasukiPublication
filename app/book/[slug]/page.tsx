import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBookBySlug } from "@/lib/repositories/books";
import { getCoverForBook } from "@/lib/repositories/covers";
import { CoverPreview } from "@/components/cover/CoverPreview";
import { SaveBookButton } from "@/components/book/SaveBookButton";
import { resolveVasukiIconName } from "@/lib/vasuki/icon-map";
import { publicEnv } from "@/lib/env";
import {
  BookOpen,
  Layers,
  ArrowRight,
  ChevronRight,
  Clock,
  ShieldCheck,
  Tag,
  CheckCircle2,
  Sparkles,
  Terminal,
  Code,
  Database,
  Cpu,
  Zap,
  Compass,
  GitBranch,
  Workflow,
  Network,
  HardDrive,
  BarChart3,
  TrendingUp,
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

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  BookOpen,
  Book: BookOpen,
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
  CheckCircle2,
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

function ChapterIcon({ iconName }: { iconName?: string | null }) {
  const resolved = resolveVasukiIconName(iconName, "Sparkles");
  const IconComponent = ICON_MAP[resolved] || Sparkles;
  return <IconComponent className="w-4 h-4 text-mute group-hover:text-ink transition-colors" />;
}

interface BookDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: BookDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    return {
      title: "Publication Not Found",
      description: "The requested technical publication could not be found.",
    };
  }

  const title = book.seo?.title || `${book.title} | Vasuki Publication`;
  const description =
    book.seo?.description ||
    book.description ||
    book.subtitle ||
    `Read ${book.title} online on Vasuki Publication.`;
  const canonicalUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/book/${book.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "book",
      url: canonicalUrl,
      title: book.title,
      description,
      siteName: "Vasuki Publication",
      authors: book.author ? [book.author] : ["VasukiSquare Editorial"],
    },
    twitter: {
      card: "summary_large_image",
      title: book.title,
      description,
    },
  };
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { slug } = await params;
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    notFound();
  }

  // Fetch cover metadata (lightweight, no page documents loaded)
  const cover = await getCoverForBook(book.id || book._id || "");

  const category = book.category || book.discovery?.category || "Technical Publication";
  const pageCount = book.page_count || 0;
  const chapterCount = book.chapter_count || (book.chapters?.length ?? 0);
  const author = book.author || "VasukiSquare Editorial";
  const keywords = book.discovery?.keywords || [];
  const publishedDate = book.publication?.published_at
    ? new Date(book.publication.published_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Recently Published";

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Book",
    name: book.title,
    headline: book.subtitle || book.title,
    description: book.description || book.subtitle || "",
    numberOfPages: pageCount > 0 ? pageCount : undefined,
    author: {
      "@type": "Organization",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Vasuki Publication",
      url: publicEnv.NEXT_PUBLIC_SITE_URL,
    },
    datePublished: book.publication?.published_at || undefined,
    dateModified: book.updated_at || undefined,
    inLanguage: "en",
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/book/${book.slug}`,
    keywords: keywords.length > 0 ? keywords.join(", ") : undefined,
  };

  return (
    <div className="w-full bg-white text-ink">
      {/* JSON-LD for Search Engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb Navigation */}
      <div className="border-b border-hairline bg-canvas-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-xs font-mono text-mute">
            <Link href="/" className="hover:text-ink transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-mute/60" />
            <Link href="/?q=technical" className="hover:text-ink transition-colors">
              Publications
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-mute/60" />
            <span className="text-ink font-semibold truncate max-w-[240px] sm:max-w-md">
              {book.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Main Book Detail Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 items-start">
          {/* Left Column: Dynamic Cover & Action Center (4 cols) */}
          <div className="lg:col-span-4 flex flex-col items-center lg:items-start sticky top-24">
            <div className="w-full flex justify-center bg-canvas-soft rounded-2xl p-6 sm:p-8 border border-hairline shadow-xs">
              <CoverPreview
                book={book}
                cover={cover}
                size="detail"
                className="shadow-xl hover:scale-102 transition-transform duration-300"
              />
            </div>

            {/* CTAs */}
            <div className="w-full flex flex-col gap-3 mt-6">
              <Link
                href={`/book/${book.slug}/read`}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold rounded-xl bg-ink text-white hover:bg-black transition-all shadow-sm hover:shadow-md cursor-pointer group"
              >
                <span>Read Publication</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <SaveBookButton book={book} className="w-full" />
            </div>

            {/* Publication Identity Card */}
            <div className="w-full bg-canvas-soft border border-hairline rounded-xl p-4 mt-6 text-xs text-body space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <span className="text-mute font-mono">Date</span>
                <span className="text-ink font-medium">{publishedDate}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-hairline">
                <span className="text-mute font-mono">Engine</span>
                <span className="text-ink font-medium">VasukiSquare v{book.schema_version || 1}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mute font-mono">Format</span>
                <span className="text-ink font-medium">Native Web DOM (No PDF)</span>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Synopsis, Metrics & Chapters (8 cols) */}
          <div className="lg:col-span-8 flex flex-col">
            {/* Category & Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-link bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 font-semibold">
                {category}
              </span>
              {book.featured?.pinned && (
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Featured #{book.featured.position}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-ink leading-tight">
              {book.title}
            </h1>

            {/* Subtitle */}
            {book.subtitle && (
              <p className="mt-3 text-lg text-body font-normal leading-relaxed">
                {book.subtitle}
              </p>
            )}

            {/* Author Attribution */}
            <div className="mt-4 flex items-center gap-2 text-xs text-mute font-mono">
              <span>Authored by <strong className="text-ink font-semibold">{author}</strong></span>
              <span>•</span>
              <span>VasukiSquare Editorial</span>
            </div>

            {/* Metric Counters Banner */}
            <div className="grid grid-cols-2 gap-3 my-8 max-w-xs sm:max-w-sm">
              <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 text-center">
                <div className="flex items-center justify-center text-mute mb-1">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-ink">{pageCount}</div>
                <div className="text-[10px] font-mono text-mute uppercase">Pages</div>
              </div>

              <div className="bg-canvas-soft border border-hairline rounded-xl p-3.5 text-center">
                <div className="flex items-center justify-center text-mute mb-1">
                  <Layers className="w-4 h-4" />
                </div>
                <div className="text-lg font-bold text-ink">{chapterCount}</div>
                <div className="text-[10px] font-mono text-mute uppercase">Chapters</div>
              </div>
            </div>

            {/* Synopsis / Description */}
            <div className="mb-10">
              <h2 className="text-sm font-mono uppercase tracking-widest text-mute font-semibold mb-3">
                Publication Synopsis
              </h2>
              <div className="text-sm sm:text-base text-body leading-relaxed space-y-4">
                {book.description ? (
                  book.description.split("\n\n").map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))
                ) : (
                  <p>
                    This technical handbook provides in-depth architectural coverage, structural blueprints, and verified implementations generated and verified by the VasukiSquare engine.
                  </p>
                )}
              </div>
            </div>

            {/* Topic Keywords */}
            {keywords.length > 0 && (
              <div className="mb-10 pt-6 border-t border-hairline">
                <h3 className="text-xs font-mono uppercase tracking-wider text-mute font-semibold mb-3 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Subject Topics & Tags</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <Link
                      key={kw}
                      href={`/?q=${encodeURIComponent(kw.toLowerCase())}`}
                      className="px-2.5 py-1 text-xs font-mono rounded-md border border-hairline hover:border-hairline-strong bg-canvas-soft hover:bg-white text-body hover:text-ink transition-all shadow-2xs"
                    >
                      {kw}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Chapters Overview / Table of Contents */}
            <div className="pt-6 border-t border-hairline">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
                    <Layers className="w-4 h-4 text-brand-green" />
                    <span>Table of Contents & Chapters</span>
                  </h2>
                  <p className="text-xs text-mute font-mono mt-0.5">
                    {chapterCount} {chapterCount === 1 ? "chapter" : "chapters"} • Structured pedagogical progression
                  </p>
                </div>

                <Link
                  href={`/book/${book.slug}/read`}
                  className="text-xs font-semibold text-link hover:underline flex items-center gap-1"
                >
                  <span>Start with Chapter 1</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {book.chapters && book.chapters.length > 0 ? (
                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-2 custom-scrollbar">
                  {book.chapters.map((ch) => (
                    <div
                      key={ch.chapter_number}
                      className="group bg-canvas-soft hover:bg-white border border-hairline hover:border-hairline-strong rounded-xl p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-lg bg-white border border-hairline flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <ChapterIcon iconName={ch.icon} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-semibold text-mute uppercase">
                              Chapter {String(ch.chapter_number).padStart(2, "0")}
                            </span>
                            <span
                              className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                                ch.theme === "dark"
                                  ? "bg-slate-900 text-slate-200 border-slate-700"
                                  : "bg-white text-body border-hairline"
                              }`}
                            >
                              {ch.theme} theme
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-ink leading-snug">
                            {ch.title}
                          </h3>
                          {ch.summary && (
                            <p className="text-xs text-body mt-1 leading-relaxed line-clamp-2">
                              {ch.summary}
                            </p>
                          )}
                        </div>
                      </div>

                      {ch.page_count > 0 && (
                        <div className="text-[11px] font-mono text-mute shrink-0 self-center bg-white px-2 py-1 rounded border border-hairline">
                          {ch.page_count}p
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-canvas-soft border border-hairline rounded-xl p-6 text-center text-xs text-mute font-mono">
                  Detailed chapter outline will be resolved upon opening the interactive reader.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


