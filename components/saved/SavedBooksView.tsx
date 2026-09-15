"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Bookmark, Compass, Trash2, ArrowRight, BookOpen, AlertCircle } from "lucide-react";
import { useSavedBooks } from "@/lib/hooks/useSavedBooks";
import { BookCard } from "@/components/book/BookCard";
import { NativeAdBanner } from "@/components/ads/NativeAdBanner";
import { NativeAdSidebar } from "@/components/ads/NativeAdSidebar";
import type { Book, Cover, Ad } from "@/lib/types/publication";

interface SavedBooksViewProps {
  bannerAd?: Ad | null;
  sidebarAd?: Ad | null;
}

export function SavedBooksView({ bannerAd, sidebarAd }: SavedBooksViewProps) {
  const { savedSlugs, clear, count } = useSavedBooks();
  const [fetchedData, setFetchedData] = useState<{
    books: Book[];
    covers: Record<string, Cover>;
  }>({
    books: [],
    covers: {},
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;

    if (savedSlugs.length === 0) {
      return;
    }

    fetch("/api/books/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: savedSlugs }),
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setFetchedData({
          books: data.books || [],
          covers: data.covers || {},
        });
      })
      .catch((err) => {
        console.error("Failed to load saved books batch:", err);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [savedSlugs]);

  const books = count === 0 ? [] : fetchedData.books;
  const covers = count === 0 ? {} : fetchedData.covers;
  const isLoading = count > 0 && loading && books.length === 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Ad if configured */}
      {bannerAd && (
        <div className="w-full">
          <NativeAdBanner ad={bannerAd} />
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-brand-green flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Saved Publications
            </h1>
            {count > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-canvas-soft border border-hairline text-mute">
                {count} {count === 1 ? "book" : "books"}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-mute max-w-xl">
            Publications saved in your local browser for offline reference and instant access. No account or sync required.
          </p>
        </div>

        {count > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your saved publications?")) {
                  clear();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-hairline hover:border-red-200 bg-white hover:bg-red-50 text-xs font-medium text-mute hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Layout with optional Sidebar Ad */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className={sidebarAd ? "lg:col-span-3 space-y-6" : "lg:col-span-4 space-y-6"}>
          {/* A. Loading Skeleton State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-hairline p-5 bg-white space-y-4 animate-pulse"
                >
                  <div className="w-full aspect-[210/297] max-h-56 bg-canvas-soft rounded-lg" />
                  <div className="h-4 bg-canvas-soft rounded w-3/4" />
                  <div className="h-3 bg-canvas-soft rounded w-1/2" />
                </div>
              ))}
            </div>
          )}

          {/* B. Empty State */}
          {!isLoading && count === 0 && (
            <div className="w-full bg-white border border-hairline rounded-2xl p-12 text-center flex flex-col items-center justify-center shadow-xs my-6">
              <div className="w-14 h-14 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-mute mb-4">
                <Bookmark className="w-6 h-6 text-mute" />
              </div>
              <h2 className="text-lg font-bold text-ink mb-1.5">
                No saved publications yet
              </h2>
              <p className="text-xs sm:text-sm text-mute max-w-md mb-6 leading-relaxed">
                Your reading list is empty. Browse the public collection and bookmark books to revisit them anytime from this browser.
              </p>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-white hover:bg-black text-xs font-semibold transition-all shadow-xs"
              >
                <Compass className="w-4 h-4 text-brand-green" />
                <span>Explore Publications</span>
                <ArrowRight className="w-3.5 h-3.5 opacity-70" />
              </Link>
            </div>
          )}

          {/* C. Stale Cleanup Notice */}
          {!isLoading && count > 0 && books.length < count && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  {count - books.length} saved {count - books.length === 1 ? "publication is" : "publications are"} currently unpublished or unavailable.
                </span>
              </div>
              <button
                onClick={() => {
                  // Reconcile saved list to only available books
                  const activeSlugs = books.map((b) => b.slug);
                  localStorage.setItem(
                    "vasuki.savedBooks.v1",
                    JSON.stringify({ version: 1, books: activeSlugs })
                  );
                  window.dispatchEvent(new Event("vasuki-saved-books-changed"));
                }}
                className="text-[11px] font-semibold text-amber-800 underline hover:text-amber-950 cursor-pointer"
              >
                Clean stale entries
              </button>
            </div>
          )}

          {/* D. Loaded Book Cards Grid */}
          {!isLoading && books.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {books.map((book) => {
                const cover = covers[book.id || book._id || ""] || null;
                return (
                  <BookCard
                    key={book.slug}
                    book={book}
                    cover={cover}
                  />
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar Ad Slot */}
        {sidebarAd && (
          <aside className="lg:col-span-1 space-y-6">
            <div className="sticky top-20">
              <NativeAdSidebar ad={sidebarAd} />

              {/* Privacy Badge info */}
              <div className="mt-6 p-4 rounded-xl border border-hairline bg-canvas-soft text-[11px] text-mute space-y-1.5">
                <div className="font-semibold text-ink flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-brand-green" />
                  <span>Privacy Guarantee</span>
                </div>
                <p className="leading-relaxed">
                  Saved books live exclusively on this device. We do not store your reading list on our servers, run tracking cookies, or require accounts.
                </p>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
