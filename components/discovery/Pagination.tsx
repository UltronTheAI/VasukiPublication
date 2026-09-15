import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  query?: string;
  className?: string;
}

function buildPageUrl(page: number, query?: string): string {
  const params = new URLSearchParams();
  if (query && query.trim()) {
    params.set("q", query.trim());
  }
  if (page > 1) {
    params.set("page", page.toString());
  }
  const str = params.toString();
  return str ? `/?${str}` : "/";
}

export function Pagination({
  currentPage,
  totalPages,
  query,
  className = "",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  // Generate visible page numbers (sliding window around current page)
  const pages: (number | string)[] = [];
  const maxButtons = 5;

  if (totalPages <= maxButtons) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (currentPage > 3) {
      pages.push("...");
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push("...");
    }
    pages.push(totalPages);
  }

  return (
    <nav
      role="navigation"
      aria-label="Pagination Navigation"
      className={`flex items-center justify-center gap-1.5 text-xs font-medium select-none ${className}`}
    >
      {/* Previous Page Link */}
      {hasPrev ? (
        <Link
          href={buildPageUrl(currentPage - 1, query)}
          aria-label="Previous Page"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-hairline hover:border-hairline-strong bg-white text-ink hover:bg-canvas-soft transition-colors shadow-2xs"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-hairline bg-canvas-soft text-mute cursor-not-allowed opacity-60"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </span>
      )}

      {/* Page Numbers */}
      <div className="flex items-center gap-1">
        {pages.map((p, idx) => {
          if (p === "...") {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 py-1.5 text-mute font-mono"
              >
                ...
              </span>
            );
          }

          const pageNum = Number(p);
          const isActive = pageNum === currentPage;

          return isActive ? (
            <span
              key={pageNum}
              aria-current="page"
              className="px-3 py-2 rounded-md bg-ink text-white font-semibold shadow-xs"
            >
              {pageNum}
            </span>
          ) : (
            <Link
              key={pageNum}
              href={buildPageUrl(pageNum, query)}
              className="px-3 py-2 rounded-md border border-hairline hover:border-hairline-strong bg-white text-body hover:text-ink hover:bg-canvas-soft transition-colors shadow-2xs"
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* Next Page Link */}
      {hasNext ? (
        <Link
          href={buildPageUrl(currentPage + 1, query)}
          aria-label="Next Page"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-hairline hover:border-hairline-strong bg-white text-ink hover:bg-canvas-soft transition-colors shadow-2xs"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-1 px-3 py-2 rounded-md border border-hairline bg-canvas-soft text-mute cursor-not-allowed opacity-60"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      )}
    </nav>
  );
}

