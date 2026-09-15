import { getAdsCollection } from "@/lib/db/collections";
import type { Ad, AdPlacement } from "@/lib/types/publication";

function normalizeAdDoc(doc: Record<string, unknown>): Ad {
  const { _id, ...rest } = doc;
  return {
    ...rest,
    _id: _id?.toString(),
    id: (doc.id as string) || _id?.toString() || "",
  } as Ad;
}

/**
 * Retrieve currently active, unexpired advertisements for a specified placement.
 */
export async function getActiveAds(
  placement?: AdPlacement | string,
  atTime?: Date
): Promise<Ad[]> {
  const now = atTime || new Date();
  const collection = await getAdsCollection();

  const filter: Record<string, unknown> = {
    active: true,
    $and: [
      { $or: [{ starts_at: null }, { starts_at: { $exists: false } }, { starts_at: { $lte: now } }] },
      { $or: [{ ends_at: null }, { ends_at: { $exists: false } }, { ends_at: { $gte: now } }] },
    ],
  };

  if (placement) {
    filter.placements = placement;
  }

  const docs = await collection.find(filter).sort({ priority: 1 }).toArray();
  return docs.map((d) => normalizeAdDoc(d as unknown as Record<string, unknown>));
}

/**
 * Retrieve an advertisement by its unique ID.
 */
export async function getAdById(adId: string): Promise<Ad | null> {
  if (!adId) return null;

  const collection = await getAdsCollection();
  const doc = await collection.findOne({
    $or: [{ id: adId }, { _id: adId as unknown as undefined }],
  });

  if (!doc) return null;
  return normalizeAdDoc(doc as unknown as Record<string, unknown>);
}

/**
 * Priority-weighted random selection for native advertisements.
 * Priority 1: Weight 10
 * Priority 2: Weight 5
 * Priority 3: Weight 2
 */
export function selectWeightedAd(ads: Ad[], atTime?: Date): Ad | null {
  if (!ads || ads.length === 0) return null;

  const now = atTime || new Date();
  const eligible = ads.filter((ad) => {
    if (!ad.active) return false;
    if (ad.starts_at && new Date(ad.starts_at) > now) return false;
    if (ad.ends_at && new Date(ad.ends_at) < now) return false;
    return true;
  });

  if (eligible.length === 0) return null;

  const weights: Record<number, number> = { 1: 10, 2: 5, 3: 2 };
  const totalWeight = eligible.reduce((acc, ad) => acc + (weights[ad.priority] || 2), 0);

  let randomVal = Math.random() * totalWeight;

  for (const ad of eligible) {
    const w = weights[ad.priority] || 2;
    if (randomVal < w) {
      return ad;
    }
    randomVal -= w;
  }

  return eligible[0];
}

/**
 * Retrieve all advertisements for the admin management view.
 */
export async function getAllAdsAdmin(): Promise<Ad[]> {
  const collection = await getAdsCollection();
  const docs = await collection.find({}).sort({ priority: 1, created_at: -1 }).toArray();
  return docs.map((d) => normalizeAdDoc(d as unknown as Record<string, unknown>));
}

/**
 * Create a new native advertisement document with initial zeroed stats.
 */
export async function createAdAdmin(
  adData: {
    title: string;
    headline: string;
    description: string;
    sponsor: string;
    url: string;
    placements: string[];
    priority: number;
    active: boolean;
    starts_at?: string | Date | null;
    ends_at?: string | Date | null;
  }
): Promise<Ad> {
  const collection = await getAdsCollection();
  const now = new Date();
  const id = `ad-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newDoc = {
    id,
    title: adData.title.trim(),
    headline: adData.headline.trim(),
    description: adData.description.trim(),
    sponsor: adData.sponsor.trim(),
    url: adData.url.trim(),
    placements: adData.placements || ["home_banner"],
    priority: adData.priority || 1,
    active: Boolean(adData.active),
    starts_at: adData.starts_at ? new Date(adData.starts_at) : null,
    ends_at: adData.ends_at ? new Date(adData.ends_at) : null,
    stats: { impressions: 0, clicks: 0 },
    created_at: now,
    updated_at: now,
  };

  await collection.insertOne(newDoc as unknown as import("@/lib/db/types").AdDocument);
  return normalizeAdDoc(newDoc as unknown as Record<string, unknown>);
}

/**
 * Update an advertisement document.
 */
export async function updateAdAdmin(
  adId: string,
  adData: Partial<Ad>
): Promise<Ad | null> {
  if (!adId) return null;

  const collection = await getAdsCollection();
  const safeUpdate = { ...adData, updated_at: new Date() };
  delete (safeUpdate as Record<string, unknown>)._id;
  delete (safeUpdate as Record<string, unknown>).id;

  if (safeUpdate.starts_at) safeUpdate.starts_at = new Date(safeUpdate.starts_at);
  if (safeUpdate.ends_at) safeUpdate.ends_at = new Date(safeUpdate.ends_at);

  const result = await collection.findOneAndUpdate(
    { $or: [{ id: adId }, { _id: adId as unknown as undefined }] },
    { $set: safeUpdate },
    { returnDocument: "after" }
  );

  if (!result) return null;
  return normalizeAdDoc(result as unknown as Record<string, unknown>);
}

/**
 * Delete an advertisement document.
 */
export async function deleteAdAdmin(adId: string): Promise<boolean> {
  if (!adId) return false;

  const collection = await getAdsCollection();
  const res = await collection.deleteOne({
    $or: [{ id: adId }, { _id: adId as unknown as undefined }],
  });

  return (res.deletedCount || 0) > 0;
}


