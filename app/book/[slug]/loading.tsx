import React from "react";

export default function BookDetailLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-48 bg-slate-200 rounded" />

      {/* Hero Header Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Cover Skeleton */}
        <div className="lg:col-span-4 w-full max-w-xs mx-auto aspect-[1/1.414] rounded-2xl bg-slate-200 border border-slate-300/60" />

        {/* Details Skeleton */}
        <div className="lg:col-span-8 space-y-6">
          <div className="h-6 w-32 bg-slate-200 rounded-full" />
          <div className="h-10 w-4/5 bg-slate-200 rounded-xl" />
          <div className="h-5 w-3/5 bg-slate-200 rounded-lg" />
          
          <div className="flex items-center gap-4 pt-2">
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
            <div className="h-4 w-24 bg-slate-200 rounded" />
          </div>

          <div className="space-y-2 pt-4 border-t border-slate-100">
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-full bg-slate-100 rounded" />
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <div className="h-11 w-36 bg-slate-200 rounded-xl" />
            <div className="h-11 w-12 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

