import React from "react";

export default function HomeLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12 animate-pulse">
      {/* Hero Skeleton */}
      <div className="space-y-4 max-w-2xl">
        <div className="h-4 w-32 bg-slate-200 rounded-full" />
        <div className="h-10 w-3/4 bg-slate-200 rounded-xl" />
        <div className="h-4 w-full bg-slate-100 rounded-lg" />
        <div className="h-12 w-full max-w-xl bg-slate-100 rounded-xl mt-4" />
      </div>

      {/* Pinned Showcase Skeleton */}
      <div className="space-y-4 pt-6 border-t border-slate-100">
        <div className="h-5 w-40 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 rounded-2xl bg-slate-100 border border-slate-200/60 p-4 space-y-4">
              <div className="h-40 w-full bg-slate-200 rounded-xl" />
              <div className="h-4 w-3/4 bg-slate-200 rounded" />
              <div className="h-3 w-1/2 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="space-y-4 pt-6">
        <div className="h-5 w-48 bg-slate-200 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-64 rounded-xl bg-slate-100 border border-slate-200/60 p-3 space-y-3">
              <div className="h-36 w-full bg-slate-200 rounded-lg" />
              <div className="h-4 w-4/5 bg-slate-200 rounded" />
              <div className="h-3 w-2/3 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

