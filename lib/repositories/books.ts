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

/**
 * Batch retrieve public published books by an array of slugs.
 * Excludes private/draft/missing books in a single MongoDB query.
 */
export async function getPublicBooksBySlugs(slugs: string[]): Promise<Book[]> {
  if (!slugs || slugs.length === 0) return [];
  const cleanSlugs = slugs
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean)
    .slice(0, 50);

  if (cleanSlugs.length === 0) return [];

  const collection = await getBooksCollection();
  const docs = await collection
    .find({
      slug: { $in: cleanSlugs },
      "publication.status": "published",
      "publication.visibility": "public",
    })
    .toArray();

  return docs.map((d) => normalizeBookDoc(d as unknown as Record<string, unknown>));
}

export interface AdminBookQueryOptions {
  search?: string;
  status?: string;
  visibility?: string;
  page?: number;
  limit?: number;
}

/**
 * Administrative paginated book retrieval with filters for status, visibility, and search.
 * Returns both public and private/draft publications.
 */
export async function getAllBooksAdmin(
  options: AdminBookQueryOptions = {}
): Promise<PaginatedResult<Book>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(Math.max(1, options.limit || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};

  if (options.status && options.status !== "all") {
    filter["publication.status"] = options.status;
  }

  if (options.visibility && options.visibility !== "all") {
    filter["publication.visibility"] = options.visibility;
  }

  if (options.search?.trim()) {
    const escaped = options.search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = { $regex: escaped, $options: "i" };
    filter.$or = [
      { title: regex },
      { subtitle: regex },
      { slug: regex },
      { author: regex },
      { category: regex },
    ];
  }

  const collection = await getBooksCollection();
  const [total, docs] = await Promise.all([
    collection.countDocuments(filter),
    collection
      .find(filter)
      .sort({ updated_at: -1, created_at: -1 })
      .skip(skip)
      .limit(limit)
      .toArray(),
  ]);

  const totalPages = total > 0 ? Math.ceil(total / limit) : 1;

  return {
    items: docs.map((d) => normalizeBookDoc(d as unknown as Record<string, unknown>)),
    page,
    limit,
    total,
    total_pages: totalPages,
    has_next: page < totalPages,
    has_previous: page > 1,
  };
}

export interface AdminOverviewStats {
  totalBooks: number;
  publishedBooks: number;
  draftBooks: number;
  privateBooks: number;
  pinnedBooksCount: number;
  activeAdsCount: number;
}

/**
 * Retrieve high-level operational metrics for the administrative overview dashboard.
 */
export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const collection = await getBooksCollection();

  const [total, published, drafts, privates, pinnedDocs] = await Promise.all([
    collection.countDocuments({}),
    collection.countDocuments({ "publication.status": "published", "publication.visibility": "public" }),
    collection.countDocuments({ "publication.status": "draft" }),
    collection.countDocuments({ "publication.visibility": "private" }),
    collection.countDocuments({ "featured.pinned": true }),
  ]);

  return {
    totalBooks: total,
    publishedBooks: published,
    draftBooks: drafts,
    privateBooks: privates,
    pinnedBooksCount: pinnedDocs,
    activeAdsCount: 0, // Augmented by caller from ads collection
  };
}

/**
 * Update book metadata, publication status, SEO, and categorization.
 */
export async function updateBook(
  bookId: string,
  updateData: Partial<Book>
): Promise<Book | null> {
  if (!bookId) return null;

  const collection = await getBooksCollection();
  const safeUpdate = { ...updateData, updated_at: new Date() };
  delete (safeUpdate as Record<string, unknown>)._id;
  delete (safeUpdate as Record<string, unknown>).id;

  const result = await collection.findOneAndUpdate(
    { $or: [{ id: bookId }, { _id: bookId as unknown as undefined }] },
    { $set: safeUpdate },
    { returnDocument: "after" }
  );

  if (!result) return null;
  return normalizeBookDoc(result as unknown as Record<string, unknown>);
}

/**
 * Server-enforced pinning update with strict max 5 constraint and duplicate position resolution.
 */
export async function updateBookPin(
  bookId: string,
  pinned: boolean,
  position?: number | null
): Promise<{ success: boolean; error?: string }> {
  if (!bookId) return { success: false, error: "Missing book ID" };

  const collection = await getBooksCollection();

  if (!pinned) {
    await collection.updateOne(
      { $or: [{ id: bookId }, { _id: bookId as unknown as undefined }] },
      { $set: { "featured.pinned": false, "featured.position": null, updated_at: new Date() } }
    );
    return { success: true };
  }

  // Enforce position 1..5
  const targetPos = position && position >= 1 && position <= 5 ? Math.round(position) : 1;

  // Retrieve currently pinned books
  const currentPinned = await collection
    .find({ "featured.pinned": true })
    .sort({ "featured.position": 1 })
    .toArray();

  const isAlreadyPinned = currentPinned.some((d) => d.id === bookId || d._id?.toString() === bookId);

  if (!isAlreadyPinned && currentPinned.length >= 5) {
    return { success: false, error: "Maximum of 5 pinned publications reached. Unpin another book first." };
  }

  // If another book occupies this target position, shift or reassign positions
  for (const doc of currentPinned) {
    const docId = doc.id || doc._id?.toString();
    if (docId !== bookId && doc.featured?.position === targetPos) {
      // Find lowest available position 1..5
      const usedPositions = new Set(currentPinned.filter(d => (d.id || d._id?.toString()) !== docId).map(d => d.featured?.position));
      let nextAvail = 1;
      while (usedPositions.has(nextAvail) && nextAvail <= 5) {
        nextAvail++;
      }
      if (nextAvail <= 5) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { "featured.position": nextAvail, updated_at: new Date() } }
        );
      }
    }
  }

  await collection.updateOne(
    { $or: [{ id: bookId }, { _id: bookId as unknown as undefined }] },
    { $set: { "featured.pinned": true, "featured.position": targetPos, updated_at: new Date() } }
  );

  return { success: true };
}

/**
 * Destructive safe cascade deletion: removes book, its pages, and cover artwork.
 * Strictly preserves unrelated advertisements.
 */
export async function deleteBookCascade(
  bookId: string
): Promise<{ success: boolean; deletedPagesCount: number; deletedCover: boolean }> {
  if (!bookId) return { success: false, deletedPagesCount: 0, deletedCover: false };

  const booksColl = await getBooksCollection();
  const { getPagesCollection, getCoversCollection } = await import("@/lib/db/collections");
  const pagesColl = await getPagesCollection();
  const coversColl = await getCoversCollection();

  // Find book first to get both id and slug
  const bookDoc = await booksColl.findOne({
    $or: [{ id: bookId }, { _id: bookId as unknown as undefined }],
  });

  if (!bookDoc) {
    return { success: false, deletedPagesCount: 0, deletedCover: false };
  }

  const normalizedId = bookDoc.id || bookDoc._id?.toString() || bookId;

  // 1. Delete Pages
  const pagesRes = await pagesColl.deleteMany({ book_id: normalizedId });

  // 2. Delete Cover
  const coverRes = await coversColl.deleteMany({ book_id: normalizedId });

  // 3. Delete Book
  await booksColl.deleteOne({ _id: bookDoc._id });

  return {
    success: true,
    deletedPagesCount: pagesRes.deletedCount || 0,
    deletedCover: (coverRes.deletedCount || 0) > 0,
  };
}



