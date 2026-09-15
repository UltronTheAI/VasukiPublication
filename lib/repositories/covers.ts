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

/**
 * Batch retrieve covers for an array of book IDs to eliminate N+1 queries.
 */
export async function getCoversForBooks(bookIds: string[]): Promise<Record<string, Cover>> {
  if (!bookIds || bookIds.length === 0) return {};

  const collection = await getCoversCollection();
  const docs = await collection
    .find({
      book_id: { $in: bookIds },
    })
    .toArray();

  const map: Record<string, Cover> = {};
  for (const doc of docs) {
    const cover = normalizeCoverDoc(doc as unknown as Record<string, unknown>);
    map[cover.book_id] = cover;
    map[cover.id] = cover;
  }
  return map;
}

/**
 * Update safe cover metadata and design parameters for admin editor.
 */
export async function updateCoverAdmin(
  coverIdOrBookId: string,
  coverData: Partial<Cover>
): Promise<Cover | null> {
  if (!coverIdOrBookId) return null;

  const collection = await getCoversCollection();
  const safeUpdate = { ...coverData, updated_at: new Date() };
  delete (safeUpdate as Record<string, unknown>)._id;
  delete (safeUpdate as Record<string, unknown>).id;

  const result = await collection.findOneAndUpdate(
    {
      $or: [
        { id: coverIdOrBookId },
        { book_id: coverIdOrBookId },
        { _id: coverIdOrBookId as unknown as undefined },
      ],
    },
    { $set: safeUpdate },
    { returnDocument: "after" }
  );

  if (!result) return null;
  return normalizeCoverDoc(result as unknown as Record<string, unknown>);
}


