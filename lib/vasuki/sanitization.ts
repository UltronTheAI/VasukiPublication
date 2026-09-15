import { sanitizeHtml } from "@/lib/security/html";
import type { Page, Cover } from "@/lib/types/publication";

/**
 * Sanitizes pre-rendered HTML on a book page document before passing to renderer.
 */
export function sanitizePageHtml(page: Page): string {
  if (!page.html) return "";
  return sanitizeHtml(page.html);
}

/**
 * Sanitizes pre-rendered HTML on a cover document.
 */
export function sanitizeCoverHtml(cover: Cover): string {
  if (!cover.html) return "";
  return sanitizeHtml(cover.html);
}

export { sanitizeHtml };

