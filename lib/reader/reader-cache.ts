import type { Page } from "@/lib/types/publication";

export const CACHE_VERSION = 1;
export const CACHE_PREFIX = "vasuki_reader_pages_v";
export const RETENTION_TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds = 172,800,000 ms
export const DEFAULT_BATCH_SIZE = 10;
export const DEFAULT_TRIGGER_PAGE_OFFSET = 8; // Reaching the 8th page of a 10-page chunk triggers next batch

export interface ReaderBrowserCachePayload {
  version: number;
  slug: string;
  savedAt: number;
  expiresAt: number;
  pages: Record<number, Page>;
}

export function getReaderCacheKey(slug: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${slug.trim().toLowerCase()}`;
}

/**
 * Load cached pages for a specific book slug from browser localStorage if not expired.
 * Enforces 2-day retention policy.
 */
export function loadPagesFromBrowserCache(slug: string): Record<number, Page> | null {
  if (typeof window === "undefined" || !slug) return null;

  try {
    const raw = localStorage.getItem(getReaderCacheKey(slug));
    if (!raw) return null;

    const payload: ReaderBrowserCachePayload = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || payload.version !== CACHE_VERSION) {
      localStorage.removeItem(getReaderCacheKey(slug));
      return null;
    }

    // Check 2-day retention expiry
    const now = Date.now();
    if (typeof payload.expiresAt === "number" && now >= payload.expiresAt) {
      localStorage.removeItem(getReaderCacheKey(slug));
      return null;
    }

    if (payload.pages && typeof payload.pages === "object") {
      return payload.pages;
    }

    return null;
  } catch {
    // localStorage disabled, quota exceeded, or corrupted
    return null;
  }
}

/**
 * Save pages to browser localStorage with 2-day retention.
 * Merges existing cached pages with newly received pages.
 */
export function savePagesToBrowserCache(
  slug: string,
  newPages: Record<number, Page> | Page[]
): void {
  if (typeof window === "undefined" || !slug) return;

  try {
    const existing = loadPagesFromBrowserCache(slug) || {};
    const merged: Record<number, Page> = { ...existing };

    if (Array.isArray(newPages)) {
      for (const p of newPages) {
        if (p && typeof p.page_number === "number") {
          merged[p.page_number] = p;
        }
      }
    } else if (newPages && typeof newPages === "object") {
      for (const [key, p] of Object.entries(newPages)) {
        const num = parseInt(key, 10);
        if (p && Number.isFinite(num)) {
          merged[num] = p;
        }
      }
    }

    const now = Date.now();
    const payload: ReaderBrowserCachePayload = {
      version: CACHE_VERSION,
      slug: slug.trim().toLowerCase(),
      savedAt: now,
      expiresAt: now + RETENTION_TWO_DAYS_MS,
      pages: merged,
    };

    localStorage.setItem(getReaderCacheKey(slug), JSON.stringify(payload));
  } catch {
    // localStorage full or restricted
  }
}

/**
 * Clean up all expired book caches across localStorage.
 */
export function cleanExpiredBrowserPageCaches(): void {
  if (typeof window === "undefined") return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const payload = JSON.parse(raw);
            if (payload && typeof payload.expiresAt === "number" && now >= payload.expiresAt) {
              keysToRemove.push(key);
            }
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }

    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
  } catch {
    // Storage access exception
  }
}

/**
 * Calculate the batch boundaries [start, end] containing a given page number.
 * e.g. for page 1 -> [1, 10], page 8 -> [1, 10], page 11 -> [11, 20], page 25 -> [21, 30]
 */
export function getBatchWindowForPage(
  pageNum: number,
  batchSize: number = DEFAULT_BATCH_SIZE
): { start: number; end: number } {
  const normalized = Math.max(1, pageNum);
  const start = Math.floor((normalized - 1) / batchSize) * batchSize + 1;
  const end = start + batchSize - 1;
  return { start, end };
}

/**
 * Determine if reaching currentPage should trigger prefetching the next batch of pages.
 * e.g. Reaching page 8 in batch [1..10], page 18 in batch [11..20], page 28 in batch [21..30]
 */
export function shouldPrefetchNextBatch(
  currentPage: number,
  batchSize: number = DEFAULT_BATCH_SIZE,
  triggerOffset: number = DEFAULT_TRIGGER_PAGE_OFFSET
): boolean {
  if (currentPage < 1) return false;
  const positionInBatch = ((currentPage - 1) % batchSize) + 1;
  return positionInBatch >= triggerOffset;
}

/**
 * Compute the next batch starting page number.
 * e.g. for page 8 in [1..10] -> returns 11
 * for page 18 in [11..20] -> returns 21
 */
export function getNextBatchStart(
  currentPage: number,
  batchSize: number = DEFAULT_BATCH_SIZE
): number {
  const { end } = getBatchWindowForPage(currentPage, batchSize);
  return end + 1;
}

