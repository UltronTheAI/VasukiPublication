import React from "react";
import type { Metadata } from "next";
import { getActiveAds, selectWeightedAd } from "@/lib/repositories/ads";
import { SavedBooksView } from "@/components/saved/SavedBooksView";
import { publicEnv } from "@/lib/env";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Saved Publications | Vasuki Publication",
  description:
    "Browse your locally saved VasukiSquare publications for offline reading and quick reference.",
  alternates: {
    canonical: `${publicEnv.NEXT_PUBLIC_SITE_URL}/saved`,
  },
  openGraph: {
    title: "Saved Publications | Vasuki Publication",
    description: "Browse your locally saved VasukiSquare publications for offline reading and quick reference.",
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/saved`,
    siteName: "Vasuki Publication",
    type: "website",
    images: [
      {
        url: `${publicEnv.NEXT_PUBLIC_SITE_URL}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "Vasuki Publication Saved Publications",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Saved Publications | Vasuki Publication",
    description: "Browse your locally saved VasukiSquare publications for offline reading and quick reference.",
    images: [`${publicEnv.NEXT_PUBLIC_SITE_URL}/opengraph-image`],
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default async function SavedBooksPage() {
  let bannerAd = null;
  let sidebarAd = null;

  try {
    const [bannerAds, sidebarAds] = await Promise.all([
      getActiveAds("saved_banner"),
      getActiveAds("saved_sidebar"),
    ]);

    bannerAd = selectWeightedAd(bannerAds);
    sidebarAd = selectWeightedAd(sidebarAds);
  } catch {
    // Database fallback
  }

  return <SavedBooksView bannerAd={bannerAd} sidebarAd={sidebarAd} />;
}

