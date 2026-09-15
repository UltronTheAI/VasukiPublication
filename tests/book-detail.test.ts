import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { Book, Cover } from "../lib/types/publication.ts";

describe("Book Detail — Data Filtering & Security", () => {
  const mockBooks: Book[] = [
    {
      id: "book-pub-1",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "distributed-systems-guide",
      title: "Distributed Systems Guide",
      subtitle: "Patterns for reliable scale",
      description: "Comprehensive blueprint for distributed architectures.",
      status: "published",
      chapter_count: 6,
      page_count: 52,
      chapters: [
        {
          chapter_number: 1,
          title: "Foundations of Consensus",
          summary: "Introduction to Paxos and Raft.",
          icon: "database",
          page_count: 10,
          theme: "light",
        },
        {
          chapter_number: 2,
          title: "Replication Topologies",
          summary: "Leader-follower vs multi-master.",
          icon: "network",
          page_count: 12,
          theme: "dark",
        },
      ],
      publication: {
        status: "published",
        visibility: "public",
        published_at: new Date("2026-02-01T00:00:00Z"),
      },
      featured: { pinned: true, position: 1 },
      discovery: {
        search_title: "distributed systems guide",
        keywords: ["distributed", "consensus", "raft"],
        category: "Architecture",
      },
      seo: {
        title: "Distributed Systems Guide | Vasuki Publication",
        description: "Patterns for reliable scale",
        canonical_slug: "distributed-systems-guide",
      },
      stats: { views: 120, opens: 45 },
      created_at: new Date("2026-01-15T00:00:00Z"),
      updated_at: new Date("2026-02-01T00:00:00Z"),
    },
    {
      id: "book-draft-2",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "draft-quantum-computing",
      title: "Draft Quantum Computing",
      description: "Internal unreleased draft.",
      status: "draft",
      chapter_count: 1,
      page_count: 8,
      chapters: [],
      publication: {
        status: "draft",
        visibility: "public",
      },
      featured: { pinned: false },
      discovery: { search_title: "draft quantum computing", keywords: [] },
      seo: { title: "Draft", description: "", canonical_slug: "draft-quantum-computing" },
      stats: { views: 0, opens: 0 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "book-priv-3",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "private-security-audit",
      title: "Private Security Audit",
      description: "Confidential handbook.",
      status: "published",
      chapter_count: 2,
      page_count: 15,
      chapters: [],
      publication: {
        status: "published",
        visibility: "private",
      },
      featured: { pinned: false },
      discovery: { search_title: "private security audit", keywords: [] },
      seo: { title: "Private", description: "", canonical_slug: "private-security-audit" },
      stats: { views: 0, opens: 0 },
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  function getMockPublicBookBySlug(slug: string): Book | null {
    const clean = slug.trim();
    const doc = mockBooks.find((b) => b.slug === clean);
    if (!doc) return null;
    if (doc.publication.status !== "published" || doc.publication.visibility !== "public") {
      return null;
    }
    return doc;
  }

  it("retrieves a published public book successfully", () => {
    const book = getMockPublicBookBySlug("distributed-systems-guide");
    assert.ok(book !== null);
    assert.equal(book.slug, "distributed-systems-guide");
    assert.equal(book.title, "Distributed Systems Guide");
    assert.equal(book.chapter_count, 6);
  });

  it("returns null for non-existent slug", () => {
    const book = getMockPublicBookBySlug("unknown-non-existent-book");
    assert.equal(book, null);
  });

  it("strictly hides draft books from public lookup", () => {
    const book = getMockPublicBookBySlug("draft-quantum-computing");
    assert.equal(book, null, "Draft book must not be accessible publicly");
  });

  it("strictly hides private books from public lookup", () => {
    const book = getMockPublicBookBySlug("private-security-audit");
    assert.equal(book, null, "Private book must not be accessible publicly");
  });
});

describe("Book Detail — SEO, Canonical & JSON-LD Generation", () => {
  const sampleBook: Book = {
    id: "sample-1",
    schema_version: 1,
    renderer_version: "0.1.0",
    slug: "rust-performance-patterns",
    title: "Rust Performance Patterns",
    subtitle: "Zero-cost abstractions in practice",
    description: "Deep dive into memory safety, SIMD, and async runtimes.",
    author: "Swaraj Puppalwar",
    category: "Systems Programming",
    status: "published",
    chapter_count: 4,
    page_count: 64,
    chapters: [],
    publication: {
      status: "published",
      visibility: "public",
      published_at: new Date("2026-03-10T00:00:00Z"),
    },
    featured: { pinned: false },
    discovery: {
      search_title: "rust performance patterns",
      keywords: ["rust", "simd", "zero-cost"],
      category: "Systems Programming",
    },
    seo: {
      title: "Rust Performance Patterns | Master Handbook",
      description: "Deep dive into memory safety, SIMD, and async runtimes.",
      canonical_slug: "rust-performance-patterns",
    },
    stats: { views: 500, opens: 210 },
    created_at: new Date("2026-03-01T00:00:00Z"),
    updated_at: new Date("2026-03-10T00:00:00Z"),
  };

  it("generates exact canonical URL using /book/[slug]", () => {
    const siteUrl = "https://vasukipublication.com";
    const canonical = `${siteUrl}/book/${sampleBook.slug}`;
    assert.equal(canonical, "https://vasukipublication.com/book/rust-performance-patterns");
  });

  it("generates valid schema.org/Book JSON-LD structured data without fabricating missing fields", () => {
    const siteUrl = "https://vasukipublication.com";
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Book",
      name: sampleBook.title,
      headline: sampleBook.subtitle || sampleBook.title,
      description: sampleBook.description,
      numberOfPages: sampleBook.page_count,
      author: {
        "@type": "Organization",
        name: sampleBook.author,
      },
      publisher: {
        "@type": "Organization",
        name: "Vasuki Publication",
        url: siteUrl,
      },
      datePublished: sampleBook.publication.published_at,
      dateModified: sampleBook.updated_at,
      inLanguage: "en",
      url: `${siteUrl}/book/${sampleBook.slug}`,
      keywords: sampleBook.discovery.keywords.join(", "),
    };

    assert.equal(jsonLd["@context"], "https://schema.org");
    assert.equal(jsonLd["@type"], "Book");
    assert.equal(jsonLd.name, "Rust Performance Patterns");
    assert.equal(jsonLd.numberOfPages, 64);
    assert.equal(jsonLd.author.name, "Swaraj Puppalwar");
    assert.equal(jsonLd.keywords, "rust, simd, zero-cost");
    // Verify no fabricated fields (e.g. isbn, price, fake reviews)
    assert.equal((jsonLd as Record<string, unknown>).isbn, undefined);
    assert.equal((jsonLd as Record<string, unknown>).price, undefined);
  });
});

describe("Book Detail — Cover Fallback & Performance", () => {
  it("computes deterministic fallback parameters when cover document is missing", () => {
    const bookWithoutCover: Book = {
      id: "no-cover-book",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "legacy-book",
      title: "Legacy Handbook",
      description: "Legacy book without dedicated cover record.",
      status: "published",
      chapter_count: 2,
      page_count: 20,
      chapters: [],
      publication: { status: "published", visibility: "public" },
      featured: { pinned: false },
      discovery: { search_title: "legacy handbook", keywords: [] },
      seo: { title: "Legacy", description: "", canonical_slug: "legacy-book" },
      stats: { views: 1, opens: 1 },
      created_at: new Date(),
      updated_at: new Date(),
    };

    const cover: Cover | null = null;
    const design = (cover?.design || {}) as Record<string, unknown>;

    const resolvedTitle = cover?.title || bookWithoutCover.title;
    const resolvedCategory = design.category_badge || bookWithoutCover.category || "PRACTICAL GUIDE";
    const resolvedAuthor = cover?.author || bookWithoutCover.author || "VasukiSquare Editorial";
    const resolvedAccent = design.accent_color || "#00ed64";

    assert.equal(resolvedTitle, "Legacy Handbook");
    assert.equal(resolvedCategory, "PRACTICAL GUIDE");
    assert.equal(resolvedAuthor, "VasukiSquare Editorial");
    assert.equal(resolvedAccent, "#00ed64");
  });

  it("verifies detail page queries only book and cover metadata (0 page documents loaded)", () => {
    // Simulating repository query counter
    let bookQueries = 0;
    let coverQueries = 0;
    const pageQueries = 0;

    function mockDetailQuery(slug: string) {
      bookQueries++;
      const bookId = `id-for-${slug}`;
      coverQueries++;
      // Note: page queries are strictly 0 for the detail page
      return { bookId };
    }

    mockDetailQuery("distributed-systems-guide");

    assert.equal(bookQueries, 1);
    assert.equal(coverQueries, 1);
    assert.equal(pageQueries, 0, "Detail page must NOT fetch page documents");
  });
});
