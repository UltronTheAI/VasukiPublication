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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-white/95 border-b border-slate-200 backdrop-blur-md px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="flex items-center gap-2 text-slate-900 font-bold text-sm group">
            <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-extrabold text-xs group-hover:scale-105 transition-transform shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans font-black text-slate-900">Vasuki Admin</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                Secure
              </span>
            </div>
          </Link>

          <nav className="hidden sm:flex items-center gap-1 text-xs font-semibold font-sans">
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-slate-500" />
              <span>Overview</span>
            </Link>
            <Link
              href="/admin/books"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5 text-slate-500" />
              <span>Publications</span>
            </Link>
            <Link
              href="/admin/ads"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Advertisements</span>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors hidden md:flex font-medium"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
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

