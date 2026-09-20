"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Maximize,
  Minimize,
  Columns2,
  Square,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Bookmark,
  BookmarkCheck,
  X,
} from "lucide-react";
import { VasukiBookPage } from "@/components/reader/VasukiBookPage";
import { useSavedBooks } from "@/lib/hooks/useSavedBooks";
import {
  loadPagesFromBrowserCache,
  savePagesToBrowserCache,
  cleanExpiredBrowserPageCaches,
  getBatchWindowForPage,
  shouldPrefetchNextBatch,
  getNextBatchStart,
} from "@/lib/reader/reader-cache";
import type { Book, Page } from "@/lib/types/publication";
import type { ChapterRange } from "@/lib/repositories/pages";

interface ReaderContainerProps {
  book: Book;
  initialPage?: number;
  initialPages?: Page[];
  chapterRanges?: Record<number, ChapterRange>;
}

export function ReaderContainer({
  book,
  initialPage = 1,
  initialPages = [],
  chapterRanges,
}: ReaderContainerProps) {
  const totalPages = Math.max(1, book.page_count || 1);

  // Normalize initial page
  const clampedInitialPage = Math.min(Math.max(1, initialPage), totalPages);

  const [currentPage, setCurrentPage] = useState<number>(clampedInitialPage);
  const [spreadMode, setSpreadMode] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | "open" | null>(null);

  const { isSaved, toggle } = useSavedBooks();
  const bookSlug = book.slug || book.id;
  const isBookSaved = isSaved(bookSlug);

  // Client-side cache: Map of pageNumber -> Page
  const [pageCache, setPageCache] = useState<Record<number, Page>>(() => {
    const initialMap: Record<number, Page> = {};
    for (const p of initialPages) {
      if (p && p.page_number) {
        initialMap[p.page_number] = p;
      }
    }
    return initialMap;
  });

  const pageCacheRef = useRef<Record<number, Page>>(pageCache);
  useEffect(() => {
    pageCacheRef.current = pageCache;
  }, [pageCache]);

  const inFlightFetches = useRef<Set<number>>(new Set());
  const readerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // ---------------------------------------------------------------------------
  // 1. Initial Browser Storage Hydration (2-day retention policy)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    cleanExpiredBrowserPageCaches();

    const cached = loadPagesFromBrowserCache(bookSlug);
    if (cached && Object.keys(cached).length > 0) {
      queueMicrotask(() => {
        setPageCache((prev) => {
          const merged = { ...cached, ...prev };
          savePagesToBrowserCache(bookSlug, merged);
          return merged;
        });
      });
    } else if (initialPages.length > 0) {
      savePagesToBrowserCache(bookSlug, initialPages);
    }
  }, [bookSlug, initialPages]);

  // ---------------------------------------------------------------------------
  // Responsive spread mode default (Desktop vs Mobile)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1280) {
        setSpreadMode(true);
      } else {
        setSpreadMode(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---------------------------------------------------------------------------
  // URL Search Param Sync (shallow replace)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const url = new URL(window.location.href);
    const urlPage = parseInt(url.searchParams.get("page") || "1", 10);
    if (urlPage !== currentPage) {
      url.searchParams.set("page", currentPage.toString());
      window.history.replaceState({}, "", url.toString());
    }
  }, [currentPage]);

  // ---------------------------------------------------------------------------
  // Compute Current Left & Right Pages
  // Rule:
  // - On mobile (<1280px): Strictly single page
  // - Page 1 is ALWAYS single (Cover)
  // - Last page is single if standalone
  // - Inside pages show as facing pair on large desktop (Even on left, Odd on right)
  // ---------------------------------------------------------------------------
  const isCoverPage = currentPage === 1;
  const isEffectiveSpread = spreadMode && typeof window !== "undefined" && window.innerWidth >= 1280;

  const effectiveLeftPageNum = isCoverPage
    ? 1
    : isEffectiveSpread
    ? currentPage % 2 === 0
      ? currentPage
      : currentPage - 1
    : currentPage;

  const effectiveRightPageNum =
    isEffectiveSpread && !isCoverPage && effectiveLeftPageNum + 1 <= totalPages
      ? effectiveLeftPageNum + 1
      : null;

  // ---------------------------------------------------------------------------
  // Active 10-Page Batch Loader & 8th-Page Prefetch Trigger with 2-day cache
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function fetchBatch(startPage: number, limit: number = 10) {
      if (startPage > totalPages || inFlightFetches.current.has(startPage) || cancelled) {
        return;
      }

      // Check if all pages in this batch are already present in cache
      const endPage = Math.min(startPage + limit - 1, totalPages);
      let allCached = true;
      for (let p = startPage; p <= endPage; p++) {
        if (!pageCacheRef.current[p]) {
          allCached = false;
          break;
        }
      }
      if (allCached) return;

      inFlightFetches.current.add(startPage);

      try {
        const res = await fetch(
          `/api/books/${encodeURIComponent(book.slug)}/pages?page=${startPage}&limit=${limit}`
        );
        if (!res.ok || cancelled) return;

        const data = await res.json();
        if (data.pages && Array.isArray(data.pages)) {
          setPageCache((prev) => {
            const next = { ...prev };
            for (const p of data.pages) {
              if (p && p.page_number) {
                next[p.page_number] = p;
              }
            }
            savePagesToBrowserCache(book.slug, next);
            return next;
          });
        }
      } catch {
        // prefetch errors silently handled
      } finally {
        inFlightFetches.current.delete(startPage);
      }
    }

    async function loadPagesAndPrefetch() {
      // 1. Ensure current visible page batch (10 pages) is loaded
      const leftBatch = getBatchWindowForPage(effectiveLeftPageNum, 10);
      await fetchBatch(leftBatch.start, 10);

      if (effectiveRightPageNum) {
        const rightBatch = getBatchWindowForPage(effectiveRightPageNum, 10);
        if (rightBatch.start !== leftBatch.start) {
          await fetchBatch(rightBatch.start, 10);
        }
      }

      // 2. Prefetch next 10 pages when user reaches 8th page of batch (e.g. 8, 18, 28, 38...)
      if (shouldPrefetchNextBatch(currentPage, 10, 8)) {
        const nextBatchStart = getNextBatchStart(currentPage, 10);
        if (nextBatchStart <= totalPages) {
          fetchBatch(nextBatchStart, 10);
        }
      }

      // 3. Backward prefetch if user is reading early in current batch (e.g. page 11 or 12)
      const positionInBatch = ((currentPage - 1) % 10) + 1;
      if (positionInBatch <= 2 && leftBatch.start > 1) {
        const prevBatchStart = Math.max(1, leftBatch.start - 10);
        fetchBatch(prevBatchStart, 10);
      }
    }

    loadPagesAndPrefetch();

    return () => {
      cancelled = true;
    };
  }, [effectiveLeftPageNum, effectiveRightPageNum, currentPage, totalPages, book.slug]);

  // ---------------------------------------------------------------------------
  // Navigation Handlers
  // ---------------------------------------------------------------------------
  const goToPage = useCallback(
    (targetPage: number) => {
      const clamped = Math.min(Math.max(1, targetPage), totalPages);
      if (clamped === currentPage) return;
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const isOpeningSpread = currentPage === 1 && clamped > 1;
      const dir = isOpeningSpread ? "open" : clamped > currentPage ? "next" : "prev";

      if (!isMobile) {
        setFlipDirection(dir);
        // Reset animation state after smooth 3D animation duration
        setTimeout(() => setFlipDirection(null), 360);
      } else {
        setFlipDirection(null);
      }

      setCurrentPage(clamped);
    },
    [currentPage, totalPages]
  );

  const prevPage = useCallback(() => {
    if (currentPage <= 1) return;
    const isSpread = spreadMode && typeof window !== "undefined" && window.innerWidth >= 1280;
    if (!isSpread) {
      goToPage(currentPage - 1);
    } else {
      if (currentPage <= 2) {
        goToPage(1);
      } else {
        const left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        goToPage(Math.max(1, left - 2));
      }
    }
  }, [currentPage, spreadMode, goToPage]);

  const nextPage = useCallback(() => {
    if (currentPage >= totalPages) return;
    const isSpread = spreadMode && typeof window !== "undefined" && window.innerWidth >= 1280;
    if (!isSpread) {
      goToPage(currentPage + 1);
    } else {
      if (currentPage === 1) {
        goToPage(2);
      } else {
        const left = currentPage % 2 === 0 ? currentPage : currentPage - 1;
        goToPage(Math.min(totalPages, left + 2));
      }
    }
  }, [currentPage, totalPages, spreadMode, goToPage]);

  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  // ---------------------------------------------------------------------------
  // Keyboard Shortcuts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        prevPage();
      } else if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "Home") {
        e.preventDefault();
        firstPage();
      } else if (e.key === "End") {
        e.preventDefault();
        lastPage();
      } else if (e.key === "Escape") {
        if (isTocOpen) {
          setIsTocOpen(false);
        } else if (isFullscreen && document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [prevPage, nextPage, firstPage, lastPage, isTocOpen, isFullscreen]);

  // ---------------------------------------------------------------------------
  // Touch Gestures (Mobile Swipe)
  // ---------------------------------------------------------------------------
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const threshold = 50;

    if (diffX > threshold) {
      nextPage();
    } else if (diffX < -threshold) {
      prevPage();
    }
    touchStartX.current = null;
  };

  // ---------------------------------------------------------------------------
  // Fullscreen Management
  // ---------------------------------------------------------------------------
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      readerRef.current?.requestFullscreen?.().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // ---------------------------------------------------------------------------
  // Render Page Slots Data
  // ---------------------------------------------------------------------------
  const leftPageData = pageCache[effectiveLeftPageNum];
  const rightPageData = effectiveRightPageNum ? pageCache[effectiveRightPageNum] : null;

  // ---------------------------------------------------------------------------
  // Accurate Cumulative & Database Chapter Page Ranges
  // ---------------------------------------------------------------------------
  const chaptersWithPageRanges = useMemo(() => {
    let fallbackCursor = 1;
    const result = [];
    for (const ch of book.chapters || []) {
      const dbRange = chapterRanges?.[ch.chapter_number];
      if (
        dbRange &&
        typeof dbRange.start_page === "number" &&
        typeof dbRange.end_page === "number"
      ) {
        result.push({
          ...ch,
          startPage: dbRange.start_page,
          endPage: dbRange.end_page,
          page_count: dbRange.page_count,
        });
      } else {
        const startPage = fallbackCursor;
        const count = Math.max(1, ch.page_count || 1);
        const endPage = startPage + count - 1;
        fallbackCursor += count;
        result.push({
          ...ch,
          startPage,
          endPage,
        });
      }
    }
    return result;
  }, [book.chapters, chapterRanges]);

  const isCoverActive =
    currentPage === 1 ||
    (chaptersWithPageRanges.length > 0 && currentPage < chaptersWithPageRanges[0].startPage);

  return (
    <div
      ref={readerRef}
      className="fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-100 text-slate-900 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      suppressHydrationWarning
    >
      {/* =======================================================================
          1. TOP READER NAVBAR (Mobile-Responsive, Clean Branding & Controls)
         ======================================================================= */}
      <header
        className="shrink-0 h-14 sm:h-16 bg-white/95 border-b border-slate-200 px-2 sm:px-6 lg:px-8 flex items-center justify-between z-30 backdrop-blur-md shadow-xs select-none gap-1 sm:gap-3"
        suppressHydrationWarning
      >
        {/* Left: Overview Back Button & Book Title Branding */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink">
          <Link
            href={`/book/${book.slug}`}
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            title="Return to book overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-1.5 shrink-0 hover:opacity-85 transition-opacity"
            title="Vasuki Publication"
          >
            <Image
              src="/Vasuki.png"
              alt="Vasuki Logo"
              width={24}
              height={24}
              className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
            />
          </Link>

          <div className="h-4 sm:h-5 w-px bg-slate-200 shrink-0 hidden xs:block" />

          <div className="min-w-0 hidden xs:block">
            <h1 className="text-xs sm:text-base font-bold text-slate-900 truncate max-w-[80px] xs:max-w-[130px] sm:max-w-[220px] md:max-w-xs">
              {book.title}
            </h1>
          </div>
        </div>

        {/* Center: Shifted Professional Page Navigation Pill */}
        <div className="flex items-center justify-center shrink-0">
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-lg p-0.5 sm:p-1 shadow-2xs">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              title="Previous Page (ArrowLeft)"
              className="p-1 sm:p-1.5 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            <div className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2.5 text-[11px] sm:text-xs font-mono font-medium text-slate-700">
              <span className="text-slate-500 hidden sm:inline">Page</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (Number.isFinite(val)) {
                    goToPage(val);
                  }
                }}
                className="w-8 sm:w-11 bg-white border border-slate-300 rounded px-1 py-0.5 text-center text-[11px] sm:text-xs font-bold text-emerald-700 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
                suppressHydrationWarning
              />
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              title="Next Page (ArrowRight)"
              className="p-1 sm:p-1.5 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
              suppressHydrationWarning
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* Right: Actions (Contents, Bookmark, Fullscreen) */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
          {/* Zoom Controls (Desktop only) */}
          <div className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              title="Zoom Out"
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              suppressHydrationWarning
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs text-slate-700 px-1.5 font-semibold min-w-[38px] text-center">
              {zoomLevel}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              title="Zoom In"
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
              suppressHydrationWarning
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Two-Page Spread View Toggle (Large screens only) */}
          <button
            onClick={() => setSpreadMode(!spreadMode)}
            title={spreadMode ? "Switch to Single Page View" : "Switch to Two-Page Spread View"}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            {spreadMode ? (
              <>
                <Columns2 className="w-4 h-4 text-emerald-600" />
                <span className="hidden xl:inline">Two-Page</span>
              </>
            ) : (
              <>
                <Square className="w-4 h-4 text-slate-600" />
                <span className="hidden xl:inline">Single</span>
              </>
            )}
          </button>

          {/* Table of Contents Drawer Trigger */}
          <button
            onClick={() => setIsTocOpen(true)}
            title="Table of Contents"
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            <List className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            <span className="hidden md:inline">Contents</span>
          </button>

          {/* Bookmark / Save Button */}
          <button
            onClick={() => toggle(bookSlug)}
            title={isBookSaved ? "Saved in your browser" : "Save book for later"}
            aria-label={isBookSaved ? `Remove ${book.title} from saved list` : `Save ${book.title} to saved list`}
            className={`flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isBookSaved
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
            suppressHydrationWarning
          >
            {isBookSaved ? (
              <BookmarkCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" />
            ) : (
              <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600" />
            )}
            <span className="hidden xl:inline">{isBookSaved ? "Saved" : "Save"}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
            suppressHydrationWarning
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" /> : <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </button>
        </div>
      </header>

      {/* =======================================================================
          2. MAIN CANVAS VIEWPORT (A4 Book Page Display)
         ======================================================================= */}
      <main className="flex-1 relative flex items-center justify-center p-2 sm:p-5 md:p-6 pb-20 sm:pb-5 overflow-hidden w-full h-full min-h-0">
        {/* Previous Page Floating Button (Visible on tablet/desktop) */}
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          title="Previous Page (ArrowLeft)"
          className={`hidden sm:flex absolute left-2 md:left-6 z-20 p-3 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer ${
            currentPage <= 1 ? "opacity-20 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
          suppressHydrationWarning
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Book Canvas 3D Viewport */}
        <div className="book-3d-stage">
          <div
            className={`book-3d-spread ${
              rightPageData
                ? flipDirection === "open"
                  ? "is-opening"
                  : flipDirection === "next"
                  ? "is-flip-next"
                  : flipDirection === "prev"
                  ? "is-flip-prev"
                  : ""
                : flipDirection === "next"
                ? "is-single-flip-next"
                : flipDirection === "prev"
                ? "is-single-flip-prev"
                : ""
            }`}
            style={{ transform: `scale(${zoomLevel / 100})` }}
          >
            {/* Left Page Slot */}
            <div
              className={`h-full w-auto max-w-[calc(100vw-1.25rem)] sm:max-w-full max-h-[calc(100dvh-7.5rem)] sm:max-h-[calc(100dvh-5.5rem)] aspect-[210/297] flex items-center justify-center min-w-0 min-h-0 shrink ${
                rightPageData ? "book-page-slot-left" : "drop-shadow-md"
              }`}
            >
              {leftPageData ? (
                <VasukiBookPage
                  page={leftPageData}
                  book={book}
                  nextPage={rightPageData || pageCache[effectiveLeftPageNum + 1] || null}
                />
              ) : (
                <div className="vasuki-book-root w-full h-full flex items-center justify-center">
                  <div className="vasuki-page-canvas bg-white border border-slate-200 rounded-sm flex flex-col items-center justify-center p-8 text-center text-slate-500 shadow-sm w-full h-full aspect-[210/297]">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
                    <p className="text-xs font-mono">Loading Page {effectiveLeftPageNum}...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Book Spine Crease & Shadow in 2-Page Spread */}
            {rightPageData && (
              <div className="hidden xl:block book-spine-crease" aria-hidden="true" />
            )}

            {/* Right Page Slot (Spread mode only on large screens when not on Cover or standalone last page) */}
            {rightPageData && (
              <div className="hidden xl:flex h-full w-auto max-w-full max-h-[calc(100dvh-5.5rem)] aspect-[210/297] items-center justify-center min-w-0 min-h-0 shrink book-page-slot-right">
                <VasukiBookPage
                  page={rightPageData}
                  book={book}
                  nextPage={effectiveRightPageNum ? pageCache[effectiveRightPageNum + 1] || null : null}
                />
              </div>
            )}
          </div>
        </div>

        {/* Next Page Floating Button (Visible on tablet/desktop) */}
        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          title="Next Page (ArrowRight)"
          className={`hidden sm:flex absolute right-2 md:right-6 z-20 p-3 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer ${
            currentPage >= totalPages ? "opacity-20 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
          suppressHydrationWarning
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Mobile Fixed Bottom Navigation Bar (Visible on phones) */}
        <div className="sm:hidden fixed bottom-3 inset-x-0 z-30 flex items-center justify-center px-4 pointer-events-none">
          <div className="flex items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-full shadow-2xl border border-white/20 pointer-events-auto min-w-[270px] max-w-xs">
            {/* Left Button */}
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              title="Previous Page"
              aria-label="Previous Page"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-semibold cursor-pointer min-h-[38px]"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-4 h-4 text-emerald-400" />
              <span>Prev</span>
            </button>

            {/* Current Page Indicator */}
            <div className="flex flex-col items-center justify-center px-2 select-none">
              <span className="font-mono text-xs font-bold text-slate-100 tracking-wide">
                {currentPage} <span className="text-slate-400 font-normal">/</span> {totalPages}
              </span>
              <span className="text-[9.5px] text-slate-400 font-medium truncate max-w-[80px]">
                {currentPage === 1 ? "Cover" : `Page ${currentPage}`}
              </span>
            </div>

            {/* Right Button */}
            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              title="Next Page"
              aria-label="Next Page"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-emerald-500 text-slate-950 hover:bg-emerald-400 active:scale-95 disabled:opacity-30 disabled:pointer-events-none transition-all text-xs font-bold shadow-sm cursor-pointer min-h-[38px]"
              suppressHydrationWarning
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>

      {/* =======================================================================
          3. TABLE OF CONTENTS DRAWER / MODAL
         ======================================================================= */}
      {isTocOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in">
          {/* Overlay Click */}
          <div className="flex-1" onClick={() => setIsTocOpen(false)} />

          {/* Drawer Panel */}
          <div className="w-full max-w-md bg-white border-l border-slate-200 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-200 text-slate-900">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">Table of Contents</h3>
              </div>
              <button
                onClick={() => setIsTocOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
              {/* Cover jump item */}
              <button
                onClick={() => {
                  goToPage(1);
                  setIsTocOpen(false);
                }}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                  isCoverActive
                    ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium shadow-2xs"
                    : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`font-mono text-xs font-semibold w-6 shrink-0 text-center ${
                      isCoverActive ? "text-emerald-700" : "text-slate-400"
                    }`}
                  >
                    —
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                    Cover
                  </span>
                </div>
                <span
                  className={`font-mono text-xs shrink-0 ${
                    isCoverActive ? "text-emerald-700 font-semibold" : "text-slate-400"
                  }`}
                >
                  p. 1
                </span>
              </button>

              {/* Chapters */}
              {chaptersWithPageRanges.map((ch) => {
                const isCurrent =
                  currentPage >= ch.startPage && currentPage <= ch.endPage;

                return (
                  <button
                    key={ch.chapter_number}
                    onClick={() => {
                      goToPage(ch.startPage);
                      setIsTocOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                      isCurrent
                        ? "bg-emerald-50/90 border-emerald-300 text-emerald-950 font-medium shadow-2xs"
                        : "bg-white hover:bg-slate-50 border-slate-200/80 text-slate-700 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`font-mono text-xs font-bold w-6 shrink-0 text-center ${
                          isCurrent ? "text-emerald-700" : "text-slate-400"
                        }`}
                      >
                        {String(ch.chapter_number).padStart(2, "0")}
                      </span>
                      <span className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                        {ch.title}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-xs shrink-0 ${
                        isCurrent ? "text-emerald-700 font-semibold" : "text-slate-400"
                      }`}
                    >
                      p. {ch.startPage}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
