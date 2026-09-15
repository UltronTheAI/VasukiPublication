"use client";

import React, { useState } from "react";
import type { Ad } from "@/lib/types/publication";
import { AdConfirmationModal } from "./AdConfirmationModal";
import { ExternalLink, Sparkles } from "lucide-react";

interface NativeAdSidebarProps {
  ad: Ad | null;
  className?: string;
}

export function NativeAdSidebar({ ad, className = "" }: NativeAdSidebarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!ad || !ad.active) return null;

  return (
    <>
      <div
        className={`bg-white border border-hairline hover:border-hairline-strong rounded-xl p-4 transition-all shadow-xs cursor-pointer group flex flex-col justify-between ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-mute bg-canvas-soft px-1.5 py-0.5 rounded border border-hairline">
              Sponsored
            </span>
            <span className="text-xs font-semibold text-ink truncate max-w-[120px]">{ad.sponsor}</span>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5 text-link" />
            </div>
            <h4 className="text-sm font-semibold text-ink group-hover:text-link transition-colors leading-snug">
              {ad.headline}
            </h4>
          </div>

          <p className="text-xs text-body leading-relaxed line-clamp-3 mb-4">
            {ad.description}
          </p>
        </div>

        <div className="pt-3 border-t border-hairline flex items-center justify-between text-xs font-medium text-mute group-hover:text-ink transition-colors">
          <span>Explore Offer</span>
          <ExternalLink className="w-3.5 h-3.5" />
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

