import { NextRequest, NextResponse } from "next/server";
import { getPublicBooksBySlugs } from "@/lib/repositories/books";
import { getCoversForBooks } from "@/lib/repositories/covers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawSlugs = Array.isArray(body.slugs) ? body.slugs : [];

    const slugs = rawSlugs
      .filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0)
      .map((s: string) => s.trim())
      .slice(0, 50);

    if (slugs.length === 0) {
      return NextResponse.json({ books: [], covers: {} });
    }

    const books = await getPublicBooksBySlugs(slugs);
    const bookIds = books.map((b) => b.id || b._id || "").filter(Boolean);
    const covers = await getCoversForBooks(bookIds);

    return NextResponse.json({
      books,
      covers,
      requested_count: slugs.length,
      resolved_count: books.length,
    });
  } catch (err) {
    console.error("Batch books retrieval error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve batch books" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slugsParam = searchParams.get("slugs") || "";
    const slugs = slugsParam
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50);

    if (slugs.length === 0) {
      return NextResponse.json({ books: [], covers: {} });
    }

    const books = await getPublicBooksBySlugs(slugs);
    const bookIds = books.map((b) => b.id || b._id || "").filter(Boolean);
    const covers = await getCoversForBooks(bookIds);

    return NextResponse.json({
      books,
      covers,
      requested_count: slugs.length,
      resolved_count: books.length,
    });
  } catch (err) {
    console.error("Batch books GET error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve batch books" },
      { status: 500 }
    );
  }
}

