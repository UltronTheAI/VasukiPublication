/**
 * HTML Sanitization architecture and safety primitives.
 * Defends against stored Cross-Site Scripting (XSS) from persisted content and external feeds.
 */

const DANGEROUS_TAGS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<meta\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi,
];

const DANGEROUS_ATTRIBUTES = [
  /\s+on[a-z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, // on* event handlers (onclick, onload, onerror, etc.)
  /\s+href\s*=\s*(?:['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, // href="javascript:..."
  /\s+src\s*=\s*(?:['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi, // src="javascript:..."
  /\s+data\s*=\s*(?:['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi,
  /\s+formaction\s*=\s*(?:['"]\s*javascript:[^'"]*['"]|javascript:[^\s>]+)/gi,
];

/**
 * Strips known dangerous HTML tags, inline event listeners, and javascript: protocols.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") {
    return "";
  }

  let sanitized = rawHtml;

  // 1. Strip dangerous tags
  for (const pattern of DANGEROUS_TAGS) {
    sanitized = sanitized.replace(pattern, "");
  }

  // 2. Strip event handler attributes and javascript: schemes
  for (const pattern of DANGEROUS_ATTRIBUTES) {
    sanitized = sanitized.replace(pattern, "");
  }

  return sanitized;
}

/**
 * Extracts clean fragment HTML from potentially full HTML documents,
 * stripping <!DOCTYPE>, <html>, <head>, <title>, and <body> wrappers
 * so the markup can be safely embedded inside DOM containers without hydration issues.
 */
export function extractCleanPageHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== "string") return "";

  let cleaned = rawHtml;

  // If document contains <body>...</body>, extract the body inner content
  const bodyMatch = cleaned.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    cleaned = bodyMatch[1];
  } else {
    cleaned = cleaned
      .replace(/<!DOCTYPE[^>]*>/gi, "")
      .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, "")
      .replace(/<title\b[^<]*(?:(?!<\/title>)<[^<]*)*<\/title>/gi, "")
      .replace(/<\/?(?:html|body)\b[^>]*>/gi, "");
  }

  return sanitizeHtml(cleaned).trim();
}

/**
 * Escapes plain text for safe insertion into HTML strings.
 */
export function escapeHtml(text: string): string {
  if (!text || typeof text !== "string") return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

