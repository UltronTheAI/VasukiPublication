import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBookBySlug } from "@/lib/repositories/books";
import { getCoverForBook } from "@/lib/repositories/covers";
import { CoverPreview } from "@/components/cover/CoverPreview";
import { ArrowLeft, BookOpen, Sparkles, Terminal } from "lucide-react";

interface ReaderPageProps {
  params: Promise<{ slug: string }>;
}

export default async function BookReaderPage({ params }: ReaderPageProps) {
  const { slug } = await params;
  const book = await getPublicBookBySlug(slug);

  if (!book) {
    notFound();
  }

  const cover = await getCoverForBook(book.id || book._id || "");

  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center px-4 py-12 bg-canvas-soft">
      <div className="w-full max-w-2xl bg-white border border-hairline rounded-2xl p-8 shadow-xs text-center flex flex-col items-center">
        {/* Emblem */}
        <div className="w-12 h-12 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink mb-6">
          <BookOpen className="w-6 h-6 text-brand-green" />
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-link text-xs font-mono font-semibold mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Interactive Reader Engine Ready</span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-ink mb-2">
          {book.title}
        </h1>

        {book.subtitle && (
          <p className="text-sm text-body max-w-lg mb-6 leading-relaxed">
            {book.subtitle}
          </p>
        )}

        {/* Small cover preview */}
        <div className="my-4">
          <CoverPreview book={book} cover={cover} size="md" className="shadow-md mx-auto" />
        </div>

        <div className="bg-canvas-soft border border-hairline rounded-xl p-4 text-xs text-body max-w-md my-6 text-left">
          <div className="flex items-center gap-1.5 font-semibold text-ink mb-1.5">
            <Terminal className="w-3.5 h-3.5 text-brand-green" />
            <span>Reader Pipeline Initialization</span>
          </div>
          <p className="text-[11px] text-mute leading-relaxed">
            The full interactive A4 reader with linked-list pagination and theme isolation is coming in the next incremental phase.
          </p>
        </div>

        <Link
          href={`/book/${book.slug}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-ink text-white hover:bg-black transition-colors shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Book Overview</span>
        </Link>
      </div>
    </div>
  );
}

