import React from "react";
import Link from "next/link";
import { BookX, ArrowLeft, Search } from "lucide-react";

export default function BookNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in duration-200">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs mb-2">
          <BookX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono font-bold tracking-widest text-brand uppercase">
            Publication Unavailable
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-sans">
            Book Not Found
          </h1>
          <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-sm mx-auto">
            The technical publication you are searching for is not available. It may be in draft mode, marked private, or unpublished.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-white hover:bg-black text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Browse Available Books</span>
          </Link>
          <Link
            href="/?q="
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-border/80 hover:border-ink/40 text-ink text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
          >
            <Search className="w-4 h-4 text-mute" />
            <span>Search Publications</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

