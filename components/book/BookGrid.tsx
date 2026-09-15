import React from "react";
import Link from "next/link";
import type { Book, Cover } from "@/lib/types/publication";
import { BookCard } from "./BookCard";
import { BookOpen, SearchX, RotateCcw } from "lucide-react";

interface BookGridProps {
  books: Book[];
  coversMap?: Record<string, Cover>;
  query?: string;
  total?: number;
}

export function BookGrid({
  books,
  coversMap = {},
  query,
  total,
}: BookGridProps) {
  if (!books || books.length === 0) {
    if (query) {
      return (
        <div className="w-full bg-canvas-soft border border-hairline rounded-2xl p-12 text-center my-8">
          <div className="w-12 h-12 rounded-full bg-white border border-hairline flex items-center justify-center text-mute mx-auto mb-4">
            <SearchX className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-ink mb-1">
            No publications found for &quot;{query}&quot;
          </h3>
          <p className="text-xs text-mute max-w-sm mx-auto mb-6">
            We couldn&apos;t find any published books matching your search. Try searching for broader terms like &quot;Rust&quot;, &quot;Architecture&quot;, or &quot;Guide&quot;.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-black transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Search</span>
          </Link>
        </div>
      );
    }

    return (
      <div className="w-full bg-canvas-soft border border-hairline rounded-2xl p-12 text-center my-8">
        <div className="w-12 h-12 rounded-full bg-white border border-hairline flex items-center justify-center text-mute mx-auto mb-4">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-ink mb-1">
          No publications available yet
        </h3>
        <p className="text-xs text-mute max-w-sm mx-auto">
          VasukiSquare has not published any books to this database yet. Generated publications will automatically appear here once published.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Listing Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-base font-bold text-ink tracking-tight flex items-center gap-2">
            {query ? (
              <>
                <span>Search Results for</span>
                <span className="font-mono text-link bg-blue-50 px-2 py-0.5 rounded border border-blue-100 text-sm">
                  &quot;{query}&quot;
                </span>
              </>
            ) : (
              <span>All Publications</span>
            )}
          </h2>
          {typeof total === "number" && (
            <p className="text-xs text-mute font-mono mt-0.5">
              Showing {books.length} of {total} {total === 1 ? "publication" : "publications"}
            </p>
          )}
        </div>
      </div>

      {/* Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {books.map((book) => (
          <BookCard
            key={book.id || book.slug}
            book={book}
            cover={coversMap[book.id] || coversMap[book.slug]}
          />
        ))}
      </div>
    </div>
  );
}

