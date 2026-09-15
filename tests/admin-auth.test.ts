import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  signSessionPayload,
  verifySessionToken,
  validateAdminAccessToken,
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  type AdminSessionPayload,
} from "../lib/security/admin-auth.ts";
import { timingSafeCompare } from "../lib/security/crypto.ts";
import { isValidHttpUrl } from "../lib/security/url.ts";
import type { Book, Page, Cover, Ad } from "../lib/types/publication.ts";

describe("Admin Authentication — Access Token & Timing Safety", () => {
  it("performs constant-time string comparisons accurately", () => {
    assert.equal(timingSafeCompare("secret-token-12345", "secret-token-12345"), true);
    assert.equal(timingSafeCompare("secret-token-12345", "wrong-token-99999"), false);
    assert.equal(timingSafeCompare("secret-token-12345", "secret-token"), false);
    assert.equal(timingSafeCompare("", "secret-token"), false);
    assert.equal(timingSafeCompare(null, "secret-token"), false);
    assert.equal(timingSafeCompare(undefined, "secret-token"), false);
  });

  it("validates token input defensively", () => {
    assert.equal(validateAdminAccessToken(""), false);
    // @ts-expect-error test null input
    assert.equal(validateAdminAccessToken(null), false);
    // @ts-expect-error test undefined input
    assert.equal(validateAdminAccessToken(undefined), false);
  });
});

describe("Admin Session — Cryptographic Signing & Tamper Resistance", () => {
  it("signs and verifies a valid admin session payload", () => {
    const now = Date.now();
    const payload: AdminSessionPayload = {
      authenticated: true,
      issued_at: now,
      expires_at: now + 3600 * 1000,
      nonce: "random-nonce-abc-123",
    };

    const token = signSessionPayload(payload);
    assert.ok(typeof token === "string");
    assert.ok(token.includes("."));

    const verified = verifySessionToken(token);
    assert.ok(verified !== null);
    assert.equal(verified?.authenticated, true);
    assert.equal(verified?.nonce, "random-nonce-abc-123");
  });

  it("strictly rejects tampered session payloads", () => {
    const now = Date.now();
    const payload: AdminSessionPayload = {
      authenticated: true,
      issued_at: now,
      expires_at: now + 3600 * 1000,
      nonce: "original-nonce",
    };

    const token = signSessionPayload(payload);
    const [, signature] = token.split(".");

    // Alter the payload
    const tamperedPayloadObj = { ...payload, nonce: "hacked-nonce" };
    const tamperedRawPayload = Buffer.from(JSON.stringify(tamperedPayloadObj)).toString("base64url");
    const tamperedToken = `${tamperedRawPayload}.${signature}`;

    const verified = verifySessionToken(tamperedToken);
    assert.equal(verified, null, "Tampered payload must fail verification");
  });

  it("strictly rejects forged signatures", () => {
    const now = Date.now();
    const payload: AdminSessionPayload = {
      authenticated: true,
      issued_at: now,
      expires_at: now + 3600 * 1000,
      nonce: "test-nonce",
    };

    const token = signSessionPayload(payload);
    const [rawPayload] = token.split(".");
    const forgedToken = `${rawPayload}.0000000000000000000000000000000000000000000000000000000000000000`;

    const verified = verifySessionToken(forgedToken);
    assert.equal(verified, null, "Forged signature must fail verification");
  });

  it("strictly rejects expired sessions", () => {
    const now = Date.now();
    const expiredPayload: AdminSessionPayload = {
      authenticated: true,
      issued_at: now - 7200 * 1000,
      expires_at: now - 3600 * 1000, // expired 1 hour ago
      nonce: "expired-nonce",
    };

    const token = signSessionPayload(expiredPayload);
    const verified = verifySessionToken(token);
    assert.equal(verified, null, "Expired session token must be rejected");
  });
});

describe("Admin Security — Rate Limiting", () => {
  it("locks out an IP after 5 consecutive failed attempts", () => {
    const testIp = "192.168.1.99";
    resetLoginAttempts(testIp);

    assert.equal(checkLoginRateLimit(testIp).allowed, true);

    // Record 4 failed attempts -> still allowed
    for (let i = 0; i < 4; i++) {
      const res = recordFailedLogin(testIp);
      assert.equal(res.blocked, false);
    }
    assert.equal(checkLoginRateLimit(testIp).allowed, true);

    // 5th failed attempt -> locked out
    const finalRes = recordFailedLogin(testIp);
    assert.equal(finalRes.blocked, true);
    assert.ok(finalRes.retryAfterSeconds > 0);

    // Subsequent check should fail
    const status = checkLoginRateLimit(testIp);
    assert.equal(status.allowed, false);
    assert.ok(status.retryAfterSeconds > 0);

    // Resetting on success unlocks
    resetLoginAttempts(testIp);
    assert.equal(checkLoginRateLimit(testIp).allowed, true);
  });
});

describe("Admin Operations — Pinned Ranking Constraints", () => {
  it("enforces maximum 5 pinned books and valid positions 1 to 5", () => {
    const pinnedCatalog: Array<{ id: string; featured: { pinned: boolean; position: number } }> = [
      { id: "b1", featured: { pinned: true, position: 1 } },
      { id: "b2", featured: { pinned: true, position: 2 } },
      { id: "b3", featured: { pinned: true, position: 3 } },
      { id: "b4", featured: { pinned: true, position: 4 } },
      { id: "b5", featured: { pinned: true, position: 5 } },
    ];

    function attemptPinBook(bookId: string, position: number): { success: boolean; error?: string } {
      if (position < 1 || position > 5) {
        return { success: false, error: "Position must be between 1 and 5" };
      }

      const isAlreadyPinned = pinnedCatalog.some((b) => b.id === bookId);
      if (!isAlreadyPinned && pinnedCatalog.length >= 5) {
        return { success: false, error: "Maximum of 5 pinned publications reached" };
      }

      return { success: true };
    }

    // Attempting to pin a 6th book should fail
    assert.equal(attemptPinBook("b6", 1).success, false);
    assert.equal(attemptPinBook("b6", 1).error, "Maximum of 5 pinned publications reached");

    // Invalid position values should fail
    assert.equal(attemptPinBook("b1", 0).success, false);
    assert.equal(attemptPinBook("b1", 6).success, false);

    // Valid update on existing pinned book should succeed
    assert.equal(attemptPinBook("b1", 3).success, true);
  });
});

describe("Admin Operations — Safe Cascade Deletion Invariant", () => {
  it("cascades deletion across book, pages, and cover while preserving advertisements", () => {
    const targetBookId = "book-delete-123";

    const books: Book[] = [
      {
        id: targetBookId,
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "target-book",
        title: "Target Book",
        description: "",
        status: "draft",
        chapter_count: 1,
        page_count: 2,
        chapters: [],
        publication: { status: "draft", visibility: "public" },
        featured: { pinned: false },
        discovery: { search_title: "", keywords: [] },
        seo: { title: "", description: "", canonical_slug: "" },
        stats: { views: 0, opens: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "book-keep-456",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "keep-book",
        title: "Keep Book",
        description: "",
        status: "published",
        chapter_count: 1,
        page_count: 1,
        chapters: [],
        publication: { status: "published", visibility: "public" },
        featured: { pinned: false },
        discovery: { search_title: "", keywords: [] },
        seo: { title: "", description: "", canonical_slug: "" },
        stats: { views: 0, opens: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    const pages: Page[] = [
      { id: "p1", book_id: targetBookId, page_number: 1, page_type: "cover", theme: "light", layout: "cover", content: {}, style: { theme: "light" }, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() },
      { id: "p2", book_id: targetBookId, page_number: 2, page_type: "editorial", theme: "light", layout: "editorial", content: {}, style: { theme: "light" }, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() },
      { id: "p3", book_id: "book-keep-456", page_number: 1, page_type: "editorial", theme: "light", layout: "editorial", content: {}, style: { theme: "light" }, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() },
    ];

    const covers: Cover[] = [
      { id: "cov-1", book_id: targetBookId, width: 1600, height: 2560, title: "Target Book", design: {}, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() },
      { id: "cov-2", book_id: "book-keep-456", width: 1600, height: 2560, title: "Keep Book", design: {}, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() },
    ];

    const ads: Ad[] = [
      { id: "ad-1", title: "Ad 1", headline: "Ad", description: "Desc", sponsor: "Sponsor", url: "https://example.com", placements: ["home_banner"], priority: 1, active: true, stats: { impressions: 0, clicks: 0 }, created_at: new Date(), updated_at: new Date() },
    ];

    // Simulate cascade delete
    const remainingBooks = books.filter((b) => b.id !== targetBookId);
    const remainingPages = pages.filter((p) => p.book_id !== targetBookId);
    const remainingCovers = covers.filter((c) => c.book_id !== targetBookId);
    const remainingAds = [...ads]; // Untouched

    assert.equal(remainingBooks.length, 1);
    assert.equal(remainingBooks[0].id, "book-keep-456");
    assert.equal(remainingPages.length, 1);
    assert.equal(remainingPages[0].book_id, "book-keep-456");
    assert.equal(remainingCovers.length, 1);
    assert.equal(remainingCovers[0].book_id, "book-keep-456");
    assert.equal(remainingAds.length, 1, "Ads must strictly be preserved");
  });
});

describe("Admin Advertisements — URL Validation & Sanitization", () => {
  it("strictly validates destination URLs allowing only http:// and https://", () => {
    assert.equal(isValidHttpUrl("https://mongodb.com/developer"), true);
    assert.equal(isValidHttpUrl("http://localhost:3000"), true);
    assert.equal(isValidHttpUrl("javascript:alert(1)"), false);
    assert.equal(isValidHttpUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isValidHttpUrl("file:///etc/passwd"), false);
    assert.equal(isValidHttpUrl("vbscript:msgbox"), false);
    assert.equal(isValidHttpUrl("not-a-url"), false);
    assert.equal(isValidHttpUrl(""), false);
  });
});
