import type { MetadataRoute } from "next";
import { getSitemapBooks } from "@/lib/repositories/books";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (publicEnv.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");
  const now = new Date();

  // Core static public pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  try {
    const books = await getSitemapBooks();
    const bookRoutes: MetadataRoute.Sitemap = books.map((book) => ({
      url: `${baseUrl}/book/${encodeURIComponent(book.slug)}`,
      lastModified: book.updated_at ? new Date(book.updated_at) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticRoutes, ...bookRoutes];
  } catch (error) {
    console.error("[VasukiPublication Sitemap] Failed to fetch books for sitemap:", error);
    return staticRoutes;
  }
}

