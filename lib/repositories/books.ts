import { getBooksCollection } from "@/lib/db/collections";
import type { Book, PaginatedResult, SitemapEntry } from "@/lib/types/publication";

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

/**
 * Clean MongoDB document by ensuring id is mapped and _id is removed or preserved safely.
 */
function normalizeBookDoc(doc: Record<string, unknown>): Book {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id?.toString(),
    id: (doc.id as string) || _id?.toString() || "",
  } as Book;
}

/**
 * Retrieve paginated public, published books for public browsing.
 * Excludes draft/private books and enforces page size limits.
 */
export async function getPublicBooks(
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE
): Promise<PaginatedResult<Book>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
  const skip = (safePage - 1) * safeLimit;

  const collection = await getBooksCollection();
  const filter = {
    "publication.status": "published",
    "publication.visibility": "public",
  };

  const [total, docs] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .find(filter)
      .sort({
        "publication.published_at": -1,
        created_at: -1,
      })
      .skip(skip)
      .limit(safeLimit)
      .toArray(),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;

  return {
    items: docs.map((d) => normalizeBookDoc(d as unknown as Record<string, unknown>)),
    page: safePage,
    limit: safeLimit,
    total,
    total_pages: totalPages,
    has_next: safePage < totalPages,
    has_previous: safePage > 1,
  };
}

/**
 * Retrieve a published, public book by its unique URL slug.
 */
export async function getPublicBookBySlug(slug: string): Promise<Book | null> {
  if (!slug || typeof slug !== "string") return null;

  const collection = await getBooksCollection();
  const doc = await collection.findOne({
    slug: slug.trim(),
    "publication.status": "published",
    "publication.visibility": "public",
  });

  if (!doc) return null;
  return normalizeBookDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Retrieve any book by slug (useful for administrative or preview contexts).
 */
export async function getBookBySlug(slug: string): Promise<Book | null> {
  if (!slug || typeof slug !== "string") return null;

  const collection = await getBooksCollection();
  const doc = await collection.findOne({ slug: slug.trim() });

  if (!doc) return null;
  return normalizeBookDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Retrieve a book by its string ID.
 */
export async function getBookById(bookId: string): Promise<Book | null> {
  if (!bookId || typeof bookId !== "string") return null;

  const collection = await getBooksCollection();
  const doc = await collection.findOne({
    $or: [{ id: bookId }, { _id: bookId as unknown as undefined }],
  });

  if (!doc) return null;
  return normalizeBookDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Retrieve pinned featured books for the homepage hero carousel/grid.
 * Enforces maximum 5 books ordered strictly by pinned position (1 to 5).
 */
export async function getPinnedBooks(): Promise<Book[]> {
  const collection = await getBooksCollection();
  const docs = await collection
    .find({
      "featured.pinned": true,
      "publication.status": "published",
      "publication.visibility": "public",
    })
    .sort({ "featured.position": 1 })
    .limit(5)
    .toArray();

  return docs.map((d) => normalizeBookDoc(d as unknown as Record<string, unknown>));
}

/**
 * Search books by title, subtitle, description, keywords, or category.
 */
export async function searchBooks(
  query: string,
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE,
  publicOnly: boolean = true
): Promise<PaginatedResult<Book>> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);
  const skip = (safePage - 1) * safeLimit;

  const filter: Record<string, unknown> = {};

  if (publicOnly) {
    filter["publication.status"] = "published";
    filter["publication.visibility"] = "public";
  }

  const cleanQuery = query?.trim();
  if (cleanQuery) {
    const escaped = cleanQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };
    filter.$or = [
      { title: regex },
      { subtitle: regex },
      { description: regex },
      { "discovery.search_title": regex },
      { "discovery.keywords": regex },
      { category: regex },
    ];
  }

  const collection = await getBooksCollection();
  const [total, docs] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .find(filter)
      .sort({
        "publication.published_at": -1,
        created_at: -1,
      })
      .skip(skip)
      .limit(safeLimit)
      .toArray(),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / safeLimit) : 1;

  return {
    items: docs.map((d) => normalizeBookDoc(d as unknown as Record<string, unknown>)),
    page: safePage,
    limit: safeLimit,
    total,
    total_pages: totalPages,
    has_next: safePage < totalPages,
    has_previous: safePage > 1,
  };
}

/**
 * Retrieve slim metadata (slug and updated_at) for all public published books for sitemap generation.
 */
export async function getSitemapBooks(): Promise<SitemapEntry[]> {
  const collection = await getBooksCollection();
  const docs = await collection
    .find(
      {
        "publication.status": "published",
        "publication.visibility": "public",
      },
      {
        projection: { slug: 1, updated_at: 1, _id: 0 },
      }
    )
    .sort({ updated_at: -1 })
    .toArray();

  return docs.map((d) => ({
    slug: d.slug,
    updated_at: d.updated_at,
  }));
}

