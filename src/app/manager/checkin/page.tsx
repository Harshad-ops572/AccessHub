"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  Star,
  Camera,
  Clock,
  User,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  X,
  Plus,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ManagerCheckinPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data: bookingsData, mutate } = useSWR(
    user ? `/api/bookings` : null,
    fetcher
  );

  const allBookings = bookingsData?.bookings || [];

  const readyForCheckin = allBookings.filter((b: any) => b.status === "approved");
  const readyForReturn = allBookings.filter((b: any) =>
    ["checked_in", "overdue"].includes(b.status)
  );

  // Modal State
  const [activeModal, setActiveModal] = useState<"checkin" | "return" | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [notes, setNotes] = useState("");
  const [photoUrl, setPhotoUrl] = useState("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80");
  const [reportDamage, setReportDamage] = useState(false);
  const [checklist, setChecklist] = useState<Array<{ item: string; passed: boolean }>>([
    { item: "Power cables and adapters present", passed: true },
    { item: "No physical chassis damage or cracks", passed: true },
    { item: "Emergency stop and safety guards operational", passed: true },
    { item: "Build surface / optics clean and unobstructed", passed: true },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenCheckin = (booking: any) => {
    setSelectedBooking(booking);
    setActiveModal("checkin");
    setRating(5);
    setNotes("Equipment inspected in lab. Handover condition verified.");
    setPhotoUrl("https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80");
    setChecklist([
      { item: "Power cables and adapters present", passed: true },
      { item: "No physical chassis damage or cracks", passed: true },
      { item: "Emergency stop and safety guards operational", passed: true },
      { item: "Build surface / optics clean and unobstructed", passed: true },
    ]);
    setErrorMsg("");
  };

  const handleOpenReturn = (booking: any) => {
    setSelectedBooking(booking);
    setActiveModal("return");
    setRating(4); // Default to slightly lower to demonstrate comparison
    setNotes("Returned to tool crib. Minor cosmetic residue on build surface.");
    setPhotoUrl("https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=600&q=80");
    setChecklist([
      { item: "Power cables and adapters present", passed: true },
      { item: "No physical chassis damage or cracks", passed: true },
      { item: "Emergency stop and safety guards operational", passed: true },
      { item: "Build surface / optics clean and unobstructed", passed: false }, // Demonstrates checklist flag
    ]);
    setReportDamage(false);
    setErrorMsg("");
  };

  const handleToggleChecklistItem = (idx: number) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, passed: !item.passed } : item))
    );
  };

  const handleSubmitInspection = async () => {
    if (!selectedBooking || !activeModal) return;
    setSubmitting(true);
    setErrorMsg("");

    const endpoint = `/api/bookings/${selectedBooking._id}/${activeModal}`;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionRating: rating,
          checklist,
          notes,
          photos: photoUrl ? [photoUrl] : [],
          reportDamage,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit inspection");
      } else {
        setActiveModal(null);
        setSelectedBooking(null);
        mutate();
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <ClipboardCheck className="h-4 w-4" />
              <span>Lab Operations & Handover Station</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Check-in & Return Inspections
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify borrower identity, log condition rating photos before handover, and inspect equipment state upon return.
            </p>
          </div>
        </div>

        {/* Section 1: Ready for Check-in */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Awaiting Handover Check-in ({readyForCheckin.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Approved reservations ready for physical release</span>
          </div>

          {readyForCheckin.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              No approved bookings currently awaiting check-in.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {readyForCheckin.map((b: any) => (
                <div
                  key={b._id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                        Ready for Release
                      </span>
                      <span className="text-xs text-slate-500 font-mono">
                        Max {b.resourceId?.maxDurationHours}h
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">
                      {b.resourceId?.title}
                    </h3>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Borrower: <strong className="text-white">{b.userId?.name}</strong> ({b.userId?.department})</div>
                      <div>Location: <span className="text-slate-300">{b.resourceId?.location}</span></div>
                      <div>Slot: {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} &ndash; {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenCheckin(b)}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Perform Check-in Inspection</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Section 2: Ready for Return */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-400" />
              <span>Checked Out & Awaiting Return ({readyForReturn.length})</span>
            </h2>
            <span className="text-xs text-slate-400">Equipment in active circulation</span>
          </div>

          {readyForReturn.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500">
              No equipment currently out for return inspection.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {readyForReturn.map((b: any) => (
                <div
                  key={b._id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between gap-4 shadow-lg"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                        In Use &ndash; Return Handover
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        Due: {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white mb-1">
                      {b.resourceId?.title}
                    </h3>

                    <div className="text-xs text-slate-400 space-y-1">
                      <div>Borrower: <strong className="text-white">{b.userId?.name}</strong></div>
                      <div>Location: <span className="text-slate-300">{b.resourceId?.location}</span></div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleOpenReturn(b)}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                  >
                    <ClipboardCheck className="h-4 w-4" />
                    <span>Record Return Inspection</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Inspection Modal */}
        {activeModal && selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <div className="w-full max-w-xl my-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {activeModal === "checkin" ? "Handover Check-in Inspection" : "Return Inspection & Handover"}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {selectedBooking.resourceId?.title} &bull; Borrower: {selectedBooking.userId?.name}
                  </span>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs">
                  {errorMsg}
                </div>
              )}

              {/* 1. Condition Rating Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Condition Rating (1 to 5 Stars):
                </label>
                <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-slate-700 hover:scale-110 transition"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating
                            ? "text-amber-400 fill-amber-400"
                            : "text-slate-700"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-200">
                    {rating === 5
                      ? "5/5 (Pristine / Flawless)"
                      : rating === 4
                      ? "4/5 (Minor Normal Wear)"
                      : rating === 3
                      ? "3/5 (Noticeable Surface Wear)"
                      : rating === 2
                      ? "2/5 (Functional with Defects)"
                      : "1/5 (Damaged / Needs Service)"}
                  </span>
                </div>
              </div>

              {/* 2. Interactive Safety Checklist */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Physical Safety & Component Checklist:
                </label>
                <div className="space-y-2 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {checklist.map((item, idx) => (
                    <label
                      key={idx}
                      className="flex items-center justify-between text-xs cursor-pointer p-1.5 rounded hover:bg-slate-900 transition"
                    >
                      <span className="text-slate-300">{item.item}</span>
                      <input
                        type="checkbox"
                        checked={item.passed}
                        onChange={() => handleToggleChecklistItem(idx)}
                        className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-indigo-600 cursor-pointer"
                      />
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Inspector Observation Notes:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record any cosmetic scratches, missing consumables, or calibration notes..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 4. Photo URL */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Condition Verification Photo URL:
                </label>
                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Return-specific: Explicit Damage Incident Toggle */}
              {activeModal === "return" && (
                <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-900/60 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-300 block">
                      Flag Damage Incident for Human Review
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Creates an open incident requiring owner/admin resolution.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={reportDamage || rating <= 3}
                    onChange={(e) => setReportDamage(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-amber-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmitInspection}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-lg ${
                    activeModal === "checkin"
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30"
                  }`}
                >
                  {submitting ? (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>
                      {activeModal === "checkin"
                        ? "Confirm Handover Check-in"
                        : "Complete Return Inspection"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
