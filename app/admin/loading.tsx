import React from "react";

export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-slate-800 rounded-lg" />
          <div className="h-3 w-72 bg-slate-800/60 rounded" />
        </div>
        <div className="h-9 w-32 bg-slate-800 rounded-lg" />
      </div>

      {/* Metrics Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-2">
            <div className="h-3 w-20 bg-slate-800 rounded" />
            <div className="h-7 w-16 bg-slate-800 rounded" />
          </div>
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="h-64 rounded-xl bg-slate-900 border border-slate-800 p-4" />
    </div>
  );
}

