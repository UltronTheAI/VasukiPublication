"use client";

import React, { useSyncExternalStore } from "react";
import { Bookmark, Check } from "lucide-react";
import type { Book } from "@/lib/types/publication";

interface SaveBookButtonProps {
  book: Book;
  className?: string;
  variant?: "icon" | "button" | "full";
}

const STORAGE_KEY = "vasuki_saved_books";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", callback);
  window.addEventListener("vasuki-saved-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("vasuki-saved-change", callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return "[]";
  try {
    return localStorage.getItem(STORAGE_KEY) || "[]";
  } catch {
    return "[]";
  }
}

function getServerSnapshot(): string {
  return "[]";
}

export function SaveBookButton({
  book,
  className = "",
  variant = "button",
}: SaveBookButtonProps) {
  const savedJson = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  
  let isSaved = false;
  try {
    const list = JSON.parse(savedJson) as string[];
    isSaved = Array.isArray(list) && list.includes(book.slug || book.id);
  } catch {
    isSaved = false;
  }

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const bookKey = book.slug || book.id;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let list: string[] = stored ? JSON.parse(stored) : [];

      if (list.includes(bookKey)) {
        list = list.filter((k) => k !== bookKey);
      } else {
        list.push(bookKey);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event("vasuki-saved-change"));
    } catch {
      // Ignore localStorage errors
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={isSaved ? `Remove ${book.title} from saved reading list` : `Save ${book.title} to reading list`}
        title={isSaved ? "Saved to reading queue" : "Save for offline / later"}
        className={`p-1.5 rounded-md transition-colors cursor-pointer ${
          isSaved
            ? "text-brand-green bg-brand-green/10"
            : "text-mute hover:text-ink hover:bg-canvas-soft"
        } ${className}`}
      >
        <Bookmark className={`w-4 h-4 ${isSaved ? "fill-current" : ""}`} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={isSaved ? `Remove ${book.title} from saved reading list` : `Save ${book.title} to reading list`}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-xs font-semibold shadow-2xs cursor-pointer ${
        isSaved
          ? "border-brand-green/30 bg-emerald-50 text-emerald-900 hover:bg-emerald-100"
          : "border-hairline hover:border-hairline-strong bg-white text-ink hover:bg-canvas-soft"
      } ${className}`}
    >
      {isSaved ? (
        <>
          <Check className="w-3.5 h-3.5 text-brand-green" />
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

