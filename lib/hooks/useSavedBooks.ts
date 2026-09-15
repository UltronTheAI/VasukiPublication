"use client";

import { useSyncExternalStore, useCallback, useMemo } from "react";

export const SAVED_BOOKS_STORAGE_KEY = "vasuki.savedBooks.v1";
export const LEGACY_STORAGE_KEY = "vasuki_saved_books";
export const SAVED_BOOKS_EVENT = "vasuki-saved-books-changed";

export interface SavedBooksPayload {
  version: number;
  books: string[];
}

/**
 * Safely parses and normalizes the stored saved books JSON from localStorage.
 * Handles migration from legacy keys and gracefully recovers from malformed data.
 */
export function parseSavedBooks(raw: string | null): string[] {
  if (!raw || typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw);

    // Standard version 1 schema: { version: 1, books: ["slug1", "slug2"] }
    if (parsed && typeof parsed === "object" && Array.isArray(parsed.books)) {
      return Array.from(
        new Set(
          parsed.books
            .filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
            .map((s: string) => s.trim())
        )
      );
    }

    // Direct string array fallback
    if (Array.isArray(parsed)) {
      return Array.from(
        new Set(
          parsed
            .filter((item: unknown): item is string => typeof item === "string" && item.trim().length > 0)
            .map((s: string) => s.trim())
        )
      );
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Serializes the slug array into the canonical version 1 storage shape.
 */
export function serializeSavedBooks(books: string[]): string {
  const payload: SavedBooksPayload = {
    version: 1,
    books: Array.from(new Set(books.filter(Boolean))),
  };
  return JSON.stringify(payload);
}

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("storage", callback);
  window.addEventListener(SAVED_BOOKS_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SAVED_BOOKS_EVENT, callback);
  };
}

function getSnapshot(): string {
  if (typeof window === "undefined") return serializeSavedBooks([]);

  try {
    let raw = localStorage.getItem(SAVED_BOOKS_STORAGE_KEY);

    // Automatic migration from legacy key if modern key is absent
    if (!raw) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        const migratedList = parseSavedBooks(legacy);
        const modernJson = serializeSavedBooks(migratedList);
        localStorage.setItem(SAVED_BOOKS_STORAGE_KEY, modernJson);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        raw = modernJson;
      }
    }

    return raw || serializeSavedBooks([]);
  } catch {
    return serializeSavedBooks([]);
  }
}

function getServerSnapshot(): string {
  return serializeSavedBooks([]);
}

/**
 * High-performance, multi-tab synchronized React hook for local anonymous saved books.
 * Powered by React 19 `useSyncExternalStore` for hydration safety.
 */
export function useSavedBooks() {
  const rawState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const savedSlugs = useMemo(() => parseSavedBooks(rawState), [rawState]);

  const notifyChange = useCallback((nextList: string[]) => {
    try {
      localStorage.setItem(SAVED_BOOKS_STORAGE_KEY, serializeSavedBooks(nextList));
      window.dispatchEvent(new Event(SAVED_BOOKS_EVENT));
    } catch {
      // LocalStorage quota or permission error handled silently
    }
  }, []);

  const isSaved = useCallback(
    (slugOrId?: string | null): boolean => {
      if (!slugOrId) return false;
      const clean = slugOrId.trim();
      return savedSlugs.includes(clean);
    },
    [savedSlugs]
  );

  const save = useCallback(
    (slugOrId: string) => {
      if (!slugOrId) return;
      const clean = slugOrId.trim();
      if (!clean || savedSlugs.includes(clean)) return;

      const next = [...savedSlugs, clean];
      notifyChange(next);
    },
    [savedSlugs, notifyChange]
  );

  const remove = useCallback(
    (slugOrId: string) => {
      if (!slugOrId) return;
      const clean = slugOrId.trim();
      if (!savedSlugs.includes(clean)) return;

      const next = savedSlugs.filter((s) => s !== clean);
      notifyChange(next);
    },
    [savedSlugs, notifyChange]
  );

  const toggle = useCallback(
    (slugOrId: string): boolean => {
      if (!slugOrId) return false;
      const clean = slugOrId.trim();
      if (savedSlugs.includes(clean)) {
        remove(clean);
        return false;
      } else {
        save(clean);
        return true;
      }
    },
    [savedSlugs, save, remove]
  );

  const clear = useCallback(() => {
    notifyChange([]);
  }, [notifyChange]);

  return {
    savedSlugs,
    isSaved,
    save,
    remove,
    toggle,
    clear,
    count: savedSlugs.length,
  };
}

