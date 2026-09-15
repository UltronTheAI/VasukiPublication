import { getCoversCollection } from "@/lib/db/collections";
import type { Cover } from "@/lib/types/publication";

function normalizeCoverDoc(doc: Record<string, unknown>): Cover {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id?.toString(),
    id: (doc.id as string) || _id?.toString() || "",
  } as Cover;
}

/**
 * Retrieve cover document for a given book ID.
 */
export async function getCoverForBook(bookId: string): Promise<Cover | null> {
  if (!bookId) return null;

  const collection = await getCoversCollection();
  const doc = await collection.findOne({ book_id: bookId });

  if (!doc) return null;
  return normalizeCoverDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Retrieve cover document by its unique cover ID.
 */
export async function getCoverById(coverId: string): Promise<Cover | null> {
  if (!coverId) return null;

  const collection = await getCoversCollection();
  const doc = await collection.findOne({
    $or: [{ id: coverId }, { _id: coverId as unknown as undefined }],
  });

  if (!doc) return null;
  return normalizeCoverDoc(doc as unknown as Record<string, unknown>);
}

