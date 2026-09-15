"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  updateBookAction,
  updatePinAction,
  deleteBookAction,
  updateCoverAction,
} from "@/app/admin/actions";
import { CoverPreview } from "@/components/cover/CoverPreview";
import {
  ArrowLeft,
  Save,
  Trash2,
  ExternalLink,
  Pin,
  Check,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { Book, Cover, Page } from "@/lib/types/publication";

interface BookEditorProps {
  book: Book;
  cover: Cover | null;
  pages: Page[];
}

type TabType = "metadata" | "publication" | "pinning" | "pages" | "cover" | "danger";

export function BookEditor({ book, cover, pages }: BookEditorProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("metadata");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const bookId = book.id || book._id || "";

  // Form State
  const [formData, setFormData] = useState({
    title: book.title || "",
    subtitle: book.subtitle || "",
    running_title: book.running_title || "",
    author: book.author || "",
    description: book.description || "",
    category: book.category || "",
    keywords: (book.discovery?.keywords || []).join(", "),
    target_audience: book.target_audience || "",
    tone: book.tone || "",
    technical_depth: book.technical_depth || "",
    // Publication
    status: (book.publication?.status || "draft") as "draft" | "published" | "unpublished",
    visibility: (book.publication?.visibility || "public") as "public" | "private",
    // SEO
    seo_title: book.seo?.title || "",
    seo_description: book.seo?.description || "",
    canonical_slug: book.seo?.canonical_slug || book.slug || "",
    // Pinning
    pinned: Boolean(book.featured?.pinned),
    position: book.featured?.position || 1,
  });

  // Cover State
  const initialCoverDesign = (cover?.design || {}) as Record<string, unknown>;
  const [coverData, setCoverData] = useState({
    category_badge: (initialCoverDesign.category_badge as string) || book.category || "",
    author: (cover?.author || book.author || "") as string,
    accent_color: (initialCoverDesign.accent_color as string) || "#00ed64",
    mood: (initialCoverDesign.mood as string) || "Technical & Rigorous",
    visual_subject: (initialCoverDesign.visual_subject as string) || "",
    palette_theme: (initialCoverDesign.palette_theme as string) || "emerald_teal",
  });

  // Danger Zone State
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ---------------------------------------------------------------------------
  // Save Book Metadata
  // ---------------------------------------------------------------------------
  const handleSaveMetadata = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      title: formData.title.trim(),
      subtitle: formData.subtitle.trim() || null,
      running_title: formData.running_title.trim() || null,
      author: formData.author.trim() || null,
      description: formData.description.trim(),
      category: formData.category.trim() || null,
      keywords: formData.keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean),
      target_audience: formData.target_audience.trim() || null,
      tone: formData.tone.trim() || null,
      technical_depth: formData.technical_depth.trim() || null,
      publication: {
        status: formData.status,
        visibility: formData.visibility,
      },
      seo: {
        title: formData.seo_title.trim(),
        description: formData.seo_description.trim(),
        canonical_slug: formData.canonical_slug.trim() || book.slug,
      },
    };

    startTransition(async () => {
      const res = await updateBookAction(bookId, payload);
      if (res.success) {
        setFeedback({ type: "success", message: "Publication metadata saved successfully." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update publication." });
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Save Pin Ranking
  // ---------------------------------------------------------------------------
  const handleSavePinning = async () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updatePinAction(
        bookId,
        formData.pinned,
        formData.pinned ? formData.position : null
      );
      if (res.success) {
        setFeedback({ type: "success", message: "Hero pinning status updated." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update pin position." });
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Save Cover Settings
  // ---------------------------------------------------------------------------
  const handleSaveCover = async () => {
    setFeedback(null);
    startTransition(async () => {
      const res = await updateCoverAction(bookId, {
        ...initialCoverDesign,
        ...coverData,
      });
      if (res.success) {
        setFeedback({ type: "success", message: "Cover artwork configuration updated." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to update cover." });
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Cascade Delete Book
  // ---------------------------------------------------------------------------
  const handleDeleteBook = async () => {
    if (deleteConfirmation.trim().toLowerCase() !== book.title.trim().toLowerCase()) {
      setFeedback({ type: "error", message: "Confirmation title mismatch." });
      return;
    }

    startTransition(async () => {
      const res = await deleteBookAction(bookId, deleteConfirmation);
      if (res.success) {
        router.push("/admin/books");
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete publication." });
        setIsDeleteModalOpen(false);
      }
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/books"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Back to Directory"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-white truncate max-w-md">
                {book.title}
              </h1>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-400">
                /{book.slug}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono">
              ID: {bookId} • Schema v{book.schema_version}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {book.publication.status === "published" && book.publication.visibility === "public" && (
            <Link
              href={`/book/${book.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <span>View Public</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}

          <Link
            href={`/book/${book.slug}/read`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-400 transition-colors"
          >
            <span>Open Reader</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs ${
            feedback.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-red-500/10 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-white font-bold ml-2"
          >
            ×
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("metadata")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "metadata"
              ? "bg-emerald-500 text-[#001e2b]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Metadata & Scope
        </button>
        <button
          onClick={() => setActiveTab("publication")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "publication"
              ? "bg-emerald-500 text-[#001e2b]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Publication & SEO
        </button>
        <button
          onClick={() => setActiveTab("pinning")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "pinning"
              ? "bg-emerald-500 text-[#001e2b]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Hero Pinning
        </button>
        <button
          onClick={() => setActiveTab("pages")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "pages"
              ? "bg-emerald-500 text-[#001e2b]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Pages ({pages.length})
        </button>
        <button
          onClick={() => setActiveTab("cover")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "cover"
              ? "bg-emerald-500 text-[#001e2b]"
              : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
          }`}
        >
          Cover Preview
        </button>
        <button
          onClick={() => setActiveTab("danger")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === "danger"
              ? "bg-red-500/20 text-red-400 border border-red-500/40"
              : "text-slate-400 hover:text-red-400 hover:bg-red-500/10"
          }`}
        >
          Danger Zone
        </button>
      </div>

      {/* =======================================================================
          TAB 1: METADATA & SCOPE
         ======================================================================= */}
      {activeTab === "metadata" && (
        <form onSubmit={handleSaveMetadata} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-800 bg-[#04141d]">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Book Title</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Subtitle</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Author Attribution</label>
              <input
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Running Title (Reader Header)</label>
              <input
                type="text"
                value={formData.running_title}
                onChange={(e) => setFormData({ ...formData, running_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Discovery Keywords (comma-separated)</label>
              <input
                type="text"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">Synopsis & Description</label>
              <textarea
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Target Audience</label>
              <input
                type="text"
                value={formData.target_audience}
                onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Technical Depth</label>
              <input
                type="text"
                value={formData.technical_depth}
                onChange={(e) => setFormData({ ...formData, technical_depth: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Metadata</span>
            </button>
          </div>
        </form>
      )}

      {/* =======================================================================
          TAB 2: PUBLICATION & SEO
         ======================================================================= */}
      {activeTab === "publication" && (
        <form onSubmit={handleSaveMetadata} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-xl border border-slate-800 bg-[#04141d]">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Publication Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "published" | "unpublished" })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="draft">Draft (Hidden from public catalog)</option>
                <option value="published">Published (Publicly accessible if visibility is public)</option>
                <option value="unpublished">Unpublished (Archived)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Visibility Boundary</label>
              <select
                value={formData.visibility}
                onChange={(e) => setFormData({ ...formData, visibility: e.target.value as "public" | "private" })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
              >
                <option value="public">Public (Visible in search & listings)</option>
                <option value="private">Private (Only accessible via admin token)</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300">SEO Meta Title</label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-300">SEO Meta Description</label>
              <textarea
                rows={3}
                value={formData.seo_description}
                onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Publication Settings</span>
            </button>
          </div>
        </form>
      )}

      {/* =======================================================================
          TAB 3: HERO PINNING
         ======================================================================= */}
      {activeTab === "pinning" && (
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-slate-800 bg-[#04141d] space-y-4 max-w-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-semibold text-xs text-slate-200">Spotlight on Homepage Hero</div>
                <div className="text-[11px] text-slate-400">Pin this book to the featured carousel (max 5 slots).</div>
              </div>
              <input
                type="checkbox"
                checked={formData.pinned}
                onChange={(e) => setFormData({ ...formData, pinned: e.target.checked })}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {formData.pinned && (
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-semibold text-slate-300">Pinned Slot Position (1 to 5)</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value, 10) })}
                  className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                >
                  <option value={1}>Position 1 (Hero Lead)</option>
                  <option value={2}>Position 2</option>
                  <option value={3}>Position 3</option>
                  <option value={4}>Position 4</option>
                  <option value={5}>Position 5</option>
                </select>
                <p className="text-[11px] text-slate-500">
                  Duplicate positions are safely resolved by the server automatically.
                </p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSavePinning}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pin className="w-4 h-4" />}
                <span>Apply Pin Settings</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 4: PAGES LIST VIEWER
         ======================================================================= */}
      {activeTab === "pages" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Viewing {pages.length} sequential page documents in MongoDB.</span>
            <span className="font-mono">Zero PDF files required</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-[#04141d] overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-black/20 text-slate-400 font-mono">
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Type / Layout</th>
                  <th className="px-4 py-2.5">Chapter</th>
                  <th className="px-4 py-2.5">Theme</th>
                  <th className="px-4 py-2.5">Blocks</th>
                  <th className="px-4 py-2.5">HTML Cache</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11.5px]">
                {pages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                      No page documents stored for this publication.
                    </td>
                  </tr>
                ) : (
                  pages.map((p) => (
                    <tr key={p.id || p.page_number} className="hover:bg-slate-800/30">
                      <td className="px-4 py-2.5 font-bold text-slate-200">
                        p. {p.page_number}
                      </td>
                      <td className="px-4 py-2.5 text-emerald-400">
                        {p.page_type || p.layout || "editorial"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-300 truncate max-w-[200px]">
                        {p.chapter_title || (p.chapter_number ? `Chapter ${p.chapter_number}` : "—")}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {p.theme || p.style?.theme || "light"}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {p.content?.blocks?.length || 0} blocks
                      </td>
                      <td className="px-4 py-2.5 text-slate-400">
                        {p.html ? `${(p.html.length / 1024).toFixed(1)} KB` : "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 5: COVER PREVIEW & SETTINGS
         ======================================================================= */}
      {activeTab === "cover" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 flex flex-col items-center">
            <h3 className="text-xs font-semibold text-slate-300 mb-3">Live Artwork Preview</h3>
            <CoverPreview
              book={book}
              cover={{
                ...cover,
                id: cover?.id || "preview-cover",
                book_id: bookId,
                title: book.title,
                author: coverData.author,
                width: 1600,
                height: 2560,
                schema_version: 1,
                renderer_version: "0.1.0",
                created_at: new Date(),
                updated_at: new Date(),
                design: {
                  ...initialCoverDesign,
                  ...coverData,
                },
              }}
              size="detail"
              className="shadow-2xl"
            />
          </div>

          <div className="lg:col-span-2 space-y-4 p-5 rounded-xl border border-slate-800 bg-[#04141d]">
            <h3 className="text-xs font-semibold text-slate-200 pb-2 border-b border-slate-800">
              Cover Design Attributes
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Category Badge</label>
              <input
                type="text"
                value={coverData.category_badge}
                onChange={(e) => setCoverData({ ...coverData, category_badge: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Cover Author Line</label>
              <input
                type="text"
                value={coverData.author}
                onChange={(e) => setCoverData({ ...coverData, author: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Accent Color</label>
              <input
                type="text"
                value={coverData.accent_color}
                onChange={(e) => setCoverData({ ...coverData, accent_color: e.target.value })}
                className="w-full px-3 py-2 bg-[#00141d] border border-slate-700/80 rounded-lg text-xs text-slate-100 font-mono focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div className="pt-3">
              <button
                type="button"
                onClick={handleSaveCover}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Update Cover Design</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          TAB 6: DANGER ZONE (SAFE CASCADE DELETE)
         ======================================================================= */}
      {activeTab === "danger" && (
        <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 space-y-4 max-w-xl">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <h3 className="font-bold text-sm">Destructive Cascade Deletion</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Deleting this publication will irreversibly remove the book document, all associated chapter pages, and cover artwork from MongoDB. Unrelated advertisements are strictly preserved.
          </p>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Entire Publication</span>
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl border border-red-500/40 bg-[#00141d] shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-sm text-white">Confirm Permanent Deletion</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action cannot be undone. To confirm, please type the exact publication title below:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs text-emerald-400 select-all">
              {book.title}
            </div>
            <input
              type="text"
              placeholder="Type exact title to confirm..."
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              className="w-full px-3 py-2 bg-[#000d14] border border-red-500/30 rounded-lg text-xs text-white focus:outline-hidden focus:border-red-500 font-mono"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmation("");
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                disabled={
                  isPending ||
                  deleteConfirmation.trim().toLowerCase() !== book.title.trim().toLowerCase()
                }
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold disabled:opacity-30 cursor-pointer shadow-xs"
              >
                {isPending ? "Deleting..." : "Permanently Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
