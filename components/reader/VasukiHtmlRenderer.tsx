"use client";

import React, { useMemo } from "react";
import { sanitizeHtml } from "@/lib/security/html";

interface VasukiHtmlRendererProps {
  html: string;
  className?: string;
}

/**
 * High-performance, secure HTML renderer for pre-rendered VasukiSquare page markup.
 * Strictly sanitizes HTML to prevent XSS (strips <script>, <iframe>, event listeners, javascript: URLs)
 * while preserving styling classes and semantic markup.
 */
export function VasukiHtmlRenderer({ html, className = "" }: VasukiHtmlRendererProps) {
  const safeHtml = useMemo(() => {
    if (!html || typeof html !== "string") return "";
    return sanitizeHtml(html);
  }, [html]);

  if (!safeHtml) return null;

  return (
    <div
      className={`vasuki-html-container leading-relaxed break-words ${className}`}
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}

