"use client";

import React, { useState } from "react";
import type { Ad } from "@/lib/types/publication";
import { AdConfirmationModal } from "./AdConfirmationModal";
import { ExternalLink, Sparkles } from "lucide-react";

interface NativeAdBannerProps {
  ad: Ad | null;
  className?: string;
}

export function NativeAdBanner({ ad, className = "" }: NativeAdBannerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!ad || !ad.active) return null;

  return (
    <>
      <div
        className={`w-full bg-white border border-hairline hover:border-hairline-strong rounded-xl p-4 sm:p-5 transition-all shadow-xs cursor-pointer group ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-4 h-4 text-link" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-mute bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline">
                  Sponsored
                </span>
                <span className="text-xs font-semibold text-ink">{ad.sponsor}</span>
              </div>
              <h4 className="text-sm font-medium text-ink group-hover:text-link transition-colors">
                {ad.headline}
              </h4>
              <p className="text-xs text-body line-clamp-1 mt-0.5">
                {ad.description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-medium text-mute group-hover:text-ink transition-colors self-end sm:self-center shrink-0">
            <span>Learn more</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <AdConfirmationModal
        ad={ad}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

