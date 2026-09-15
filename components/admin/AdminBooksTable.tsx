"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePinAction } from "@/app/admin/actions";
import {
  Search,
  Pencil,
  ExternalLink,
  Pin,
  PinOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
} from "lucide-react";
import type { Book, PaginatedResult } from "@/lib/types/publication";

interface AdminBooksTableProps {
  result: PaginatedResult<Book>;
  currentQuery: string;
  currentStatus: string;
  currentVisibility: string;
  currentPage: number;
}

export function AdminBooksTable({
  result,
  currentQuery,
  currentStatus,
  currentVisibility,
  currentPage,
}: AdminBooksTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(currentQuery);
  const [actionError, setActionError] = useState<string | null>(null);

  function applyFilters(newQuery?: string, newStatus?: string, newVis?: string, newPage?: number) {
    const params = new URLSearchParams();
    const q = newQuery !== undefined ? newQuery : searchTerm;
    const s = newStatus !== undefined ? newStatus : currentStatus;
    const v = newVis !== undefined ? newVis : currentVisibility;
    const p = newPage !== undefined ? newPage : 1;

    if (q.trim()) params.set("q", q.trim());
    if (s && s !== "all") params.set("status", s);
    if (v && v !== "all") params.set("visibility", v);
    if (p > 1) params.set("page", p.toString());

    startTransition(() => {
      router.push(`/admin/books?${params.toString()}`);
    });
  }

  const handlePinToggle = async (book: Book) => {
    setActionError(null);
    const bookId = book.id || book._id || "";
    const isCurrentlyPinned = Boolean(book.featured?.pinned);

    startTransition(async () => {
      const res = await updatePinAction(bookId, !isCurrentlyPinned, isCurrentlyPinned ? null : 1);
      if (!res.success) {
        setActionError(res.error || "Failed to update pin ranking.");
      }
    });
  };

  return (
    <div className="space-y-4">
      {actionError && (
        <div className="p-3 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs flex items-center justify-between">
          <span>{actionError}</span>
          <button
            onClick={() => setActionError(null)}
            className="text-red-400 hover:text-white font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyFilters(searchTerm, currentStatus, currentVisibility, 1);
          }}
          className="relative w-full md:w-80"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, slug, author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-emerald-500 transition-colors"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Status Dropdown */}
          <select
            value={currentStatus}
            onChange={(e) => applyFilters(undefined, e.target.value, undefined, 1)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="unpublished">Unpublished</option>
          </select>

          {/* Visibility Dropdown */}
          <select
            value={currentVisibility}
            onChange={(e) => applyFilters(undefined, undefined, e.target.value, 1)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:outline-hidden focus:bg-white focus:border-emerald-500 cursor-pointer"
          >
            <option value="all">All Visibility</option>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>

          {isPending && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </div>
      </div>

      {/* Publications Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono">
                <th className="px-4 py-3 font-semibold">Publication</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Visibility</th>
                <th className="px-4 py-3 font-semibold">Pages</th>
                <th className="px-4 py-3 font-semibold">Pinned</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {result.items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No publications matching the current filters.
                  </td>
                </tr>
              ) : (
                result.items.map((book) => {
                  const bookId = book.id || book._id || "";
                  const isPinned = Boolean(book.featured?.pinned);
                  const isPubliclyVisible =
                    book.publication.status === "published" &&
                    book.publication.visibility === "public";

                  return (
                    <tr
                      key={book.slug}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Title & Slug */}
                      <td className="px-4 py-3 min-w-[220px]">
                        <div className="font-semibold text-slate-900 mb-0.5">
                          {book.title}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                          <span>/{book.slug}</span>
                          {book.category && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700">{book.category}</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            book.publication.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : book.publication.status === "draft"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {book.publication.status}
                        </span>
                      </td>

                      {/* Visibility */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            book.publication.visibility === "public"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {book.publication.visibility}
                        </span>
                      </td>

                      {/* Page Count */}
                      <td className="px-4 py-3 whitespace-nowrap font-mono text-slate-700">
                        <div className="flex items-center gap-1">
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>{book.page_count || 0}</span>
                        </div>
                      </td>

                      {/* Hero Pin Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isPinned ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-bold">
                            <Pin className="w-3 h-3" />
                            <span>#{book.featured?.position || "1"}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-mono">—</span>
                        )}
                      </td>

                      {/* Updated Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-[11px] font-mono">
                        {book.updated_at
                          ? new Date(book.updated_at).toLocaleDateString()
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Quick Pin Toggle */}
                          <button
                            onClick={() => handlePinToggle(book)}
                            disabled={isPending}
                            title={isPinned ? "Unpin from Hero" : "Pin to Hero (1..5)"}
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              isPinned
                                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                            }`}
                          >
                            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Details */}
                          <Link
                            href={`/admin/books/${bookId}`}
                            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors"
                            title="Edit Publication"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>

                          {/* Public View */}
                          {isPubliclyVisible && (
                            <Link
                              href={`/book/${book.slug}`}
                              target="_blank"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors"
                              title="View Public Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {result.total_pages > 1 && (
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>
              Page {result.page} of {result.total_pages} ({result.total} total)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => applyFilters(undefined, undefined, undefined, currentPage - 1)}
                disabled={!result.has_previous || isPending}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => applyFilters(undefined, undefined, undefined, currentPage + 1)}
                disabled={!result.has_next || isPending}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

