import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicBookBySlug } from "@/lib/repositories/books";
import { getBookPages, getBookChapterRanges } from "@/lib/repositories/pages";
import { ReaderContainer } from "@/components/reader/ReaderContainer";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

interface ReaderPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: ReaderPageProps): Promise<Metadata> {
  const { slug } = await params;
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    return {
      title: "Book Not Found | Vasuki Publication",
    };
  }

  const title = `Read: ${book.title} | Vasuki Publication`;
  const description =
    book.description ||
    book.subtitle ||
    `Interactive reading experience for ${book.title} on Vasuki Publication.`;

  const canonicalUrl = `${publicEnv.NEXT_PUBLIC_SITE_URL}/book/${book.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/book/${book.slug}/read`,
      type: "article",
      siteName: "Vasuki Publication",
      images: [
        {
          url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/book/${book.slug}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: book.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`${publicEnv.NEXT_PUBLIC_SITE_URL}/book/${book.slug}/opengraph-image`],
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default async function BookReaderPage({
  params,
  searchParams,
}: ReaderPageProps) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};

  const rawPage = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;

  const parsedPage = parseInt(rawPage || "1", 10);
  const initialPageNumber = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  const book = await getPublicBookBySlug(slug);
  if (!book) {
    notFound();
  }

  const bookId = book.id || book._id || "";
  // Fetch initial 10-page batch window and chapter ranges for instant rendering & Table of Contents
  const batchStart = Math.max(1, Math.floor((initialPageNumber - 1) / 10) * 10 + 1);
  const [initialPages, chapterRanges] = await Promise.all([
    getBookPages(bookId, batchStart, 10),
    getBookChapterRanges(bookId),
  ]);

  return (
    <ReaderContainer
      book={book}
      initialPage={initialPageNumber}
      initialPages={initialPages}
      chapterRanges={chapterRanges}
    />
  );
}
