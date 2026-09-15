"use client";

import React, { useEffect } from "react";
import type { Ad } from "@/lib/types/publication";
import { isSafeUrl, getSafeHostname } from "@/lib/security/url";
import { ExternalLink, X, ShieldAlert } from "lucide-react";

interface AdConfirmationModalProps {
  ad: Ad | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AdConfirmationModal({
  ad,
  isOpen,
  onClose,
}: AdConfirmationModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ad) return null;

  const isValid = isSafeUrl(ad.url);
  const hostname = getSafeHostname(ad.url);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ad-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white border border-hairline rounded-xl shadow-2xl p-6 text-ink overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 rounded-md text-mute hover:text-ink hover:bg-canvas-soft transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with security icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-canvas-soft border border-hairline flex items-center justify-center text-ink shrink-0">
            <ShieldAlert className="w-5 h-5 text-[#f5a623]" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-mute font-semibold">
              External Sponsor
            </span>
            <h2 id="ad-modal-title" className="text-base font-semibold text-ink leading-tight">
              Leaving Vasuki Publication
            </h2>
          </div>
        </div>

        {/* Ad Details */}
        <div className="bg-canvas-soft border border-hairline rounded-lg p-3.5 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-ink">{ad.sponsor}</span>
            <span className="text-[10px] font-mono text-mute bg-white px-2 py-0.5 rounded border border-hairline">
              SPONSORED
            </span>
          </div>
          <h3 className="text-sm font-medium text-ink mb-1">{ad.headline}</h3>
          <p className="text-xs text-body leading-relaxed">{ad.description}</p>
          
          <div className="mt-3 pt-2.5 border-t border-hairline flex items-center justify-between text-xs text-mute font-mono">
            <span>Destination:</span>
            <span className="text-ink font-medium truncate max-w-[200px]">{hostname || "external domain"}</span>
          </div>
        </div>

        <p className="text-[11px] text-mute mb-5 leading-normal">
          Vasuki Publication does not control third-party content. You are being redirected to an external website.
        </p>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium rounded-md border border-hairline text-body hover:text-ink hover:bg-canvas-soft transition-colors cursor-pointer"
          >
            Cancel
          </button>
          
          {isValid ? (
            <a
              href={ad.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-md bg-ink text-white hover:bg-black transition-colors shadow-xs cursor-pointer"
            >
              <span>Visit Website</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <button
              disabled
              className="px-4 py-2 text-xs font-medium rounded-md bg-hairline text-mute cursor-not-allowed"
            >
              Invalid Destination
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

