import React from "react";
import { Sparkles, Search } from "lucide-react";

export default function HomeLoading() {
  return (
    <div className="w-full flex flex-col items-center">
      {/* Real Stable Hero Section (preserves full header layout without full-page blank flash) */}
      <section className="w-full relative overflow-hidden hero-mesh-gradient border-b border-hairline py-14 sm:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center relative z-10">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline bg-white/80 backdrop-blur-xs text-xs font-mono text-mute mb-5 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-brand-green" />
            <span className="font-semibold text-ink">VasukiSquare Publication Network</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-ink max-w-2xl leading-[1.15] sm:leading-[1.12]">
            Production Technical Books, Published for the Web
          </h1>

          {/* Subheading */}
          <p className="mt-4 text-sm sm:text-base text-body max-w-xl leading-relaxed">
            High-density architecture manuals, engineering blueprints, and practical guides.
            Streamed natively without PDF downloads.
          </p>

          {/* Search Bar Placeholder */}
          <div className="w-full max-w-xl mt-8">
            <div className="relative flex items-center w-full">
              <Search className="absolute left-3.5 w-4 h-4 text-mute pointer-events-none" />
              <div className="w-full h-11 pl-10 pr-4 rounded-xl border border-hairline bg-white shadow-2xs text-xs text-mute flex items-center">
                Search technical guides, topics, architectures...
              </div>
            </div>

            {/* Quick Topic Chips */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 text-[11px] font-mono text-mute">
              <span>Popular:</span>
              {["Rust", "Database", "Python", "Architecture", "Distributed", "Security"].map((topic) => (
                <span
                  key={topic}
                  className="px-2 py-0.5 rounded-md border border-hairline bg-white/70 text-body"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area: Only show loading skeletons on Books & Ads area */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        {/* Books Grid Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-5 w-36 bg-slate-200/80 rounded-md animate-pulse" />
            <div className="h-3.5 w-24 bg-slate-100 rounded animate-pulse" />
          </div>
        </div>

        {/* Book Cards Grid Loading Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-white border border-hairline rounded-2xl p-4 space-y-3.5 shadow-2xs animate-pulse"
            >
              <div className="w-full aspect-[210/297] rounded-xl bg-slate-100 flex items-center justify-center border border-slate-100" />
              <div className="space-y-2 pt-1">
                <div className="h-4 w-3/4 bg-slate-200/80 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="pt-2 border-t border-hairline flex items-center justify-between">
                <div className="h-3 w-16 bg-slate-100 rounded" />
                <div className="h-3 w-12 bg-slate-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
