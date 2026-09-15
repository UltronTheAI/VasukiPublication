import type { Book, Page, Cover, Ad } from "@/lib/types/publication";

export type BookDocument = Book;
export type PageDocument = Page;
export type CoverDocument = Cover;
export type AdDocument = Ad;

export interface DatabaseCollections {
  books: BookDocument;
  pages: PageDocument;
  covers: CoverDocument;
  ads: AdDocument;
}

