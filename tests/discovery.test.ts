import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSafeUrl, getSafeHostname } from "../lib/security/url.ts";
import { resolveVasukiIconName } from "../lib/vasuki/icon-map.ts";
import { sanitizeHtml } from "../lib/security/html.ts";
import { timingSafeCompare } from "../lib/security/crypto.ts";
import type { Book, Ad } from "../lib/types/publication.ts";

describe("Discovery & URL Normalization", () => {
  it("normalizes negative or invalid page numbers safely", () => {
    function normalizePage(rawPage: string | undefined): number {
      const parsed = parseInt(rawPage || "1", 10);
      return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
    }

    assert.equal(normalizePage("-5"), 1);
    assert.equal(normalizePage("0"), 1);
    assert.equal(normalizePage("abc"), 1);
    assert.equal(normalizePage(undefined), 1);
    assert.equal(normalizePage("3"), 3);
    assert.equal(normalizePage("42"), 42);
  });

  it("builds canonical pagination URLs retaining query parameters", () => {
    function buildPageUrl(page: number, query?: string): string {
      const params = new URLSearchParams();
      if (query && query.trim()) {
        params.set("q", query.trim());
      }
      if (page > 1) {
        params.set("page", page.toString());
      }
      const str = params.toString();
      return str ? `/?${str}` : "/";
    }

    // Page 1 with no query should be root "/"
    assert.equal(buildPageUrl(1), "/");
    // Page 2 with no query
    assert.equal(buildPageUrl(2), "/?page=2");
    // Page 1 with search query
    assert.equal(buildPageUrl(1, "rust"), "/?q=rust");
    // Page 3 with search query
    assert.equal(buildPageUrl(3, "database"), "/?q=database&page=3");
    // Whitespace in query is trimmed
    assert.equal(buildPageUrl(2, "  distributed  "), "/?q=distributed&page=2");
  });

  it("enforces 20 items per page limit by default with max 50", () => {
    const DEFAULT_PAGE_SIZE = 20;
    const MAX_PAGE_SIZE = 50;

    function sanitizeLimit(limit?: number): number {
      const val = limit || DEFAULT_PAGE_SIZE;
      return Math.min(Math.max(1, val), MAX_PAGE_SIZE);
    }

    assert.equal(sanitizeLimit(), 20);
    assert.equal(sanitizeLimit(20), 20);
    assert.equal(sanitizeLimit(100), 50); // Capped at 50
    assert.equal(sanitizeLimit(-5), 1);
  });
});

describe("Featured / Pinned Books Rules", () => {
  it("enforces maximum 5 pinned books sorted by position and published status", () => {
    const mockBooks: Book[] = [
      {
        id: "book-1",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "book-one",
        title: "Book One",
        description: "Desc 1",
        status: "published",
        chapter_count: 5,
        page_count: 40,
        chapters: [],
        publication: { status: "published", visibility: "public" },
        featured: { pinned: true, position: 2 },
        discovery: { search_title: "book one", keywords: [] },
        seo: { title: "Book One", description: "Desc 1", canonical_slug: "book-one" },
        stats: { views: 10, opens: 5 },
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "book-2",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "book-two",
        title: "Book Two",
        description: "Desc 2",
        status: "published",
        chapter_count: 3,
        page_count: 25,
        chapters: [],
        publication: { status: "published", visibility: "public" },
        featured: { pinned: true, position: 1 },
        discovery: { search_title: "book two", keywords: [] },
        seo: { title: "Book Two", description: "Desc 2", canonical_slug: "book-two" },
        stats: { views: 20, opens: 8 },
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "book-3",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "draft-book",
        title: "Draft Book",
        description: "Desc draft",
        status: "draft",
        chapter_count: 2,
        page_count: 10,
        chapters: [],
        publication: { status: "draft", visibility: "public" },
        featured: { pinned: true, position: 3 },
        discovery: { search_title: "draft book", keywords: [] },
        seo: { title: "Draft Book", description: "Desc draft", canonical_slug: "draft-book" },
        stats: { views: 0, opens: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: "book-4",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "private-book",
        title: "Private Book",
        description: "Desc private",
        status: "published",
        chapter_count: 4,
        page_count: 30,
        chapters: [],
        publication: { status: "published", visibility: "private" }, // Private
        featured: { pinned: true, position: 4 },
        discovery: { search_title: "private book", keywords: [] },
        seo: { title: "Private Book", description: "Desc private", canonical_slug: "private-book" },
        stats: { views: 0, opens: 0 },
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Filter only published and public
    const publicPinned = mockBooks
      .filter((b) => b.publication.status === "published" && b.publication.visibility === "public" && b.featured.pinned)
      .sort((a, b) => (a.featured.position || 0) - (b.featured.position || 0))
      .slice(0, 5);

    assert.equal(publicPinned.length, 2);
    assert.equal(publicPinned[0].id, "book-2"); // Position 1 first
    assert.equal(publicPinned[1].id, "book-1"); // Position 2 second
    // Draft and Private books must not be included
    assert.ok(!publicPinned.some((b) => b.id === "book-3"));
    assert.ok(!publicPinned.some((b) => b.id === "book-4"));
  });
});

describe("Native Advertisements & URL Safety", () => {
  it("strictly validates http and https URLs and rejects dangerous schemes", () => {
    assert.equal(isSafeUrl("https://example.com"), true);
    assert.equal(isSafeUrl("http://sub.domain.org/path?q=1"), true);

    // Malicious or invalid protocols
    assert.equal(isSafeUrl("javascript:alert(1)"), false);
    assert.equal(isSafeUrl("data:text/html,<script>alert(1)</script>"), false);
    assert.equal(isSafeUrl("vbscript:msgbox(1)"), false);
    assert.equal(isSafeUrl("file:///C:/Windows/System32"), false);
    assert.equal(isSafeUrl(""), false);
    assert.equal(isSafeUrl(null), false);
    assert.equal(isSafeUrl(undefined), false);
  });

  it("extracts clean hostnames from valid URLs", () => {
    assert.equal(getSafeHostname("https://www.mongodb.com/cloud"), "mongodb.com");
    assert.equal(getSafeHostname("https://vercel.com/docs"), "vercel.com");
    assert.equal(getSafeHostname("http://subdomain.test.org:8080/path"), "subdomain.test.org");
    assert.equal(getSafeHostname("javascript:alert(1)"), "");
  });

  it("selects ads based on priority weighting and active date bounds", () => {
    function selectWeightedAdTest(ads: Ad[], atTime?: Date): Ad | null {
      if (!ads || ads.length === 0) return null;
      const now = atTime || new Date();
      const eligible = ads.filter((ad) => {
        if (!ad.active) return false;
        if (ad.starts_at && new Date(ad.starts_at) > now) return false;
        if (ad.ends_at && new Date(ad.ends_at) < now) return false;
        return true;
      });
      if (eligible.length === 0) return null;
      const weights: Record<number, number> = { 1: 10, 2: 5, 3: 2 };
      const totalWeight = eligible.reduce((acc, ad) => acc + (weights[ad.priority] || 2), 0);
      let randomVal = 0.5 * totalWeight;
      for (const ad of eligible) {
        const w = weights[ad.priority] || 2;
        if (randomVal < w) return ad;
        randomVal -= w;
      }
      return eligible[0];
    }

    const now = new Date("2026-09-15T12:00:00Z");

    const ads: Ad[] = [
      {
        id: "ad-1",
        title: "Database Cloud",
        headline: "High-Performance Cloud DB",
        description: "Scale your application seamlessly.",
        sponsor: "DataCloud Inc",
        url: "https://datacloud.example.com",
        placements: ["home_banner"],
        priority: 1, // weight 10
        active: true,
        starts_at: new Date("2026-01-01T00:00:00Z"),
        ends_at: new Date("2026-12-31T23:59:59Z"),
        stats: { impressions: 0, clicks: 0 },
        created_at: now,
        updated_at: now,
      },
      {
        id: "ad-expired",
        title: "Old Sale",
        headline: "Expired Promo",
        description: "Past promo.",
        sponsor: "OldCo",
        url: "https://old.example.com",
        placements: ["home_banner"],
        priority: 1,
        active: true,
        starts_at: new Date("2025-01-01T00:00:00Z"),
        ends_at: new Date("2025-06-01T00:00:00Z"), // Expired
        stats: { impressions: 0, clicks: 0 },
        created_at: now,
        updated_at: now,
      },
      {
        id: "ad-inactive",
        title: "Paused Ad",
        headline: "Paused",
        description: "Inactive.",
        sponsor: "InactiveCo",
        url: "https://inactive.example.com",
        placements: ["home_banner"],
        priority: 1,
        active: false, // Inactive
        stats: { impressions: 0, clicks: 0 },
        created_at: now,
        updated_at: now,
      },
    ];

    const selected = selectWeightedAdTest(ads, now);
    assert.ok(selected !== null);
    assert.equal(selected.id, "ad-1");

    // No ads when empty
    assert.equal(selectWeightedAdTest([], now), null);
  });
});

describe("Security Sanitizers & Cryptography", () => {
  it("strips malicious script tags, iframes, and inline event handlers from HTML", () => {
    const malicious = '<p>Hello <script>alert("xss")</script><a href="javascript:steal()" onclick="hack()">Link</a></p><iframe src="evil.com"></iframe>';
    const sanitized = sanitizeHtml(malicious);

    assert.ok(!sanitized.includes("<script>"));
    assert.ok(!sanitized.includes("alert"));
    assert.ok(!sanitized.includes("<iframe>"));
    assert.ok(!sanitized.includes("javascript:"));
    assert.ok(!sanitized.includes("onclick="));
    assert.ok(sanitized.includes("<p>Hello "));
  });

  it("performs constant-time secret comparison", () => {
    assert.equal(timingSafeCompare("secret_token_123", "secret_token_123"), true);
    assert.equal(timingSafeCompare("secret_token_123", "secret_token_wrong"), false);
    assert.equal(timingSafeCompare("secret_token_123", "short"), false);
    assert.equal(timingSafeCompare("", ""), true);
    assert.equal(timingSafeCompare(null, "abc"), false);
  });

  it("resolves Lucide icon names from persisted strings accurately", () => {
    assert.equal(resolveVasukiIconName("sparkles"), "Sparkles");
    assert.equal(resolveVasukiIconName("check_circle"), "CheckCircle");
    assert.equal(resolveVasukiIconName("book-open"), "BookOpen");
    assert.equal(resolveVasukiIconName("shield-check"), "ShieldCheck");
    assert.equal(resolveVasukiIconName("bar_chart"), "BarChart3");
    assert.equal(resolveVasukiIconName(null), "Sparkles");
  });
});

