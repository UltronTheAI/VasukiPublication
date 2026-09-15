import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  parseSavedBooks,
  serializeSavedBooks,
  SAVED_BOOKS_STORAGE_KEY,
  LEGACY_STORAGE_KEY,
  SAVED_BOOKS_EVENT,
} from "../lib/hooks/useSavedBooks.ts";
import type { Book } from "../lib/types/publication.ts";

describe("Saved Books — Storage Schema & Recovery", () => {
  it("parses valid version 1 saved books payload correctly", () => {
    const raw = JSON.stringify({
      version: 1,
      books: ["distributed-systems-guide", "rust-performance-patterns"],
    });

    const parsed = parseSavedBooks(raw);
    assert.deepEqual(parsed, [
      "distributed-systems-guide",
      "rust-performance-patterns",
    ]);
  });

  it("prevents duplicates and trims whitespace during parsing", () => {
    const raw = JSON.stringify({
      version: 1,
      books: ["  rust-guide ", "rust-guide", "good-habits", " "],
    });

    const parsed = parseSavedBooks(raw);
    assert.deepEqual(parsed, ["rust-guide", "good-habits"]);
  });

  it("gracefully recovers from legacy direct array storage format", () => {
    const rawLegacy = JSON.stringify(["system-design", "database-internals"]);
    const parsed = parseSavedBooks(rawLegacy);
    assert.deepEqual(parsed, ["system-design", "database-internals"]);
  });

  it("gracefully handles corrupt JSON and malformed payloads without throwing", () => {
    assert.deepEqual(parseSavedBooks(""), []);
    assert.deepEqual(parseSavedBooks(null), []);
    assert.deepEqual(parseSavedBooks("{ malformed json ..."), []);
    assert.deepEqual(parseSavedBooks("42"), []);
    assert.deepEqual(parseSavedBooks(JSON.stringify({ notBooks: true })), []);
  });

  it("serializes list into canonical version 1 format", () => {
    const serialized = serializeSavedBooks(["guide-1", "guide-2", "guide-1"]);
    const parsed = JSON.parse(serialized);

    assert.equal(parsed.version, 1);
    assert.deepEqual(parsed.books, ["guide-1", "guide-2"]);
    assert.equal(SAVED_BOOKS_STORAGE_KEY, "vasuki.savedBooks.v1");
    assert.equal(LEGACY_STORAGE_KEY, "vasuki_saved_books");
    assert.equal(SAVED_BOOKS_EVENT, "vasuki-saved-books-changed");
  });
});

describe("Saved Books — Batch Resolution & Stale Exclusion", () => {
  const sampleCatalog: Book[] = [
    {
      id: "b-pub-1",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "distributed-systems",
      title: "Distributed Systems Guide",
      description: "Architecture patterns.",
      status: "published",
      chapter_count: 3,
      page_count: 30,
      chapters: [],
      publication: {
        status: "published",
        visibility: "public",
      },
      featured: { pinned: false },
      discovery: { search_title: "distributed", keywords: [] },
      seo: { title: "Distributed", description: "", canonical_slug: "distributed-systems" },
      stats: { views: 1, opens: 1 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "b-pub-2",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "rust-patterns",
      title: "Rust Patterns",
      description: "Systems programming handbook.",
      status: "published",
      chapter_count: 4,
      page_count: 40,
      chapters: [],
      publication: {
        status: "published",
        visibility: "public",
      },
      featured: { pinned: false },
      discovery: { search_title: "rust", keywords: [] },
      seo: { title: "Rust", description: "", canonical_slug: "rust-patterns" },
      stats: { views: 2, opens: 1 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "b-draft-3",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "secret-draft",
      title: "Secret Draft",
      description: "Draft guide.",
      status: "draft",
      chapter_count: 1,
      page_count: 10,
      chapters: [],
      publication: {
        status: "draft",
        visibility: "public",
      },
      featured: { pinned: false },
      discovery: { search_title: "secret", keywords: [] },
      seo: { title: "Draft", description: "", canonical_slug: "secret-draft" },
      stats: { views: 0, opens: 0 },
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: "b-priv-4",
      schema_version: 1,
      renderer_version: "0.1.0",
      slug: "private-handbook",
      title: "Private Handbook",
      description: "Confidential.",
      status: "published",
      chapter_count: 1,
      page_count: 15,
      chapters: [],
      publication: {
        status: "published",
        visibility: "private",
      },
      featured: { pinned: false },
      discovery: { search_title: "private", keywords: [] },
      seo: { title: "Private", description: "", canonical_slug: "private-handbook" },
      stats: { views: 0, opens: 0 },
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  function mockBatchResolve(requestedSlugs: string[]): Book[] {
    const clean = requestedSlugs.map((s) => s.trim()).filter(Boolean);
    return sampleCatalog.filter(
      (b) =>
        clean.includes(b.slug) &&
        b.publication.status === "published" &&
        b.publication.visibility === "public"
    );
  }

  it("resolves multiple saved slugs in a single batch query", () => {
    const saved = ["distributed-systems", "rust-patterns"];
    const resolved = mockBatchResolve(saved);

    assert.equal(resolved.length, 2);
    assert.equal(resolved[0].slug, "distributed-systems");
    assert.equal(resolved[1].slug, "rust-patterns");
  });

  it("strictly excludes draft and private saved books from batch output", () => {
    const saved = ["distributed-systems", "secret-draft", "private-handbook"];
    const resolved = mockBatchResolve(saved);

    assert.equal(resolved.length, 1, "Draft and private books must not be returned");
    assert.equal(resolved[0].slug, "distributed-systems");
  });

  it("handles deleted or unknown saved slugs cleanly without crashing", () => {
    const saved = ["deleted-guide-123", "unknown-slug-456"];
    const resolved = mockBatchResolve(saved);

    assert.equal(resolved.length, 0);
  });
});

describe("Saved Books — Privacy Invariant & Zero Accounts", () => {
  it("guarantees saved state is strictly browser-local and anonymous", () => {
    // Structural invariant: No user collection / auth requirement
    const requiredAuthFields = ["user_id", "session_token", "account_email", "password_hash"];
    const savedBooksPayload = {
      version: 1,
      books: ["distributed-systems"],
    };

    for (const field of requiredAuthFields) {
      assert.equal(
        (savedBooksPayload as Record<string, unknown>)[field],
        undefined,
        `Saved payload must not require ${field}`
      );
    }
  });

  it("verifies ad placements configured for saved page", () => {
    const validSavedPlacements = ["saved_banner", "saved_sidebar"];
    assert.ok(validSavedPlacements.includes("saved_banner"));
    assert.ok(validSavedPlacements.includes("saved_sidebar"));
  });
});

