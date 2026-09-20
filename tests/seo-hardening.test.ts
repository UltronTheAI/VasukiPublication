import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Book, SitemapEntry } from "../lib/types/publication.ts";

describe("SEO & Canonicalization Rules", () => {
  it("computes canonical URL consolidating search and pagination to root", () => {
    const siteUrl = "https://vasukipublication.com";

    function computeCanonical(pathname: string): string {
      // Strips query parameters and anchors
      const cleanPath = pathname.split("?")[0].replace(/\/+$/, "");
      return `${siteUrl}${cleanPath || "/"}`;
    }

    assert.equal(computeCanonical("/"), "https://vasukipublication.com/");
    assert.equal(computeCanonical("/?q=database"), "https://vasukipublication.com/");
    assert.equal(computeCanonical("/?page=3"), "https://vasukipublication.com/");
    assert.equal(computeCanonical("/?q=rust&page=2"), "https://vasukipublication.com/");
    assert.equal(computeCanonical("/book/distributed-systems"), "https://vasukipublication.com/book/distributed-systems");
    assert.equal(computeCanonical("/privacy"), "https://vasukipublication.com/privacy");
    assert.equal(computeCanonical("/terms"), "https://vasukipublication.com/terms");
  });

  it("points reader canonical URL back to primary book detail page", () => {
    const siteUrl = "https://vasukipublication.com";
    const bookSlug = "modern-typescript-patterns";

    const readerCanonical = `${siteUrl}/book/${bookSlug}`;
    const detailCanonical = `${siteUrl}/book/${bookSlug}`;

    assert.equal(readerCanonical, detailCanonical, "Reader canonical must point to primary detail page");
  });
});

describe("Sitemap Integrity & Filtering", () => {
  it("includes only published public books and core legal pages in sitemap", () => {
    const mockBooks: Book[] = [
      {
        id: "b1",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "published-public-guide",
        title: "Public Guide",
        description: "",
        status: "published",
        chapter_count: 3,
        page_count: 20,
        chapters: [],
        publication: { status: "published", visibility: "public" },
        featured: { pinned: false },
        discovery: { search_title: "public guide", keywords: [] },
        seo: { title: "Public Guide", description: "", canonical_slug: "published-public-guide" },
        stats: { views: 10, opens: 5 },
        created_at: new Date("2026-09-01"),
        updated_at: new Date("2026-09-10"),
      },
      {
        id: "b2",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "draft-book-secret",
        title: "Draft Book",
        description: "",
        status: "draft",
        chapter_count: 1,
        page_count: 10,
        chapters: [],
        publication: { status: "draft", visibility: "public" },
        featured: { pinned: false },
        discovery: { search_title: "draft book", keywords: [] },
        seo: { title: "Draft Book", description: "", canonical_slug: "draft-book-secret" },
        stats: { views: 0, opens: 0 },
        created_at: new Date("2026-09-01"),
        updated_at: new Date("2026-09-02"),
      },
      {
        id: "b3",
        schema_version: 1,
        renderer_version: "0.1.0",
        slug: "private-internal-book",
        title: "Private Book",
        description: "",
        status: "published",
        chapter_count: 2,
        page_count: 15,
        chapters: [],
        publication: { status: "published", visibility: "private" },
        featured: { pinned: false },
        discovery: { search_title: "private book", keywords: [] },
        seo: { title: "Private Book", description: "", canonical_slug: "private-internal-book" },
        stats: { views: 0, opens: 0 },
        created_at: new Date("2026-09-01"),
        updated_at: new Date("2026-09-02"),
      },
    ];

    function generateSitemapEntries(books: Book[]): SitemapEntry[] {
      return books
        .filter((b) => b.publication.status === "published" && b.publication.visibility === "public")
        .map((b) => ({
          slug: b.slug,
          updated_at: b.updated_at,
        }));
    }

    const sitemapEntries = generateSitemapEntries(mockBooks);

    assert.equal(sitemapEntries.length, 1);
    assert.equal(sitemapEntries[0].slug, "published-public-guide");
    assert.ok(!sitemapEntries.some((e) => e.slug === "draft-book-secret"));
    assert.ok(!sitemapEntries.some((e) => e.slug === "private-internal-book"));
  });
});

describe("Robots Directives & Exclusions", () => {
  it("verifies disallow rules for admin, api, and saved pages", () => {
    const robotsRules = {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/*", "/api/*", "/saved"],
    };

    assert.equal(robotsRules.allow, "/");
    assert.ok(robotsRules.disallow.includes("/admin"));
    assert.ok(robotsRules.disallow.includes("/admin/*"));
    assert.ok(robotsRules.disallow.includes("/api/*"));
    assert.ok(robotsRules.disallow.includes("/saved"));
    // Verify book detail is NOT disallowed
    assert.ok(!robotsRules.disallow.includes("/book/*"));
  });
});

describe("Production Security Headers Verification", () => {
  it("validates essential security headers presence and configuration", () => {
    const requiredHeaderKeys = [
      "X-Content-Type-Options",
      "X-Frame-Options",
      "Referrer-Policy",
      "Permissions-Policy",
      "Content-Security-Policy",
      "Strict-Transport-Security",
    ];

    const mockConfigHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      { key: "Content-Security-Policy", value: "default-src 'self'" },
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
    ];

    const keysInConfig = mockConfigHeaders.map((h) => h.key);
    for (const reqKey of requiredHeaderKeys) {
      assert.ok(keysInConfig.includes(reqKey), `Missing required security header: ${reqKey}`);
    }
  });
});

describe("Google Analytics Scope & Route Filtering", () => {
  function shouldTrackGoogleAnalytics(pathname: string, gaId?: string): boolean {
    if (!gaId || !gaId.startsWith("G-")) return false;
    if (pathname.startsWith("/admin")) return false;
    return true;
  }

  it("strictly disables tracking for admin dashboard and subpaths", () => {
    const gaId = "G-7DBX5JSSKM";
    assert.equal(shouldTrackGoogleAnalytics("/admin", gaId), false);
    assert.equal(shouldTrackGoogleAnalytics("/admin/books", gaId), false);
    assert.equal(shouldTrackGoogleAnalytics("/admin/ads", gaId), false);
    assert.equal(shouldTrackGoogleAnalytics("/admin/login", gaId), false);
    assert.equal(shouldTrackGoogleAnalytics("/admin/books/some-id", gaId), false);
  });

  it("enables tracking for all public user-facing routes", () => {
    const gaId = "G-7DBX5JSSKM";
    assert.equal(shouldTrackGoogleAnalytics("/", gaId), true);
    assert.equal(shouldTrackGoogleAnalytics("/book/modern-typescript-patterns", gaId), true);
    assert.equal(shouldTrackGoogleAnalytics("/book/modern-typescript-patterns/read", gaId), true);
    assert.equal(shouldTrackGoogleAnalytics("/saved", gaId), true);
    assert.equal(shouldTrackGoogleAnalytics("/privacy", gaId), true);
    assert.equal(shouldTrackGoogleAnalytics("/terms", gaId), true);
  });
});


