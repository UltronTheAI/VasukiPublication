"use client";

import React, { useMemo } from "react";
import { extractCleanPageHtml } from "@/lib/security/html";

interface VasukiHtmlRendererProps {
  html: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * High-performance, secure HTML renderer for pre-rendered VasukiSquare page markup.
 * Strictly sanitizes HTML to prevent XSS (strips <script>, <iframe>, event listeners, javascript: URLs)
 * and strips outer document wrapper tags (<!DOCTYPE>, <html>, <head>, <body>) to ensure clean hydration.
 */
export function VasukiHtmlRenderer({ html, className = "", style }: VasukiHtmlRendererProps) {
  const safeHtml = useMemo(() => {
    if (!html || typeof html !== "string") return "";
    return extractCleanPageHtml(html);
  }, [html]);

  if (!safeHtml) return null;

  return (
    <div
      className={`vasuki-html-container leading-relaxed break-words ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
      suppressHydrationWarning
    />
  );
}

