import { getPagesCollection } from "@/lib/db/collections";
import type { Page } from "@/lib/types/publication";

function normalizePageDoc(doc: Record<string, unknown>): Page {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id?.toString(),
    id: (doc.id as string) || _id?.toString() || "",
  } as Page;
}

/**
 * Retrieve pages for a book from a starting page number, optionally limited.
 */
export async function getBookPages(
  bookId: string,
  startPage: number = 1,
  limit?: number
): Promise<Page[]> {
  if (!bookId) return [];

  const collection = await getPagesCollection();
  let cursor = collection
    .find({
      book_id: bookId,
      page_number: { $gte: Math.max(1, startPage) },
    })
    .sort({ page_number: 1 });

  if (limit && limit > 0) {
    cursor = cursor.limit(limit);
  }

  const docs = await cursor.toArray();
  return docs.map((d) => normalizePageDoc(d as unknown as Record<string, unknown>));
}

/**
 * Retrieve an individual page by book ID and page number.
 */
export async function getBookPage(
  bookId: string,
  pageNumber: number
): Promise<Page | null> {
  if (!bookId || pageNumber < 1) return null;

  const collection = await getPagesCollection();
  const doc = await collection.findOne({
    book_id: bookId,
    page_number: pageNumber,
  });

  if (!doc) return null;
  return normalizePageDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Retrieve a page by its unique string ID.
 */
export async function getPageById(pageId: string): Promise<Page | null> {
  if (!pageId) return null;

  const collection = await getPagesCollection();
  const doc = await collection.findOne({
    $or: [{ id: pageId }, { _id: pageId as unknown as undefined }],
  });

  if (!doc) return null;
  return normalizePageDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Follow the linked list pointer chain forward from a starting page ID.
 */
export async function getLinkedPages(
  startingPageId: string,
  maxPages: number = 200
): Promise<Page[]> {
  if (!startingPageId) return [];

  const chain: Page[] = [];
  let currentId: string | null | undefined = startingPageId;
  const visited = new Set<string>();

  while (currentId && !visited.has(currentId) && chain.length < maxPages) {
    visited.add(currentId);
    const page = await getPageById(currentId);
    if (!page) break;
    chain.push(page);
    currentId = page.next_page_id;
  }

  return chain;
}

/**
 * Retrieve all pages for a book ordered by page number for the admin viewer.
 */
export async function getPagesForBookAdmin(bookId: string): Promise<Page[]> {
  if (!bookId) return [];

  const collection = await getPagesCollection();
  const docs = await collection
    .find({ book_id: bookId })
    .sort({ page_number: 1 })
    .toArray();

  return docs.map((d) => normalizePageDoc(d as unknown as Record<string, unknown>));
}

/**
 * Update page metadata or structured content in the repository.
 */
export async function updatePageAdmin(
  pageId: string,
  updateData: Partial<Page>
): Promise<Page | null> {
  if (!pageId) return null;

  const collection = await getPagesCollection();
  const safeUpdate = { ...updateData, updated_at: new Date() };
  delete (safeUpdate as Record<string, unknown>)._id;
  delete (safeUpdate as Record<string, unknown>).id;

  const result = await collection.findOneAndUpdate(
    { $or: [{ id: pageId }, { _id: pageId as unknown as undefined }] },
    { $set: safeUpdate },
    { returnDocument: "after" }
  );

  if (!result) return null;
  return normalizePageDoc(result as unknown as Record<string, unknown>);
}


