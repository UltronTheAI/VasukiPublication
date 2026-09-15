import React from "react";
import Link from "next/link";
import { verifyAdminSession } from "@/lib/security/admin-auth";
import { logoutAdminAction } from "./actions";
import {
  LayoutDashboard,
  BookOpen,
  Megaphone,
  LogOut,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAuth = await verifyAdminSession();

  if (!isAuth) {
    return <div className="min-h-screen bg-canvas-soft">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1319] text-slate-100">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[#071015]/95 border-b border-slate-800 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 text-slate-100 font-bold text-sm group">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-[#001e2b] flex items-center justify-center font-extrabold text-xs group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span>Vasuki Admin</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Secure
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-xs font-medium">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </Link>
            <Link
              href="/admin/books"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Publications</span>
            </Link>
            <Link
              href="/admin/ads"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Advertisements</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors hidden md:flex"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

