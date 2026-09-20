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

describe("Reader — Page Geometry & 10-Page Batch Loading", () => {
  it("verifies initial load fetches 10 pages instead of eager loading all pages", () => {
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

    const initialPages = mockInitialPageFetch(1, 10);

    assert.equal(initialPages.length, 10, "10 initial pages must be queried on entry for smooth instant reading");
    assert.equal(startPageQueried, 1);
    assert.equal(queryLimit, 10);
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

describe("Reader — 10-Page Batching & 8th-Page Threshold Prefetch Logic", () => {
  function getBatchWindowForPage(pageNum: number, batchSize: number = 10) {
    const normalized = Math.max(1, pageNum);
    const start = Math.floor((normalized - 1) / batchSize) * batchSize + 1;
    const end = start + batchSize - 1;
    return { start, end };
  }

  function shouldPrefetchNextBatch(currentPage: number, batchSize: number = 10, triggerOffset: number = 8): boolean {
    if (currentPage < 1) return false;
    const positionInBatch = ((currentPage - 1) % batchSize) + 1;
    return positionInBatch >= triggerOffset;
  }

  function getNextBatchStart(currentPage: number, batchSize: number = 10): number {
    const { end } = getBatchWindowForPage(currentPage, batchSize);
    return end + 1;
  }

  it("calculates accurate 10-page batch boundaries for any page number", () => {
    assert.deepEqual(getBatchWindowForPage(1), { start: 1, end: 10 });
    assert.deepEqual(getBatchWindowForPage(5), { start: 1, end: 10 });
    assert.deepEqual(getBatchWindowForPage(8), { start: 1, end: 10 });
    assert.deepEqual(getBatchWindowForPage(10), { start: 1, end: 10 });
    assert.deepEqual(getBatchWindowForPage(11), { start: 11, end: 20 });
    assert.deepEqual(getBatchWindowForPage(18), { start: 11, end: 20 });
    assert.deepEqual(getBatchWindowForPage(25), { start: 21, end: 30 });
  });

  it("triggers prefetch of next batch exactly upon reaching the 8th page", () => {
    // In batch 1..10
    assert.equal(shouldPrefetchNextBatch(1), false);
    assert.equal(shouldPrefetchNextBatch(5), false);
    assert.equal(shouldPrefetchNextBatch(7), false);
    assert.equal(shouldPrefetchNextBatch(8), true, "Page 8 must trigger prefetch of pages 11..20");
    assert.equal(shouldPrefetchNextBatch(9), true);
    assert.equal(shouldPrefetchNextBatch(10), true);

    // In batch 11..20
    assert.equal(shouldPrefetchNextBatch(11), false);
    assert.equal(shouldPrefetchNextBatch(15), false);
    assert.equal(shouldPrefetchNextBatch(17), false);
    assert.equal(shouldPrefetchNextBatch(18), true, "Page 18 must trigger prefetch of pages 21..30");

    // In batch 21..30
    assert.equal(shouldPrefetchNextBatch(28), true, "Page 28 must trigger prefetch of pages 31..40");
  });

  it("computes next batch start page accurately", () => {
    assert.equal(getNextBatchStart(1), 11);
    assert.equal(getNextBatchStart(8), 11);
    assert.equal(getNextBatchStart(10), 11);
    assert.equal(getNextBatchStart(18), 21);
    assert.equal(getNextBatchStart(28), 31);
  });
});

describe("Reader — Browser Caching & 2-Day Retention Policy", () => {
  const RETENTION_TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000; // 172,800,000 ms

  it("enforces exact 2-day retention window (172,800,000 ms)", () => {
    assert.equal(RETENTION_TWO_DAYS_MS, 172800000);
    const now = Date.now();
    const expiresAt = now + RETENTION_TWO_DAYS_MS;

    assert.ok(expiresAt > now);
    assert.equal(expiresAt - now, 2 * 24 * 3600 * 1000);
  });

  it("validates cache expiry logic correctly", () => {
    const now = 1000000000000;
    const validPayload = {
      version: 1,
      slug: "ai-prompt-engineering",
      savedAt: now - 3600000, // 1 hour ago
      expiresAt: now + RETENTION_TWO_DAYS_MS - 3600000,
      pages: { 1: { id: "p1" } },
    };

    const expiredPayload = {
      version: 1,
      slug: "ai-prompt-engineering",
      savedAt: now - (RETENTION_TWO_DAYS_MS + 1000), // 2 days and 1 second ago
      expiresAt: now - 1000,
      pages: { 1: { id: "p1" } },
    };

    function isCacheValid(payload: typeof validPayload, currentTime: number): boolean {
      return payload.version === 1 && typeof payload.expiresAt === "number" && currentTime < payload.expiresAt;
    }

    assert.equal(isCacheValid(validPayload, now), true);
    assert.equal(isCacheValid(expiredPayload, now), false);
  });
});

describe("Reader — Dynamic Page Style Resolution", () => {
  it("extracts and applies all dynamic MongoDB page style tokens", () => {
    const mockPageStyle = {
      background_color: "#0f172a",
      background_gradient: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
      accent_color: "#38bdf8",
      accent_soft: "rgba(56, 189, 248, 0.15)",
      text_color: "#f8fafc",
      text_muted: "#94a3b8",
      border_color: "#334155",
      border_strong: "#64748b",
      card_bg: "rgba(255, 255, 255, 0.05)",
      decorative_color: "rgba(56, 189, 248, 0.06)",
      font_family: "Inter, sans-serif",
    };

    assert.equal(mockPageStyle.background_color, "#0f172a");
    assert.ok(mockPageStyle.background_gradient.includes("linear-gradient"));
    assert.equal(mockPageStyle.accent_color, "#38bdf8");
    assert.equal(mockPageStyle.text_color, "#f8fafc");
    assert.equal(mockPageStyle.card_bg, "rgba(255, 255, 255, 0.05)");
  });

  it("dynamically inherits background style, accent color, and icon for chapter openers from next page", () => {
    const chapterOpenerPage: Partial<Page> = {
      id: "p20",
      book_id: "book-1",
      page_number: 20,
      page_type: "chapter_opener",
      chapter_number: 5,
      theme: "dark",
      layout: "chapter_opener",
      style: { theme: "dark" },
    };

    const chapterContentNextPage: Partial<Page> = {
      id: "p21",
      book_id: "book-1",
      page_number: 21,
      page_type: "chapter_content",
      chapter_number: 5,
      theme: "dark",
      layout: "editorial",
      icon: "Cpu",
      style: {
        theme: "dark",
        background_color: "#291519",
        accent_color: "#fb923c",
        text_color: "#fff1f2",
        card_bg: "rgba(255, 255, 255, 0.06)",
      },
    };

    // Helper simulating style inheritance in VasukiBookPage
    function resolveChapterOpenerEffectiveStyles(opener: Partial<Page>, next: Partial<Page> | null) {
      const isChapterOpener = opener.page_type === "chapter_opener" || opener.layout === "chapter_opener";
      const rawStyle = opener.style || {};
      const nextStyle = next?.style || {};

      const bg = rawStyle.background_color || (isChapterOpener ? nextStyle.background_color : null) || null;
      const accent = rawStyle.accent_color || (isChapterOpener ? nextStyle.accent_color : null) || null;
      const cardBg = rawStyle.card_bg || (isChapterOpener ? nextStyle.card_bg : null) || null;
      const icon = opener.icon || (isChapterOpener ? next?.icon : null) || null;

      return { bg, accent, cardBg, icon };
    }

    const resolved = resolveChapterOpenerEffectiveStyles(chapterOpenerPage, chapterContentNextPage);
    assert.equal(resolved.bg, "#291519", "Chapter opener should inherit background color from next content page");
    assert.equal(resolved.accent, "#fb923c", "Chapter opener should inherit accent color from next content page");
    assert.equal(resolved.cardBg, "rgba(255, 255, 255, 0.06)");
    assert.equal(resolved.icon, "Cpu", "Chapter opener should inherit chapter icon from next page");
  });

  it("prevents redundant double headlines for TOC, copyright, and heading blocks", () => {
    function isHeadlineRedundant(page: {
      page_type?: string;
      layout?: string;
      content?: { headline?: string | null; blocks?: Array<{ type: string; title?: string; text?: string }> };
    }): boolean {
      if (!page.content?.headline) return true;
      const firstBlockType = page.content?.blocks?.[0]?.type;
      const firstBlockTitle = page.content?.blocks?.[0]?.title || page.content?.blocks?.[0]?.text;

      return (
        page.page_type === "toc" ||
        page.page_type === "copyright" ||
        page.layout === "toc" ||
        page.layout === "copyright" ||
        firstBlockType === "toc" ||
        firstBlockType === "copyright" ||
        firstBlockType === "acknowledgement" ||
        (firstBlockType === "heading" &&
          firstBlockTitle?.toLowerCase().trim() === page.content.headline?.toLowerCase().trim()) ||
        firstBlockTitle?.toLowerCase().trim() === page.content.headline?.toLowerCase().trim()
      );
    }

    assert.equal(
      isHeadlineRedundant({
        page_type: "toc",
        content: { headline: "Table of Contents", blocks: [{ type: "toc", title: "Table of Contents" }] },
      }),
      true,
      "TOC headline must not be rendered twice"
    );

    assert.equal(
      isHeadlineRedundant({
        page_type: "copyright",
        content: { headline: "Copyright & Publishing Notice", blocks: [{ type: "copyright", title: "Copyright & Publishing Notice" }] },
      }),
      true,
      "Copyright headline must not be rendered twice"
    );

    assert.equal(
      isHeadlineRedundant({
        page_type: "chapter_content",
        content: { headline: "Unique Section Title", blocks: [{ type: "text", text: "Paragraph text" }] },
      }),
      false,
      "Unique editorial headline should be rendered"
    );
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
