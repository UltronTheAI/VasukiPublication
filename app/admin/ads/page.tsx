import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/security/admin-auth";
import { getAllAdsAdmin } from "@/lib/repositories/ads";
import { AdminAdsManager } from "@/components/admin/AdminAdsManager";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Advertisements Management | Vasuki Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminAdsPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect("/admin/login");
  }

  let ads: Awaited<ReturnType<typeof getAllAdsAdmin>> = [];
  try {
    ads = await getAllAdsAdmin();
  } catch (err) {
    console.error("Error loading admin ads:", err);
  }

  return <AdminAdsManager initialAds={ads} />;
}

