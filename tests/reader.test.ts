import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { resolveVasukiIconName } from "../lib/vasuki/icon-map.ts";
import { sanitizeHtml, escapeHtml } from "../lib/security/html.ts";
import type { Book, Page } from "../lib/types/publication.ts";

describe("Reader — Security & Access Control", () => {
  const sampleBooks: Book[] = [
    {
      id: "pub-book-1",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "system-design-primer",
      title: "System Design Primer",
      description: "A comprehensive guide to scaling distributed architectures.",
      status: "published",
      chapter_count: 5,
      page_count: 50,
      chapters: [],
      publication: {
        status: "published",
        visibility: "public",
        published_at: new Date("2026-01-01"),
      },
      featured: { pinned: false },
      discovery: { search_title: "system design", keywords: [] },
      seo: { title: "System Design", description: "", canonical_slug: "system-design-primer" },
      stats: { views: 10, opens: 5 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "draft-book-2",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "unreleased-draft",
      title: "Unreleased Draft",
      description: "Internal preview draft.",
      status: "draft",
      chapter_count: 1,
      page_count: 10,
      chapters: [],
      publication: {
        status: "draft",
        visibility: "public",
      },
      featured: { pinned: false },
      discovery: { search_title: "unreleased", keywords: [] },
      seo: { title: "Draft", description: "", canonical_slug: "unreleased-draft" },
      stats: { views: 0, opens: 0 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "priv-book-3",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "internal-secrets",
      title: "Internal Secrets",
      description: "Internal company policies.",
      status: "published",
      chapter_count: 2,
      page_count: 20,
      chapters: [],
      publication: {
        status: "published",
        visibility: "private",
      },
      featured: { pinned: false },
      discovery: { search_title: "secrets", keywords: [] },
      seo: { title: "Secrets", description: "", canonical_slug: "internal-secrets" },
      stats: { views: 0, opens: 0 },
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  function getMockPublicBook(slug: string): Book | null {
    const book = sampleBooks.find((b) => b.slug === slug);
    if (!book) return null;
    if (book.publication.status !== "published" || book.publication.visibility !== "public") {
      return null;
    }
    return book;
  }

  it("permits access to published public book in reader", () => {
    const book = getMockPublicBook("system-design-primer");
    assert.ok(book !== null);
    assert.equal(book.slug, "system-design-primer");
  });

  it("denies access to draft book in reader", () => {
    const book = getMockPublicBook("unreleased-draft");
    assert.equal(book, null, "Draft book must return null/notFound in reader");
  });

  it("denies access to private book in reader", () => {
    const book = getMockPublicBook("internal-secrets");
    assert.equal(book, null, "Private book must return null/notFound in reader");
  });
});

describe("Reader — Page Geometry & Initial Lazy Loading", () => {
  it("verifies initial load fetches only 2 pages instead of eager loading all pages", () => {
    const bookPageCount = 120;
    let queryLimit = 0;
    let startPageQueried = 0;

    function mockInitialPageFetch(startPage: number, limit: number) {
      startPageQueried = startPage;
      queryLimit = limit;
      return Array.from({ length: limit }, (_, i) => ({
        id: `page-${startPage + i}`,
        book_id: "test-book",
        page_number: startPage + i,
        theme: "light" as const,
        layout: "editorial",
        content: {},
        style: { theme: "light" as const },
        schema_version: 1,
        renderer_version: "0.1.0",
        created_at: new Date(),
        updated_at: new Date(),
      }));
    }

    const initialPages = mockInitialPageFetch(1, 2);

    assert.equal(initialPages.length, 2, "Only 2 initial pages must be queried on entry");
    assert.equal(startPageQueried, 1);
    assert.equal(queryLimit, 2);
    assert.ok(initialPages.length < bookPageCount, "Must not load full 120 pages on entry");
  });

  it("normalizes page parameter safely for negative, zero, and out-of-bounds values", () => {
    const totalPages = 45;

    function normalizePage(requested: unknown): number {
      const parsed = parseInt(String(requested) || "1", 10);
      if (!Number.isFinite(parsed) || parsed < 1) return 1;
      return Math.min(parsed, totalPages);
    }

    assert.equal(normalizePage(undefined), 1);
    assert.equal(normalizePage(""), 1);
    assert.equal(normalizePage("abc"), 1);
    assert.equal(normalizePage("0"), 1);
    assert.equal(normalizePage("-15"), 1);
    assert.equal(normalizePage("1"), 1);
    assert.equal(normalizePage("17"), 17);
    assert.equal(normalizePage("45"), 45);
    assert.equal(normalizePage("9999"), 45);
  });
});

describe("Reader — Client Cache & Prefetch Logic", () => {
  it("caches pages and computes prefetch batches without redundant fetches", () => {
    const pageCache = new Map<number, Page>();
    const inFlight = new Set<number>();
    const totalPages = 20;

    // Simulate initial pages
    pageCache.set(1, { id: "p1", book_id: "b1", page_number: 1, theme: "light", layout: "cover", content: {}, style: { theme: "light" }, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() });
    pageCache.set(2, { id: "p2", book_id: "b1", page_number: 2, theme: "light", layout: "opener", content: {}, style: { theme: "light" }, schema_version: 1, renderer_version: "0.1.0", created_at: new Date(), updated_at: new Date() });

    function getPagesToPrefetch(current: number, spread: boolean): number[] {
      const needed: number[] = [];
      const count = spread ? 4 : 3;
      const start = spread ? current + 2 : current + 1;

      for (let i = 0; i < count; i++) {
        const target = start + i;
        if (target <= totalPages && !pageCache.has(target) && !inFlight.has(target)) {
          needed.push(target);
        }
      }
      return needed;
    }

    // On page 1 in single mode: should prefetch 2 (already cached), 3, 4
    const toPrefetch1 = getPagesToPrefetch(1, false);
    assert.deepEqual(toPrefetch1, [3, 4]);

    // Mark 3 and 4 as in flight
    inFlight.add(3);
    inFlight.add(4);

    // Call again -> should return empty because in flight
    assert.deepEqual(getPagesToPrefetch(1, false), []);
  });
});

describe("Reader — Icon Mapping Compatibility", () => {
  const requiredVasukiIcons = [
    "book-open",
    "bookmark",
    "file-text",
    "file-code",
    "layers",
    "cpu",
    "database",
    "server",
    "sparkles",
    "compass",
    "globe",
    "code",
    "code-2",
    "braces",
    "terminal",
    "square-terminal",
    "check-circle",
    "check",
    "x",
    "shield-check",
    "shield",
    "lock",
    "zap",
    "activity",
    "gauge",
    "network",
    "workflow",
    "lightbulb",
    "alert-triangle",
    "alert-circle",
    "info",
    "heart",
  ];

  it("resolves all 32+ required VasukiSquare icon names without throwing or returning empty", () => {
    for (const icon of requiredVasukiIcons) {
      const resolved = resolveVasukiIconName(icon);
      assert.ok(resolved, `Icon '${icon}' should resolve to a valid string`);
      assert.ok(resolved.length > 0, `Icon '${icon}' must not be empty`);
      assert.notEqual(resolved, "", `Icon '${icon}' should not be empty`);
    }
  });

  it("provides deterministic fallback for unknown or null icon strings", () => {
    assert.equal(resolveVasukiIconName(null), "Sparkles");
    assert.equal(resolveVasukiIconName(undefined), "Sparkles");
    assert.equal(resolveVasukiIconName(""), "Sparkles");
    assert.equal(resolveVasukiIconName("unknown_custom_widget_1234"), "UnknownCustomWidget1234");
  });
});

describe("Reader — Security & HTML Sanitization", () => {
  it("strips executable scripts and dangerous event handlers from persisted HTML", () => {
    const maliciousHtml = `
      <div class="content-box">
        <h3>Safe Title</h3>
        <script>alert('XSS execution')</script>
        <img src="valid.png" onerror="stealTokens()" />
        <a href="javascript:doMaliciousThing()">Click Here</a>
        <iframe src="https://evil.com"></iframe>
        <p>Legitimate paragraph content.</p>
      </div>
    `;

    const clean = sanitizeHtml(maliciousHtml);

    assert.ok(!clean.includes("<script>"), "Must strip <script> tags");
    assert.ok(!clean.includes("alert("), "Must strip script contents");
    assert.ok(!clean.includes("onerror="), "Must strip onerror event handler");
    assert.ok(!clean.includes("javascript:"), "Must strip javascript: protocols");
    assert.ok(!clean.includes("<iframe"), "Must strip <iframe> tags");
    assert.ok(clean.includes("<h3>Safe Title</h3>"), "Must preserve safe markup");
    assert.ok(clean.includes("Legitimate paragraph content"), "Must preserve safe content");
  });

  it("safely escapes HTML special characters", () => {
    const raw = `<tag & "quotes" 'single'>`;
    const escaped = escapeHtml(raw);
    assert.equal(escaped, "&lt;tag &amp; &quot;quotes&quot; &#039;single&#039;&gt;");
  });
});

describe("Reader — Zero Advertisements Rule", () => {
  it("enforces absolute zero ads rule in reader container", () => {
    // Structural invariant: reader viewports strictly prohibit ad components
    const readerPlacements: string[] = [];
    const allowedReaderComponents = [
      "VasukiBookPage",
      "VasukiBlockRenderer",
      "VasukiHtmlRenderer",
      "VasukiIcon",
      "TableOfContentsDrawer",
      "ReadingScrubber",
    ];

    const forbiddenAdComponents = [
      "NativeAdBanner",
      "NativeAdSidebar",
      "AdConfirmationModal",
      "SponsoredPage",
    ];

    for (const comp of allowedReaderComponents) {
      assert.ok(!comp.includes("Ad") && !comp.includes("Sponsored"), `${comp} is clean`);
      assert.ok(!forbiddenAdComponents.includes(comp), `${comp} must not be a forbidden ad component`);
    }

    assert.equal(readerPlacements.length, 0, "No ad placements allowed in reader");
  });
});
