"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log sanitized error message server-side or to observability
    console.error("[VasukiPublication App Error]", error.message);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
      <div className="max-w-md w-full text-center space-y-6 animate-in fade-in duration-200">
        {/* Error Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20 shadow-xs mb-2">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="text-xs font-mono font-bold tracking-widest text-red-600 uppercase">
            Application Error
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink tracking-tight font-sans">
            Unable to Load Content
          </h1>
          <p className="text-xs sm:text-sm text-mute leading-relaxed max-w-sm mx-auto">
            An unexpected error occurred while processing this request. The issue has been recorded.
          </p>
          {error.digest && (
            <p className="text-[10.5px] font-mono text-slate-400">
              Reference ID: <span className="text-slate-600 font-semibold">{error.digest}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-ink text-white hover:bg-black text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white border border-border/80 hover:border-ink/40 text-ink text-xs font-semibold transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-brand shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Discovery</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

