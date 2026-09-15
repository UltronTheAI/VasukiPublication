import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (publicEnv.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/+$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*", "/saved"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

