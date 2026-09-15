"use client";

import React, { useState, useTransition } from "react";
import {
  createAdAction,
  updateAdAction,
  deleteAdAction,
} from "@/app/admin/actions";
import { NativeAdBanner } from "@/components/ads/NativeAdBanner";
import { NativeAdSidebar } from "@/components/ads/NativeAdSidebar";
import {
  Megaphone,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import type { Ad } from "@/lib/types/publication";

interface AdminAdsManagerProps {
  initialAds: Ad[];
}

const PLACEMENT_OPTIONS = [
  { id: "home_banner", label: "Homepage Banner" },
  { id: "home_sidebar", label: "Homepage Sidebar" },
  { id: "saved_banner", label: "Saved Books Banner" },
  { id: "saved_sidebar", label: "Saved Books Sidebar" },
];

export function AdminAdsManager({ initialAds }: AdminAdsManagerProps) {
  const [ads, setAds] = useState<Ad[]>(initialAds);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [previewPlacement, setPreviewPlacement] = useState<"banner" | "sidebar">("banner");

  const [formValues, setFormValues] = useState({
    title: "",
    headline: "",
    description: "",
    sponsor: "",
    url: "",
    placements: ["home_banner"],
    priority: 1,
    active: true,
    starts_at: "",
    ends_at: "",
  });

  const openCreateModal = () => {
    setEditingAd(null);
    setFormValues({
      title: "",
      headline: "",
      description: "",
      sponsor: "",
      url: "",
      placements: ["home_banner"],
      priority: 1,
      active: true,
      starts_at: "",
      ends_at: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ad: Ad) => {
    setEditingAd(ad);
    setFormValues({
      title: ad.title || "",
      headline: ad.headline || "",
      description: ad.description || "",
      sponsor: ad.sponsor || "",
      url: ad.url || "",
      placements: (ad.placements as string[]) || ["home_banner"],
      priority: ad.priority || 1,
      active: Boolean(ad.active),
      starts_at: ad.starts_at ? new Date(ad.starts_at).toISOString().split("T")[0] : "",
      ends_at: ad.ends_at ? new Date(ad.ends_at).toISOString().split("T")[0] : "",
    });
    setIsModalOpen(true);
  };

  const handleSaveAd = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const payload = {
      title: formValues.title.trim(),
      headline: formValues.headline.trim(),
      description: formValues.description.trim(),
      sponsor: formValues.sponsor.trim(),
      url: formValues.url.trim(),
      placements: formValues.placements,
      priority: Number(formValues.priority),
      active: Boolean(formValues.active),
      starts_at: formValues.starts_at ? new Date(formValues.starts_at) : null,
      ends_at: formValues.ends_at ? new Date(formValues.ends_at) : null,
    };

    startTransition(async () => {
      if (editingAd) {
        const res = await updateAdAction(editingAd.id, payload);
        if (res.success) {
          setAds((prev) =>
            prev.map((a) => (a.id === editingAd.id ? ({ ...a, ...payload } as Ad) : a))
          );
          setFeedback({ type: "success", message: "Advertisement updated successfully." });
          setIsModalOpen(false);
        } else {
          setFeedback({ type: "error", message: res.error || "Failed to update ad." });
        }
      } else {
        const res = await createAdAction(payload);
        if (res.success) {
          setFeedback({ type: "success", message: "Advertisement created successfully." });
          setIsModalOpen(false);
          // Refresh list
          window.location.reload();
        } else {
          setFeedback({ type: "error", message: res.error || "Failed to create ad." });
        }
      }
    });
  };

  const handleDeleteAd = async (adId: string) => {
    if (!window.confirm("Are you sure you want to delete this advertisement?")) {
      return;
    }

    startTransition(async () => {
      const res = await deleteAdAction(adId);
      if (res.success) {
        setAds((prev) => prev.filter((a) => a.id !== adId));
        setFeedback({ type: "success", message: "Advertisement deleted." });
      } else {
        setFeedback({ type: "error", message: res.error || "Failed to delete ad." });
      }
    });
  };

  const previewAdMock: Ad = {
    id: editingAd?.id || "preview-ad",
    title: formValues.title || "Preview Ad Title",
    headline: formValues.headline || "Preview Headline Display",
    description: formValues.description || "Preview description for native advertisement slot.",
    sponsor: formValues.sponsor || "Example Sponsor",
    url: formValues.url || "https://example.com",
    placements: formValues.placements,
    priority: formValues.priority,
    active: formValues.active,
    stats: { impressions: 0, clicks: 0 },
    created_at: new Date(),
    updated_at: new Date(),
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Megaphone className="w-4 h-4 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Native Advertisements
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
              {ads.length} {ads.length === 1 ? "ad" : "ads"}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Configure restrained native sponsor slots for homepage and saved books spaces.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Ad</span>
        </button>
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

      {/* Advertisements Table */}
      <div className="rounded-xl border border-slate-800 bg-[#04141d] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-black/20 text-slate-400 font-mono">
                <th className="px-4 py-3">Sponsor / Title</th>
                <th className="px-4 py-3">Placements</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Impressions</th>
                <th className="px-4 py-3">Clicks</th>
                <th className="px-4 py-3">CTR</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-500">
                    No native advertisements configured yet.
                  </td>
                </tr>
              ) : (
                ads.map((ad) => {
                  const impressions = ad.stats?.impressions || 0;
                  const clicks = ad.stats?.clicks || 0;
                  const ctr = impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : "0.00";

                  return (
                    <tr key={ad.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Sponsor & Title */}
                      <td className="px-4 py-3 min-w-[200px]">
                        <div className="font-semibold text-slate-100">{ad.headline}</div>
                        <div className="text-[11px] text-emerald-400 font-medium">{ad.sponsor}</div>
                        <a
                          href={ad.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-[10.5px] font-mono text-slate-500 hover:text-slate-300 truncate max-w-[240px] block mt-0.5"
                        >
                          {ad.url}
                        </a>
                      </td>

                      {/* Placements */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ad.placements?.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-slate-800 border border-slate-700 text-slate-300"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                          P{ad.priority}
                        </span>
                      </td>

                      {/* Active Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                            ad.active
                              ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                              : "bg-slate-700/40 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {ad.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          <span>{ad.active ? "Active" : "Paused"}</span>
                        </span>
                      </td>

                      {/* Impressions */}
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        {impressions.toLocaleString()}
                      </td>

                      {/* Clicks */}
                      <td className="px-4 py-3 font-mono text-slate-300 whitespace-nowrap">
                        {clicks.toLocaleString()}
                      </td>

                      {/* CTR */}
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-400 whitespace-nowrap">
                        {ctr}%
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEditModal(ad)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Ad"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAd(ad.id)}
                            disabled={isPending}
                            className="p-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                            title="Delete Ad"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl p-6 rounded-2xl border border-slate-800 bg-[#00141d] shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">
                  {editingAd ? "Edit Advertisement" : "Create Native Advertisement"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Form Side */}
              <form onSubmit={handleSaveAd} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Internal Title</label>
                  <input
                    type="text"
                    required
                    value={formValues.title}
                    onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    placeholder="e.g. Q1 Developer Tool Campaign"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Sponsor Name</label>
                  <input
                    type="text"
                    required
                    value={formValues.sponsor}
                    onChange={(e) => setFormValues({ ...formValues, sponsor: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    placeholder="e.g. Supabase, MongoDB, Vercel"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Headline</label>
                  <input
                    type="text"
                    required
                    value={formValues.headline}
                    onChange={(e) => setFormValues({ ...formValues, headline: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    placeholder="e.g. Build faster with distributed databases"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Description</label>
                  <textarea
                    rows={2}
                    required
                    value={formValues.description}
                    onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500"
                    placeholder="Concise value proposition for developers..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Destination URL (http:// or https:// only)
                  </label>
                  <input
                    type="url"
                    required
                    value={formValues.url}
                    onChange={(e) => setFormValues({ ...formValues, url: e.target.value })}
                    className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 font-mono focus:outline-hidden focus:border-emerald-500"
                    placeholder="https://sponsor.com/offer"
                  />
                </div>

                {/* Placements */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-300 block">Placements</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PLACEMENT_OPTIONS.map((opt) => {
                      const checked = formValues.placements.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                            checked
                              ? "bg-emerald-500/15 border-emerald-500 text-emerald-300"
                              : "bg-[#000d14] border-slate-800 text-slate-400"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormValues({
                                  ...formValues,
                                  placements: [...formValues.placements, opt.id],
                                });
                              } else {
                                setFormValues({
                                  ...formValues,
                                  placements: formValues.placements.filter((p) => p !== opt.id),
                                });
                              }
                            }}
                            className="w-3.5 h-3.5 accent-emerald-500 rounded"
                          />
                          <span>{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Priority Weight</label>
                    <select
                      value={formValues.priority}
                      onChange={(e) => setFormValues({ ...formValues, priority: parseInt(e.target.value, 10) })}
                      className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={1}>Priority 1 (Weight 10)</option>
                      <option value={2}>Priority 2 (Weight 5)</option>
                      <option value={3}>Priority 3 (Weight 2)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">Status</label>
                    <select
                      value={formValues.active ? "active" : "paused"}
                      onChange={(e) => setFormValues({ ...formValues, active: e.target.value === "active" })}
                      className="w-full px-3 py-1.5 bg-[#000d14] border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-hidden focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="active">Active (Eligible for delivery)</option>
                      <option value="paused">Paused</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPending || formValues.placements.length === 0}
                    className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-[#001e2b] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                  >
                    {isPending ? "Saving..." : editingAd ? "Save Changes" : "Create Ad"}
                  </button>
                </div>
              </form>

              {/* Live Preview Side */}
              <div className="space-y-4 p-4 rounded-xl border border-slate-800 bg-[#000d14]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
                  <span className="font-semibold text-slate-300">Live Component Preview</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement("banner")}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-mono cursor-pointer ${
                        previewPlacement === "banner"
                          ? "bg-emerald-500 text-[#001e2b] font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Banner
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewPlacement("sidebar")}
                      className={`px-2 py-0.5 rounded text-[10.5px] font-mono cursor-pointer ${
                        previewPlacement === "sidebar"
                          ? "bg-emerald-500 text-[#001e2b] font-bold"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      Sidebar
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-ink">
                  {previewPlacement === "banner" ? (
                    <NativeAdBanner ad={previewAdMock} />
                  ) : (
                    <div className="max-w-xs mx-auto">
                      <NativeAdSidebar ad={previewAdMock} />
                    </div>
                  )}
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed italic">
                  Preview renders using the website&apos;s actual native advertisement components and safe confirmation modal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
