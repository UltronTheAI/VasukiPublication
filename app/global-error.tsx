"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RootGlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[VasukiPublication Root Error]", error.message);
  }, [error]);

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex items-center justify-center bg-white text-slate-900 font-sans p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 text-red-600 border border-red-500/20 shadow-xs mb-2">
            <AlertTriangle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              System Error
            </h1>
            <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
              A critical error occurred while rendering the application. Please refresh the page or try again.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 text-white hover:bg-black text-xs font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

