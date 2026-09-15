import React from "react";
import Link from "next/link";
import type { Book, Cover } from "@/lib/types/publication";
import { CoverPreview } from "@/components/cover/CoverPreview";
import { Sparkles, BookOpen, Layers, ArrowRight, Bookmark } from "lucide-react";

interface PinnedSectionProps {
  books: Book[];
  coversMap?: Record<string, Cover>;
}

export function PinnedSection({ books, coversMap = {} }: PinnedSectionProps) {
  if (!books || books.length === 0) return null;

  const leadBook = books[0];
  const secondaryBooks = books.slice(1);

  return (
    <section aria-labelledby="featured-heading" className="w-full mb-12">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-6 h-6 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink">
          <Sparkles className="w-3.5 h-3.5 text-[#f5a623]" />
        </div>
        <h2 id="featured-heading" className="text-sm font-mono uppercase tracking-widest text-mute font-semibold">
          Featured Publications
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Primary Lead Feature (Heroic card) */}
        <div className="lg:col-span-7 bg-white border border-hairline hover:border-hairline-strong rounded-2xl p-6 sm:p-8 transition-all shadow-xs flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-link font-semibold bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                Editor&apos;s Lead Choice
              </span>
              <span className="text-xs font-mono text-mute">
                Position #1
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
              <div className="shrink-0 group-hover:scale-102 transition-transform duration-200">
                <CoverPreview
                  book={leadBook}
                  cover={coversMap[leadBook.id] || coversMap[leadBook.slug]}
                  size="lg"
                  className="shadow-md"
                />
              </div>

              <div className="flex flex-col justify-between">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-ink leading-tight group-hover:text-link transition-colors">
                    <Link href={`/books/${leadBook.slug}`}>
                      {leadBook.title}
                    </Link>
                  </h3>

                  {leadBook.subtitle && (
                    <p className="mt-2 text-sm text-body font-medium leading-normal">
                      {leadBook.subtitle}
                    </p>
                  )}

                  <p className="mt-3 text-xs text-mute leading-relaxed line-clamp-4">
                    {leadBook.description || "In-depth publication generated and verified by the VasukiSquare engine."}
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-xs font-mono text-mute">
                  {leadBook.author && (
                    <span className="text-ink font-medium">{leadBook.author}</span>
                  )}
                  {leadBook.page_count > 0 && (
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {leadBook.page_count} pages
                    </span>
                  )}
                  {leadBook.chapter_count > 0 && (
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {leadBook.chapter_count} chapters
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-hairline flex items-center justify-between">
            <button
              type="button"
              className="inline-flex items-center gap-1.5 text-xs text-mute hover:text-ink font-mono transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Save for Later</span>
            </button>

            <Link
              href={`/books/${leadBook.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-black transition-all shadow-xs hover:shadow-md cursor-pointer"
            >
              <span>Read Publication</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Secondary Pinned Books Grid (Up to 4) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {secondaryBooks.map((book, idx) => (
            <div
              key={book.id || book.slug}
              className="bg-white border border-hairline hover:border-hairline-strong rounded-xl p-4 transition-all shadow-xs flex items-center gap-4 group"
            >
              <div className="shrink-0 group-hover:scale-104 transition-transform duration-200">
                <CoverPreview
                  book={book}
                  cover={coversMap[book.id] || coversMap[book.slug]}
                  size="sm"
                  className="shadow-2xs"
                />
              </div>

              <div className="flex flex-col justify-between flex-1 min-w-0">
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-mute bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline font-semibold truncate">
                      {book.category || "Handbook"}
                    </span>
                    <span className="text-[10px] font-mono text-mute shrink-0">
                      #{idx + 2}
                    </span>
                  </div>

                  <h4 className="text-sm font-semibold text-ink group-hover:text-link transition-colors truncate">
                    <Link href={`/books/${book.slug}`}>
                      {book.title}
                    </Link>
                  </h4>

                  <p className="text-xs text-body line-clamp-1 mt-0.5">
                    {book.subtitle || book.description}
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-mute font-mono">
                  <span>{book.page_count} pages</span>
                  <Link
                    href={`/books/${book.slug}`}
                    className="text-ink font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

