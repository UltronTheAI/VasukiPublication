import React from "react";

export default function SavedBooksLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-10 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-3 max-w-xl pb-6 border-b border-slate-100">
        <div className="h-4 w-32 bg-slate-200 rounded-full" />
        <div className="h-9 w-64 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full bg-slate-100 rounded" />
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-72 rounded-2xl bg-slate-100 border border-slate-200/60 p-4 space-y-4">
            <div className="h-40 w-full bg-slate-200 rounded-xl" />
            <div className="h-4 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

