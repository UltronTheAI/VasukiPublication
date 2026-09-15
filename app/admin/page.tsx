import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/security/admin-auth";
import { getAdminOverviewStats, getPinnedBooks } from "@/lib/repositories/books";
import { getAllAdsAdmin } from "@/lib/repositories/ads";
import {
  BookOpen,
  Globe,
  FileEdit,
  Lock,
  Pin,
  Megaphone,
  ArrowRight,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Overview | Vasuki Publication",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminOverviewPage() {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect("/admin/login");
  }

  let stats = {
    totalBooks: 0,
    publishedBooks: 0,
    draftBooks: 0,
    privateBooks: 0,
    pinnedBooksCount: 0,
    activeAdsCount: 0,
  };
  let pinnedBooks: Awaited<ReturnType<typeof getPinnedBooks>> = [];
  let adsCount = 0;

  try {
    const [overviewStats, pinned, ads] = await Promise.all([
      getAdminOverviewStats(),
      getPinnedBooks(),
      getAllAdsAdmin(),
    ]);

    pinnedBooks = pinned;
    adsCount = ads.filter((a) => a.active).length;
    stats = {
      ...overviewStats,
      activeAdsCount: adsCount,
    };
  } catch (err) {
    console.error("Error loading admin stats:", err);
  }

  const statCards = [
    {
      title: "Total Publications",
      value: stats.totalBooks,
      icon: BookOpen,
      color: "text-slate-200",
      bg: "bg-slate-800/80",
      desc: "All MongoDB book records",
    },
    {
      title: "Publicly Live",
      value: stats.publishedBooks,
      icon: Globe,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      desc: "Status: published & public",
    },
    {
      title: "Draft Books",
      value: stats.draftBooks,
      icon: FileEdit,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      desc: "Hidden from public catalog",
    },
    {
      title: "Private Access",
      value: stats.privateBooks,
      icon: Lock,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      desc: "Restricted visibility",
    },
    {
      title: "Pinned Showcase",
      value: `${stats.pinnedBooksCount} / 5`,
      icon: Pin,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
      desc: "Hero spotlight slots",
    },
    {
      title: "Active Native Ads",
      value: stats.activeAdsCount,
      icon: Megaphone,
      color: "text-teal-400",
      bg: "bg-teal-500/10",
      desc: "Restrained sponsors",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-[#072a3b] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
              Operational Management Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Publication Management Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Inspect MongoDB publications, manage pinned hero books, review structured page layouts, and configure native advertisements.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/books"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all shadow-xs"
          >
            <BookOpen className="w-4 h-4" />
            <span>Manage Publications</span>
          </Link>
          <Link
            href="/admin/ads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all shadow-xs"
          >
            <Megaphone className="w-4 h-4" />
            <span>Manage Ads</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((c, idx) => {
          const IconComponent = c.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-xl bg-[#04141d] border border-slate-800/80 shadow-xs flex items-start justify-between"
            >
              <div>
                <span className="text-xs font-medium text-slate-400 block mb-1">
                  {c.title}
                </span>
                <span className="text-2xl font-bold font-mono text-slate-100 block">
                  {c.value}
                </span>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {c.desc}
                </span>
              </div>
              <div className={`p-2.5 rounded-xl ${c.bg} ${c.color}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Pinned Publications Section */}
      <div className="p-6 rounded-2xl bg-[#04141d] border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pin className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100">
              Hero Pinned Publications ({pinnedBooks.length} of 5)
            </h2>
          </div>
          <Link
            href="/admin/books"
            className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Manage Pins</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {pinnedBooks.length === 0 ? (
          <div className="p-6 rounded-xl border border-slate-800 bg-[#000d14] text-center text-xs text-slate-500">
            No pinned books selected. Visit the publications page to pin books to the homepage hero.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {pinnedBooks.map((book) => (
              <div
                key={book.slug}
                className="p-3.5 rounded-xl border border-slate-800 bg-[#001018] flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-[#001e2b] font-mono text-[10px] font-bold flex items-center justify-center">
                      {book.featured?.position || "★"}
                    </span>
                    <span className="text-xs font-semibold text-slate-200 truncate">
                      {book.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block truncate">
                    /{book.slug}
                  </span>
                </div>
                <Link
                  href={`/admin/books/${book.id || book._id}`}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                  title="Edit Book"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Engine & Database Architecture Notes */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-slate-900/30 text-xs text-slate-400 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>MongoDB connection active • Authoring Engine: VasukiSquare • Presentation: VasukiPublication</span>
        </div>
        <span className="font-mono text-[11px] text-slate-500 hidden sm:inline">Next.js 16 App Router</span>
      </div>
    </div>
  );
}

