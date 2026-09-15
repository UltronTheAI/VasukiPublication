import crypto from "crypto";

/**
 * Constant-time string comparison to prevent timing attacks on access tokens or webhook secrets.
 */
export function timingSafeCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (typeof a !== "string" || typeof b !== "string") {
    return false;
  }

  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to keep constant time behavior
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

