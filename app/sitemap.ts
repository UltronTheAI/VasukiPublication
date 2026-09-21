import type { MetadataRoute } from "next";
import { getSitemapBooks } from "@/lib/repositories/books";
import { publicEnv } from "@/lib/env";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.vasukisquare.cc").replace(/\/+$/, "");

  // Core static public pages (no fake dynamic lastModified)
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const books = await getSitemapBooks();
    const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
      url: `${baseUrl}/book/${encodeURIComponent(book.slug)}`,
      lastModified: book.updated_at ? new Date(book.updated_at) : undefined,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...bookRoutes];
  } catch (error) {
    console.error("[VasukiPublication Sitemap] Failed to fetch books for sitemap:", error);
    return staticRoutes;
  }
}

