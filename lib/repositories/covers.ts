import { getCoversCollection, getPagesCollection } from "@/lib/db/collections";
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
 * First queries the covers collection, and falls back to page 1 (cover page) in the pages collection.
 */
export async function getCoverForBook(bookId: string): Promise<Cover | null> {
  if (!bookId) return null;

  const collection = await getCoversCollection();
  const doc = await collection.findOne({
    $or: [{ book_id: bookId }, { id: bookId }],
  });

  if (doc) {
    return normalizeCoverDoc(doc as unknown as Record<string, unknown>);
  }

  // Fallback: check if page 1 in pages collection exists with cover html or style
  try {
    const pagesColl = await getPagesCollection();
    const pageDoc = await pagesColl.findOne({
      book_id: bookId,
      $or: [{ page_number: 1 }, { page_type: "cover" }],
    });

    if (pageDoc) {
      const pageContent = (pageDoc.content || {}) as Record<string, unknown>;
      const pageStyle = (pageDoc.style || {}) as Record<string, unknown>;
      return {
        id: (pageDoc.id as string) || `cover-${bookId}`,
        book_id: bookId,
        width: 1600,
        height: 2560,
        title: (pageContent.headline as string) || "",
        subtitle: (pageContent.body as string) || null,
        html: (pageDoc.html as string) || "",
        design: pageStyle,
        schema_version: (pageDoc.schema_version as number) || 1,
        renderer_version: (pageDoc.renderer_version as string) || "0.1.0",
        created_at: (pageDoc.created_at as Date) || new Date(),
        updated_at: (pageDoc.updated_at as Date) || new Date(),
      };
    }
  } catch (err) {
    console.error("[VasukiPublication] Error falling back to page 1 for cover:", err);
  }

  return null;
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
 * Queries covers collection and transparently falls back to page 1 for any books missing dedicated cover documents.
 */
export async function getCoversForBooks(bookIds: string[]): Promise<Record<string, Cover>> {
  if (!bookIds || bookIds.length === 0) return {};

  const cleanIds = Array.from(new Set(bookIds.filter(Boolean)));
  const collection = await getCoversCollection();
  const docs = await collection
    .find({
      $or: [{ book_id: { $in: cleanIds } }, { id: { $in: cleanIds } }],
    })
    .toArray();

  const map: Record<string, Cover> = {};
  for (const doc of docs) {
    const cover = normalizeCoverDoc(doc as unknown as Record<string, unknown>);
    if (cover.book_id) map[cover.book_id] = cover;
    if (cover.id) map[cover.id] = cover;
  }

  // Check for any missing bookIds in pages collection
  const missingBookIds = cleanIds.filter((id) => !map[id]);
  if (missingBookIds.length > 0) {
    try {
      const pagesColl = await getPagesCollection();
      const pageDocs = await pagesColl
        .find({
          book_id: { $in: missingBookIds },
          $or: [{ page_number: 1 }, { page_type: "cover" }],
        })
        .toArray();

      for (const pageDoc of pageDocs) {
        const pBookId = (pageDoc.book_id as string) || "";
        if (pBookId && !map[pBookId]) {
          const pageContent = (pageDoc.content || {}) as Record<string, unknown>;
          const pageStyle = (pageDoc.style || {}) as Record<string, unknown>;
          const fallbackCover: Cover = {
            id: (pageDoc.id as string) || `cover-${pBookId}`,
            book_id: pBookId,
            width: 1600,
            height: 2560,
            title: (pageContent.headline as string) || "",
            subtitle: (pageContent.body as string) || null,
            html: (pageDoc.html as string) || "",
            design: pageStyle,
            schema_version: (pageDoc.schema_version as number) || 1,
            renderer_version: (pageDoc.renderer_version as string) || "0.1.0",
            created_at: (pageDoc.created_at as Date) || new Date(),
            updated_at: (pageDoc.updated_at as Date) || new Date(),
          };
          map[pBookId] = fallbackCover;
          if (fallbackCover.id) map[fallbackCover.id] = fallbackCover;
        }
      }
    } catch (err) {
      console.error("[VasukiPublication] Error batch falling back to page 1 covers:", err);
    }
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


