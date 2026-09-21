import type { MetadataRoute } from "next";
import { publicEnv } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (publicEnv.NEXT_PUBLIC_SITE_URL || "https://www.vasukisquare.cc").replace(/\/+$/, "");

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

