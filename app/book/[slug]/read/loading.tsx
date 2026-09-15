import React from "react";
import { Loader2 } from "lucide-react";

export default function ReaderLoading() {
  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center text-slate-900">
      <div className="flex flex-col items-center gap-4 animate-pulse">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-bold tracking-tight text-slate-900 font-sans">
            Loading VasukiSquare Reader
          </div>
          <p className="text-xs font-mono text-slate-500">
            Streaming publication pages directly from database...
          </p>
        </div>
      </div>
    </div>
  );
}

