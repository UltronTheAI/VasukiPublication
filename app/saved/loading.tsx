import React from "react";
import { Bookmark } from "lucide-react";

export default function SavedBooksLoading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Real Stable Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-hairline">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-brand-green flex items-center justify-center">
              <Bookmark className="w-4 h-4 text-brand-green" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              Saved Publications
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-mute max-w-xl">
            Publications saved in your local browser for offline reference and instant access. No account or sync required.
          </p>
        </div>
      </div>

      {/* Main Content Layout with Loading Skeleton on Books Grid and Ads */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-hairline p-4 bg-white space-y-3.5 shadow-2xs animate-pulse"
              >
                <div className="w-full aspect-[210/297] rounded-xl bg-slate-100 border border-slate-100" />
                <div className="space-y-2 pt-1">
                  <div className="h-4 w-3/4 bg-slate-200/80 rounded" />
                  <div className="h-3 w-1/2 bg-slate-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar Loading Placeholder */}
        <aside className="lg:col-span-1 hidden lg:block space-y-6">
          <div className="h-48 rounded-xl bg-slate-100 border border-hairline animate-pulse" />
        </aside>
      </div>
    </div>
  );
}
