"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  List,
  Maximize,
  Minimize,
  Columns2,
  Square,
  ArrowLeft,
  Sun,
  Moon,
  Coffee,
  Sparkles,
  Search,
  X,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { VasukiBookPage } from "@/components/reader/VasukiBookPage";
import { VasukiIcon } from "@/components/vasuki/VasukiIcon";
import { useSavedBooks } from "@/lib/hooks/useSavedBooks";
import type { Book, Page } from "@/lib/types/publication";

interface ReaderContainerProps {
  book: Book;
  initialPage: number;
  initialPages: Page[];
}

type ReaderTheme = "auto" | "light" | "dark" | "sepia";

export function ReaderContainer({
  book,
  initialPage = 1,
  initialPages = [],
}: ReaderContainerProps) {
  const totalPages = Math.max(1, book.page_count || 1);

  // Normalize initial page
  const clampedInitialPage = Math.min(Math.max(1, initialPage), totalPages);

  const [currentPage, setCurrentPage] = useState<number>(clampedInitialPage);
  const [spreadMode, setSpreadMode] = useState<boolean>(false);
  const [themeMode, setThemeMode] = useState<ReaderTheme>("auto");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isTocOpen, setIsTocOpen] = useState<boolean>(false);
  const [tocSearch, setTocSearch] = useState<string>("");
  const [flipDirection, setFlipDirection] = useState<"next" | "prev" | null>(null);

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
  // Responsive spread mode default (Desktop vs Mobile)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1200) {
        // Enable spread mode on large displays
        setSpreadMode(true);
      }
    };
    handleResize();
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
  // Active page loader & Prefetch trigger
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      const targets: number[] = [currentPage];
      if (spreadMode && currentPage + 1 <= totalPages) {
        targets.push(currentPage + 1);
      }

      // Prefetch upcoming pages (next 2-4 pages)
      const upcomingStart = spreadMode ? currentPage + 2 : currentPage + 1;
      for (let i = 0; i < 3; i++) {
        const p = upcomingStart + i;
        if (p <= totalPages) {
          targets.push(p);
        }
      }

      // Prefetch previous page
      if (currentPage > 1) {
        targets.push(currentPage - 1);
      }

      for (const pageNum of targets) {
        if (
          pageCacheRef.current[pageNum] ||
          inFlightFetches.current.has(pageNum) ||
          cancelled
        ) {
          continue;
        }

        inFlightFetches.current.add(pageNum);

        try {
          const res = await fetch(
            `/api/books/${encodeURIComponent(book.slug)}/pages?page=${pageNum}&limit=2`
          );
          if (!res.ok || cancelled) continue;

          const data = await res.json();
          if (data.pages && Array.isArray(data.pages)) {
            setPageCache((prev) => {
              const next = { ...prev };
              for (const p of data.pages) {
                if (p && p.page_number) {
                  next[p.page_number] = p;
                }
              }
              return next;
            });
          }
        } catch {
          // prefetch errors ignored
        } finally {
          inFlightFetches.current.delete(pageNum);
        }
      }
    }

    loadPages();

    return () => {
      cancelled = true;
    };
  }, [currentPage, spreadMode, totalPages, book.slug]);

  // ---------------------------------------------------------------------------
  // Navigation Handlers
  // ---------------------------------------------------------------------------
  const goToPage = useCallback(
    (targetPage: number) => {
      const clamped = Math.min(Math.max(1, targetPage), totalPages);
      if (clamped === currentPage) return;

      setFlipDirection(clamped > currentPage ? "next" : "prev");
      setCurrentPage(clamped);

      // Reset animation state
      setTimeout(() => setFlipDirection(null), 300);
    },
    [currentPage, totalPages]
  );

  const prevPage = useCallback(() => {
    const step = spreadMode && currentPage > 2 ? 2 : 1;
    goToPage(currentPage - step);
  }, [currentPage, spreadMode, goToPage]);

  const nextPage = useCallback(() => {
    const step = spreadMode && currentPage + 1 < totalPages ? 2 : 1;
    goToPage(currentPage + step);
  }, [currentPage, spreadMode, totalPages, goToPage]);

  const firstPage = useCallback(() => goToPage(1), [goToPage]);
  const lastPage = useCallback(() => goToPage(totalPages), [goToPage, totalPages]);

  // ---------------------------------------------------------------------------
  // Keyboard Shortcuts
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore when typing inside an input or textarea
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
  // Theme Override Resolver
  // ---------------------------------------------------------------------------
  const effectiveThemeOverride = themeMode === "auto" ? null : themeMode;

  // ---------------------------------------------------------------------------
  // Render Page Slots
  // ---------------------------------------------------------------------------
  const leftPageData = pageCache[currentPage];
  const rightPageData =
    spreadMode && currentPage + 1 <= totalPages ? pageCache[currentPage + 1] : null;

  // Determine current chapter title from chapters array or page data
  const currentChapter = book.chapters?.find(
    (ch) =>
      leftPageData?.chapter_number === ch.chapter_number ||
      (ch.page_count && currentPage >= ch.chapter_number * 2)
  );

  const filteredChapters = (book.chapters || []).filter(
    (ch) =>
      !tocSearch ||
      ch.title.toLowerCase().includes(tocSearch.toLowerCase()) ||
      String(ch.chapter_number).includes(tocSearch)
  );

  return (
    <div
      ref={readerRef}
      className="fixed inset-0 z-50 w-screen h-screen flex flex-col bg-slate-100 text-slate-900 select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* =======================================================================
          1. TOP READER TOOLBAR
         ======================================================================= */}
      <header className="shrink-0 h-14 bg-white/95 border-b border-slate-200 px-4 flex items-center justify-between z-30 backdrop-blur-md shadow-xs">
        {/* Left: Back Link & Book Title */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={`/book/${book.slug}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors shrink-0"
            title="Return to book overview"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <div className="h-4 w-px bg-slate-200 shrink-0" />

          <div className="min-w-0">
            <h1 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
              {book.title}
            </h1>
            {currentChapter && (
              <p className="text-[11px] text-emerald-700 font-medium truncate hidden md:block">
                Chapter {currentChapter.chapter_number}: {currentChapter.title}
              </p>
            )}
          </div>
        </div>

        {/* Right: Reader Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Theme Toggles */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setThemeMode("auto")}
              title="Automatic theme (by chapter)"
              className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                themeMode === "auto"
                  ? "bg-white text-emerald-700 font-bold shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Auto
            </button>
            <button
              onClick={() => setThemeMode("light")}
              title="Light Theme"
              className={`p-1.5 rounded transition-colors ${
                themeMode === "light"
                  ? "bg-white text-emerald-700 shadow-xs border border-slate-200/80"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              title="Dark Theme"
              className={`p-1.5 rounded transition-colors ${
                themeMode === "dark"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setThemeMode("sepia")}
              title="Sepia Theme"
              className={`p-1.5 rounded transition-colors ${
                themeMode === "sepia"
                  ? "bg-amber-100 text-amber-900 border border-amber-200 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Spread Mode Toggle (Desktop only) */}
          <button
            onClick={() => setSpreadMode(!spreadMode)}
            title={spreadMode ? "Single Page View" : "Two-Page Spread View"}
            className="hidden lg:flex p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            {spreadMode ? <Columns2 className="w-4 h-4 text-emerald-600" /> : <Square className="w-4 h-4" />}
          </button>

          {/* Zoom Controls */}
          <div className="hidden xl:flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              title="Zoom out"
              className="p-1.5 hover:text-slate-900 text-slate-600 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[11px] text-slate-700 px-1 font-semibold">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              title="Zoom in"
              className="p-1.5 hover:text-slate-900 text-slate-600 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 100 && (
              <button
                onClick={() => setZoomLevel(100)}
                title="Reset zoom"
                className="p-1 text-slate-500 hover:text-amber-700"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Bookmark / Save Toggle */}
          <button
            onClick={() => toggle(bookSlug)}
            title={isBookSaved ? "Saved in your browser" : "Save book for later"}
            aria-label={isBookSaved ? `Remove ${book.title} from saved list` : `Save ${book.title} to saved list`}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer text-xs font-semibold ${
              isBookSaved
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            {isBookSaved ? (
              <BookmarkCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{isBookSaved ? "Saved" : "Save"}</span>
          </button>

          {/* Table of Contents Drawer Trigger */}
          <button
            onClick={() => setIsTocOpen(true)}
            title="Table of Contents"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <List className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">ToC</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* =======================================================================
          2. MAIN CANVAS VIEWPORT (A4 Book Page Display)
         ======================================================================= */}
      <main className="flex-1 relative flex items-center justify-center p-2 sm:p-4 overflow-hidden w-full h-full min-h-0">
        {/* Previous Page Clickable Edge / Button */}
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          title="Previous Page (ArrowLeft)"
          className={`absolute left-2 md:left-4 z-20 p-3 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer ${
            currentPage <= 1 ? "opacity-20 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Book Canvas Container */}
        <div
          className={`flex items-center justify-center gap-4 transition-transform duration-200 w-full h-full max-h-[calc(100vh-125px)] ${
            flipDirection === "next"
              ? "vasuki-flip-enter vasuki-flip-enter-active"
              : flipDirection === "prev"
              ? "vasuki-flip-back-enter vasuki-flip-back-enter-active"
              : ""
          }`}
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Left / Single Page Slot */}
          <div className="h-full max-h-[calc(100vh-125px)] aspect-[210/297] flex items-center justify-center min-w-0 shrink-0">
            {leftPageData ? (
              <VasukiBookPage
                page={leftPageData}
                book={book}
                themeOverride={effectiveThemeOverride}
              />
            ) : (
              <div className="vasuki-book-root w-full h-full flex items-center justify-center">
                <div className="vasuki-page-canvas bg-white border border-slate-200 rounded-sm flex flex-col items-center justify-center p-8 text-center text-slate-500 shadow-sm w-full h-full aspect-[210/297]">
                  <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
                  <p className="text-xs font-mono">Loading Page {currentPage}...</p>
                </div>
              </div>
            )}
          </div>

          {/* Right Page Slot (Spread mode only) */}
          {spreadMode && currentPage + 1 <= totalPages && (
            <div className="h-full max-h-[calc(100vh-125px)] aspect-[210/297] flex items-center justify-center min-w-0 shrink-0">
              {rightPageData ? (
                <VasukiBookPage
                  page={rightPageData}
                  book={book}
                  themeOverride={effectiveThemeOverride}
                />
              ) : (
                <div className="vasuki-book-root w-full h-full flex items-center justify-center">
                  <div className="vasuki-page-canvas bg-white border border-slate-200 rounded-sm flex flex-col items-center justify-center p-8 text-center text-slate-500 shadow-sm w-full h-full aspect-[210/297]">
                    <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin mb-3" />
                    <p className="text-xs font-mono">Loading Page {currentPage + 1}...</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Next Page Clickable Edge / Button */}
        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          title="Next Page (ArrowRight)"
          className={`absolute right-2 md:right-4 z-20 p-3 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer ${
            currentPage >= totalPages ? "opacity-20 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </main>

      {/* =======================================================================
          3. BOTTOM FLOATING CONTROLS & READING SCRUBBER
         ======================================================================= */}
      <footer className="shrink-0 bg-white/95 border-t border-slate-200 px-4 py-2.5 flex flex-col items-center gap-1.5 z-30 backdrop-blur-md shadow-xs">
        {/* Scrubber / Progress Bar */}
        <div className="w-full max-w-2xl flex items-center gap-3">
          <span className="text-[11px] font-mono text-slate-500 font-semibold">1</span>
          <div
            className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden cursor-pointer relative group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const pct = clickX / rect.width;
              const target = Math.round(pct * totalPages);
              goToPage(target);
            }}
          >
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-150"
              style={{ width: `${Math.min(100, (currentPage / totalPages) * 100)}%` }}
            />
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">{totalPages}</span>
        </div>

        {/* Page Selector and Status */}
        <div className="flex items-center gap-3 text-xs">
          <button
            onClick={firstPage}
            disabled={currentPage <= 1}
            className="text-[11px] font-mono text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-semibold"
          >
            First
          </button>
          <span className="text-slate-300">•</span>
          <div className="flex items-center gap-1.5 font-mono text-slate-700">
            <span>Page</span>
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
              className="w-12 bg-slate-50 border border-slate-300 rounded px-1.5 py-0.5 text-center text-xs font-bold text-emerald-700 focus:outline-hidden focus:border-emerald-500 focus:bg-white"
            />
            <span>of {totalPages}</span>
          </div>
          <span className="text-slate-300">•</span>
          <button
            onClick={lastPage}
            disabled={currentPage >= totalPages}
            className="text-[11px] font-mono text-slate-500 hover:text-slate-900 disabled:opacity-30 cursor-pointer font-semibold"
          >
            Last
          </button>
        </div>
      </footer>

      {/* =======================================================================
          4. TABLE OF CONTENTS DRAWER / MODAL
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

            {/* Search Filter */}
            <div className="p-3 border-b border-slate-200 bg-slate-50">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter chapters..."
                  value={tocSearch}
                  onChange={(e) => setTocSearch(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {/* Cover jump item */}
              <button
                onClick={() => {
                  goToPage(1);
                  setIsTocOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                  currentPage === 1
                    ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold"
                    : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900">Cover & Introduction</div>
                    <div className="text-[10.5px] text-slate-500">Publication Title Page</div>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500">p. 1</span>
              </button>

              {/* Chapters */}
              {filteredChapters.map((ch) => {
                // Calculate chapter start page approximation
                const chStartPage = Math.max(1, (ch.chapter_number - 1) * 2 + 2);
                const isCurrent =
                  currentPage >= chStartPage &&
                  currentPage < chStartPage + (ch.page_count || 2);

                return (
                  <button
                    key={ch.chapter_number}
                    onClick={() => {
                      goToPage(chStartPage);
                      setIsTocOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                      isCurrent
                        ? "bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold"
                        : "bg-slate-50 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-800 flex items-center justify-center shrink-0 text-xs font-mono font-bold">
                        {ch.icon ? (
                          <VasukiIcon name={ch.icon} size={14} />
                        ) : (
                          ch.chapter_number
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-semibold">
                          Chapter {ch.chapter_number}
                        </div>
                        <div className="text-xs font-semibold text-slate-900 truncate">
                          {ch.title}
                        </div>
                        {ch.summary && (
                          <div className="text-[10.5px] text-slate-500 truncate mt-0.5">
                            {ch.summary}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-mono text-[11px] text-slate-500">
                        p. {chStartPage}
                      </span>
                      {ch.page_count > 0 && (
                        <div className="text-[9.5px] text-slate-400 font-mono">
                          {ch.page_count} pp
                        </div>
                      )}
                    </div>
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
