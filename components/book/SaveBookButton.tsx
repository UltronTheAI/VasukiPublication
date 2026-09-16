"use client";

import React, { useState, useEffect } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useSavedBooks } from "@/lib/hooks/useSavedBooks";
import type { Book } from "@/lib/types/publication";

interface SaveBookButtonProps {
  book: Pick<Book, "id" | "slug" | "title">;
  className?: string;
  variant?: "icon" | "button" | "full";
}

export function SaveBookButton({
  book,
  className = "",
  variant = "button",
}: SaveBookButtonProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { isSaved, toggle } = useSavedBooks();
  const bookSlug = book.slug || book.id;
  const saved = mounted ? isSaved(bookSlug) : false;

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(bookSlug);
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        suppressHydrationWarning
        aria-label={
          saved
            ? `Remove ${book.title} from saved reading list`
            : `Save ${book.title} to reading list`
        }
        title={saved ? "Saved in your browser" : "Save for offline / later"}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          saved
            ? "text-brand-green bg-brand-green/10"
            : "text-mute hover:text-ink hover:bg-canvas-soft"
        } ${className}`}
      >
        {saved ? (
          <BookmarkCheck className="w-4 h-4 text-emerald-600" />
        ) : (
          <Bookmark className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      suppressHydrationWarning
      aria-label={
        saved
          ? `Remove ${book.title} from saved reading list`
          : `Save ${book.title} to reading list`
      }
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-xs font-semibold shadow-2xs cursor-pointer ${
        saved
          ? "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
          : "border-hairline hover:border-hairline-strong bg-white text-ink hover:bg-canvas-soft"
      } ${className}`}
    >
      {saved ? (
        <>
          <BookmarkCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Saved to Queue</span>
        </>
      ) : (
        <>
          <Bookmark className="w-3.5 h-3.5 text-mute" />
          <span>Save for Later</span>
        </>
      )}
    </button>
  );
}
