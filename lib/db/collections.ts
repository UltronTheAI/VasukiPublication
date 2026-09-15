import type { Collection } from "mongodb";
import { getDatabase } from "./mongodb";
import type { BookDocument, PageDocument, CoverDocument, AdDocument } from "./types";

export const COLLECTIONS = {
  BOOKS: "books",
  PAGES: "pages",
  COVERS: "covers",
  ADS: "ads",
} as const;

/**
 * Type-safe collection accessor for Books.
 */
export async function getBooksCollection(): Promise<Collection<BookDocument>> {
  const db = await getDatabase();
  return db.collection<BookDocument>(COLLECTIONS.BOOKS);
}

/**
 * Type-safe collection accessor for Pages.
 */
export async function getPagesCollection(): Promise<Collection<PageDocument>> {
  const db = await getDatabase();
  return db.collection<PageDocument>(COLLECTIONS.PAGES);
}

/**
 * Type-safe collection accessor for Covers.
 */
export async function getCoversCollection(): Promise<Collection<CoverDocument>> {
  const db = await getDatabase();
  return db.collection<CoverDocument>(COLLECTIONS.COVERS);
}

/**
 * Type-safe collection accessor for Native Ads.
 */
export async function getAdsCollection(): Promise<Collection<AdDocument>> {
  const db = await getDatabase();
  return db.collection<AdDocument>(COLLECTIONS.ADS);
}

