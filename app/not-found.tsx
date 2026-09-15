import React from "react";
import Link from "next/link";
import { BookX, ArrowLeft, Search, Compass } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in duration-200">
        {/* Icon & Code */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-xs mb-2">
          <BookX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono font-bold tracking-widest text-brand uppercase">
            Error 404
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-sans">
            Publication Not Found
          </h1>
          <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-sm mx-auto">
            The page or publication you requested could not be located. It may have been unpublished, moved, or never existed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-white hover:bg-black text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Discovery</span>
          </Link>
          <Link
            href="/?q="
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-border/80 hover:border-ink/40 text-ink text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
          >
            <Search className="w-4 h-4 text-mute" />
            <span>Search Catalog</span>
          </Link>
        </div>

        {/* Helper Note */}
        <div className="pt-6 border-t border-border/60">
          <p className="text-[11px] font-mono text-mute flex items-center justify-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            <span>Explore technical handbooks and architectural publications on Vasuki Publication.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

