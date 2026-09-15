"use client";

import React from "react";
import { getVasukiIconComponent } from "@/lib/vasuki/icon-map";

interface VasukiIconProps {
  name?: string | null;
  fallback?: string;
  className?: string;
  size?: number | string;
  style?: React.CSSProperties;
}

/**
 * Deterministic Lucide icon renderer for Vasuki publications.
 * Converts persisted icon strings (kebab-case, snake_case, etc.) to safe Lucide SVG icons.
 * Never throws or renders broken markup.
 */
export function VasukiIcon({
  name,
  fallback = "Sparkles",
  className,
  size = 18,
  style,
}: VasukiIconProps) {
  const IconComponent = getVasukiIconComponent(name, fallback);
  return React.createElement(IconComponent, { className, size, style });
}

