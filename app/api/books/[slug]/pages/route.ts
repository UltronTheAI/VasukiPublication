import { NextRequest, NextResponse } from "next/server";
import { getPublicBookBySlug } from "@/lib/repositories/books";
import { getBookPages } from "@/lib/repositories/pages";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Missing book slug" }, { status: 400 });
    }

    const book = await getPublicBookBySlug(slug);
    if (!book) {
      return NextResponse.json(
        { error: "Book not found or not publicly accessible" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const rawPage = parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = parseInt(searchParams.get("limit") || "2", 10);

    const pageNum = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) && rawLimit >= 1 ? Math.min(rawLimit, 10) : 2;

    const bookId = book.id || book._id || "";
    const pages = await getBookPages(bookId, pageNum, limit);

    return NextResponse.json({
      book: {
        id: book.id || book._id,
        slug: book.slug,
        title: book.title,
        subtitle: book.subtitle,
        author: book.author,
        page_count: book.page_count,
        chapter_count: book.chapter_count,
        chapters: book.chapters || [],
      },
      page: pageNum,
      limit,
      total_pages: book.page_count,
      pages,
    });
  } catch (err) {
    console.error("Error fetching book pages API:", err);
    return NextResponse.json(
      { error: "Internal server error fetching pages" },
      { status: 500 }
    );
  }
}

