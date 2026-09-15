/**
 * Safe URL validation and hostname extraction utilities.
 */

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);
const FORBIDDEN_PATTERNS = [/javascript:/i, /data:/i, /vbscript:/i, /file:/i];

/**
 * Validates that a string is a safe HTTP/HTTPS URL with no executable or malicious schemes.
 */
export function isSafeUrl(urlString: string | null | undefined): boolean {
  if (!urlString || typeof urlString !== "string") {
    return false;
  }

  const trimmed = urlString.trim();
  if (FORBIDDEN_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return false;
  }

  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

export const isValidHttpUrl = isSafeUrl;

/**
 * Safely extracts the domain hostname from a URL string (e.g. "github.com").
 * Returns an empty string if the URL is invalid or malformed.
 */
export function getSafeHostname(urlString: string | null | undefined): string {
  if (!isSafeUrl(urlString)) {
    return "";
  }

  try {
    const parsed = new URL(urlString!.trim());
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

/**
 * Ensures an external link opens safely with secure attributes.
 */
export const EXTERNAL_LINK_PROPS = {
  target: "_blank",
  rel: "noopener noreferrer nofollow",
} as const;

