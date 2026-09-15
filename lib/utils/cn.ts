import { clsx, type ClassValue } from "clsx";

/**
 * Combines conditional CSS class names safely.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

