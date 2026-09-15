import React from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/security/admin-auth";
import { getAllBooksAdmin } from "@/lib/repositories/books";
import { AdminBooksTable } from "@/components/admin/AdminBooksTable";
import { BookOpen } from "lucide-react";
import type { Book, PaginatedResult } from "@/lib/types/publication";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publications Management | Vasuki Admin",
  robots: {
    index: false,
    follow: false,
  },
};

interface AdminBooksPageProps {
  searchParams?: Promise<{
    q?: string;
    status?: string;
    visibility?: string;
    page?: string;
  }>;
}

export default async function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  const isAuth = await verifyAdminSession();
  if (!isAuth) {
    redirect("/admin/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const query = resolvedParams.q || "";
  const status = resolvedParams.status || "all";
  const visibility = resolvedParams.visibility || "all";
  const rawPage = parseInt(resolvedParams.page || "1", 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? rawPage : 1;

  let result: PaginatedResult<Book> = {
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_previous: false,
  };

  try {
    result = await getAllBooksAdmin({
      search: query,
      status,
      visibility,
      page,
      limit: 20,
    });
  } catch (err) {
    console.error("Error loading admin books:", err);
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-emerald-600" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 font-sans">
              Publications Directory
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {result.total} {result.total === 1 ? "book" : "books"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Search, filter by publication status, configure hero pin ranking, and update metadata.
          </p>
        </div>
      </div>

      {/* Interactive Table with Search, Filter & Quick Pinning */}
      <AdminBooksTable
        result={result}
        currentQuery={query}
        currentStatus={status}
        currentVisibility={visibility}
        currentPage={page}
      />
    </div>
  );
}
