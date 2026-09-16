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
  ZoomIn,
  ZoomOut,
  Bookmark,
  BookmarkCheck,
  Search,
  X,
  Sparkles,
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
  // Compute Current Left & Right Pages
  // Rule:
  // - Page 1 is ALWAYS single (Cover)
  // - Last page is single if standalone
  // - Inside pages show as facing pair (Even on left, Odd on right)
  // ---------------------------------------------------------------------------
  const isCoverPage = currentPage === 1;
  const effectiveLeftPageNum = isCoverPage
    ? 1
    : spreadMode
    ? currentPage % 2 === 0
      ? currentPage
      : currentPage - 1
    : currentPage;

  const effectiveRightPageNum =
    spreadMode && !isCoverPage && effectiveLeftPageNum + 1 <= totalPages
      ? effectiveLeftPageNum + 1
      : null;

  // ---------------------------------------------------------------------------
  // Active page loader & Prefetch trigger
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      const targets: number[] = [effectiveLeftPageNum];
      if (effectiveRightPageNum) {
        targets.push(effectiveRightPageNum);
      }

      // Prefetch upcoming pages (next 2-4 pages)
      const upcomingStart = effectiveRightPageNum ? effectiveRightPageNum + 1 : effectiveLeftPageNum + 1;
      for (let i = 0; i < 3; i++) {
        const p = upcomingStart + i;
        if (p <= totalPages) {
          targets.push(p);
        }
      }

      // Prefetch previous pages
      if (effectiveLeftPageNum > 1) {
        targets.push(effectiveLeftPageNum - 1);
        if (effectiveLeftPageNum > 2) {
          targets.push(effectiveLeftPageNum - 2);
        }
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
  }, [effectiveLeftPageNum, effectiveRightPageNum, totalPages, book.slug]);

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
    if (currentPage <= 1) return;
    if (!spreadMode) {
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
    if (!spreadMode) {
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
      suppressHydrationWarning
    >
      {/* =======================================================================
          1. TOP READER NAVBAR (Polished, Clean Branding & Controls)
         ======================================================================= */}
      <header className="shrink-0 h-16 bg-white/95 border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between z-30 backdrop-blur-md shadow-xs select-none">
        {/* Left: Overview Back Button & Book Title Branding */}
        <div className="flex items-center gap-3 min-w-0 max-w-[32%] sm:max-w-[36%]">
          <Link
            href={`/book/${book.slug}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            title="Return to book overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Overview</span>
          </Link>

          <div className="h-5 w-px bg-slate-200 shrink-0 hidden sm:block" />

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {book.title}
            </h1>
          </div>
        </div>

        {/* Center: Shifted Professional Page Navigation Pill */}
        <div className="flex items-center justify-center shrink-0">
          <div className="flex items-center bg-slate-100/90 border border-slate-200 rounded-lg p-1 shadow-2xs">
            <button
              onClick={prevPage}
              disabled={currentPage <= 1}
              title="Previous Page (ArrowLeft)"
              className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 px-2.5 text-xs font-mono font-medium text-slate-700">
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
                className="w-11 bg-white border border-slate-300 rounded px-1.5 py-0.5 text-center text-xs font-bold text-emerald-700 focus:outline-hidden focus:border-emerald-500 shadow-2xs"
                suppressHydrationWarning
              />
              <span className="text-slate-400">/</span>
              <span className="font-semibold text-slate-800">{totalPages}</span>
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage >= totalPages}
              title="Next Page (ArrowRight)"
              className="p-1.5 rounded-md hover:bg-white text-slate-700 hover:text-slate-900 disabled:opacity-25 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right: Separate Zoom Controls, Display Mode, ToC, Bookmark & Fullscreen */}
        <div className="flex items-center justify-end gap-2 max-w-[32%] sm:max-w-[36%] shrink-0">
          {/* Zoom Controls Separate */}
          <div className="hidden md:flex items-center bg-slate-100 border border-slate-200 rounded-lg p-0.5 text-xs shadow-2xs">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              title="Zoom Out"
              className="p-1.5 rounded hover:bg-white text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
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
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Two-Page Spread View Toggle (Desktop only) */}
          <button
            onClick={() => setSpreadMode(!spreadMode)}
            title={spreadMode ? "Switch to Single Page View" : "Switch to Two-Page Spread View"}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            <List className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Contents</span>
          </button>

          {/* Bookmark / Save Button */}
          <button
            onClick={() => toggle(bookSlug)}
            title={isBookSaved ? "Saved in your browser" : "Save book for later"}
            aria-label={isBookSaved ? `Remove ${book.title} from saved list` : `Save ${book.title} to saved list`}
            className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
              isBookSaved
                ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                : "bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200"
            }`}
          >
            {isBookSaved ? (
              <BookmarkCheck className="w-4 h-4 text-emerald-600" />
            ) : (
              <Bookmark className="w-4 h-4 text-slate-600" />
            )}
            <span className="hidden xl:inline">{isBookSaved ? "Saved" : "Save"}</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize className="w-4 h-4 text-emerald-600" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* =======================================================================
          2. MAIN CANVAS VIEWPORT (A4 Book Page Display)
         ======================================================================= */}
      <main className="flex-1 relative flex items-center justify-center p-3 sm:p-6 overflow-hidden w-full h-full min-h-0">
        {/* Previous Page Clickable Edge / Button */}
        <button
          onClick={prevPage}
          disabled={currentPage <= 1}
          title="Previous Page (ArrowLeft)"
          className={`absolute left-3 md:left-6 z-20 p-3 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer ${
            currentPage <= 1 ? "opacity-20 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Book Canvas Container */}
        <div
          className={`flex items-center justify-center gap-5 transition-transform duration-200 w-full h-full max-h-[calc(100vh-84px)] ${
            flipDirection === "next"
              ? "vasuki-flip-enter vasuki-flip-enter-active"
              : flipDirection === "prev"
              ? "vasuki-flip-back-enter vasuki-flip-back-enter-active"
              : ""
          }`}
          style={{ transform: `scale(${zoomLevel / 100})` }}
        >
          {/* Left Page Slot */}
          <div className="h-full max-h-[calc(100vh-84px)] aspect-[210/297] flex items-center justify-center min-w-0 shrink-0">
            {leftPageData ? (
              <VasukiBookPage
                page={leftPageData}
                book={book}
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

          {/* Right Page Slot (Spread mode only when not on Cover or standalone last page) */}
          {rightPageData && (
            <div className="h-full max-h-[calc(100vh-84px)] aspect-[210/297] flex items-center justify-center min-w-0 shrink-0">
              <VasukiBookPage
                page={rightPageData}
                book={book}
              />
            </div>
          )}
        </div>

        {/* Next Page Clickable Edge / Button */}
        <button
          onClick={nextPage}
          disabled={currentPage >= totalPages}
          title="Next Page (ArrowRight)"
          className={`absolute right-3 md:right-6 z-20 p-3 rounded-full bg-white/95 border border-slate-200 text-slate-700 hover:text-slate-950 hover:bg-white hover:scale-105 transition-all shadow-md cursor-pointer ${
            currentPage >= totalPages ? "opacity-20 pointer-events-none" : "opacity-90 hover:opacity-100"
          }`}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
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
                    <div className="text-xs font-semibold text-slate-900">Cover & Title</div>
                    <div className="text-[10.5px] text-slate-500">Publication Cover Page</div>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-slate-500">p. 1</span>
              </button>

              {/* Chapters */}
              {filteredChapters.map((ch) => {
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
