"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Layers,
  ArrowLeft,
  Plus,
  Trash2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  Sparkles,
} from "lucide-react";

export default function NewResourcePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("makerspace");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80");
  const [rules, setRules] = useState("Always clean and power down tool after use. Report any issues to lab technician.");
  const [maxDurationHours, setMaxDurationHours] = useState(4);
  const [requiresApproval, setRequiresApproval] = useState(true);
  const [credentialsInput, setCredentialsInput] = useState("Laser Cutter Safety Training");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const reqCreds = credentialsInput
      ? credentialsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const payload = {
      title,
      category,
      description,
      location,
      photos: photoUrl ? [photoUrl] : [],
      rules,
      maxDurationHours: Number(maxDurationHours),
      requiresApproval,
      requiredCredentials: reqCreds,
      availability: [
        { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
        { dayOfWeek: 5, startTime: "09:00", endTime: "17:00" },
      ],
      status: "active",
    };

    try {
      const res = await fetch("/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to publish resource");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/resources/${data.resource._id}`);
        }, 1200);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/owner/resources"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F1E4D] transition mb-6 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Equipment Portfolio</span>
        </Link>

        <div className="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-2xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#2F6BFF] shadow-xs">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[#0F1E4D] tracking-tight">
                Publish New Equipment or Space
              </h1>
              <p className="text-xs text-slate-500">
                Register campus assets, enforce safety prerequisites, and set availability.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>Listing created successfully! Redirecting...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Equipment / Space Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Epilog Fusion Pro 48 Laser Cutter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                >
                  <option value="makerspace">Makerspace & Prototyping</option>
                  <option value="lab">Research Laboratory</option>
                  <option value="camera">Camera & Media Production</option>
                  <option value="computer">High Performance Computing</option>
                  <option value="testing">Testing & Diagnostic Instrumentation</option>
                  <option value="room">Studio / Brainstorming Room</option>
                  <option value="other">Other Campus Asset</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Location (Building & Room)
                </label>
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Maker Hall, Room 105"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Max Duration (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  required
                  value={maxDurationHours}
                  onChange={(e) => setMaxDurationHours(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Description & Specifications
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail capabilities, supported materials, lenses, or hardware specifications..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Rules & Usage Conditions
              </label>
              <textarea
                rows={2}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Cleaning requirements, consumables policies, safety glasses..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Required Safety Credentials (comma-separated)
                </label>
                <input
                  type="text"
                  value={credentialsInput}
                  onChange={(e) => setCredentialsInput(e.target.value)}
                  placeholder="e.g. 3D Printer Safety Certification, BSL-2 Training"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave empty if no certificate is required.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Photo URL
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#0F1E4D]">Require Owner Approval</div>
                <div className="text-[11px] text-slate-500">
                  When enabled, reservations route through your review queue instead of instant confirmation.
                </div>
              </div>
              <input
                type="checkbox"
                checked={requiresApproval}
                onChange={(e) => setRequiresApproval(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-[#2F6BFF] focus:ring-[#2F6BFF] cursor-pointer"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <Link
                href="/owner/resources"
                className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || success}
                className="px-6 py-2.5 rounded-full bg-[#2F6BFF] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-xs disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Publish Resource Listing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
