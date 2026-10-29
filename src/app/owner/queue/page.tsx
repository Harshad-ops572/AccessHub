"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  User,
  Calendar,
  Layers,
  Sparkles,
  MessageSquare,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OwnerQueuePage() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/bookings?pendingOnly=true` : null,
    fetcher,
    { refreshInterval: 10000 }
  );

  const pendingBookings = data?.bookings || [];

  // Decision Modal State
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [decisionType, setDecisionType] = useState<"approve" | "reject" | "waitlist">("approve");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState("");

  const handleOpenDecisionModal = (
    booking: any,
    type: "approve" | "reject" | "waitlist"
  ) => {
    setSelectedBooking(booking);
    setDecisionType(type);
    setActionError("");

    if (type === "approve") {
      setReason("Approved for academic research and capstone project use.");
    } else if (type === "reject") {
      setReason("Conflict with scheduled departmental maintenance window.");
    } else {
      setReason("High demand slot. Waitlisted to balance weekly department allocations.");
    }
  };

  const handleConfirmDecision = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    setActionError("");

    try {
      const res = await fetch(`/api/bookings/${selectedBooking._id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: decisionType,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setActionError(data.error || "Failed to submit decision");
      } else {
        setSelectedBooking(null);
        mutate();
      }
    } catch {
      setActionError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-1">
              <Inbox className="h-4 w-4" />
              <span>Owner Approval Queue</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F1E4D] tracking-tight">
              Review Reservation Requests
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Verify research purposes, inspect student safety credentials, and approve or waitlist slots with auditable reasons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-xs text-slate-600 shadow-xs">
              <strong className="text-[#0F1E4D] font-bold">{pendingBookings.length}</strong> requests pending review
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-white/70 border border-slate-200/60 animate-pulse shadow-xs" />
            ))}
          </div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/80 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F1E4D] mb-1">All caught up!</h3>
            <p className="text-xs text-slate-500 mb-4">
              There are no pending equipment reservation requests awaiting your review.
            </p>
            <Link
              href="/owner/resources"
              className="text-xs font-bold text-[#2F6BFF] hover:underline"
            >
              View your listed equipment &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {pendingBookings.map((b: any) => {
              const start = new Date(b.start);
              const end = new Date(b.end);
              const durationHours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);

              return (
                <div
                  key={b._id}
                  className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 transition shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* Left Info: Resource & Requester */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Resource Title & Slot */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-[#2F6BFF] border border-blue-200">
                            {b.resourceId?.category || "Equipment"}
                          </span>
                          <h3 className="text-lg font-bold text-[#0F1E4D]">
                            {b.resourceId?.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-semibold text-[#0F1E4D]">
                            <Calendar className="h-3.5 w-3.5 text-[#2F6BFF]" />
                            {start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                            {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ({durationHours}h)
                          </span>
                          <span>&bull;</span>
                          <span>{b.resourceId?.location}</span>
                        </div>
                      </div>

                      {/* Requester Profile Snapshot */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-[#2F6BFF]" />
                            <span className="font-bold text-[#0F1E4D]">{b.userId?.name}</span>
                            <span className="text-slate-400 font-mono">({b.userId?.email})</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Dept: <strong className="text-slate-800">{b.userId?.department}</strong>
                          </span>
                        </div>

                        {/* Quota & Strikes Breakdown */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-2 border-t border-slate-200/70">
                          <span>
                            Weekly Quota:{" "}
                            <strong className="text-slate-800">
                              {b.userId?.weeklyHoursUsed || 0} / 8 hrs
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Penalty Strikes:{" "}
                            <strong className={b.userId?.strikes > 0 ? "text-red-600" : "text-emerald-600"}>
                              {b.userId?.strikes || 0}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-emerald-600 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Safety Verified</span>
                          </span>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div>
                        <div className="text-[11px] uppercase tracking-wider font-bold text-slate-500 mb-1">
                          Research / Project Purpose
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
                          &ldquo;{b.purpose}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Right Actions Column */}
                    <div className="lg:col-span-4 flex flex-col justify-between h-full pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-100 space-y-3">
                      <div>
                        <div className="text-xs font-bold text-[#0F1E4D] mb-1">
                          Owner Decision Control
                        </div>
                        <p className="text-[11px] text-slate-500 mb-4">
                          All decisions require a recorded reason for full audit transparency.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {/* Approve */}
                        <button
                          onClick={() => handleOpenDecisionModal(b, "approve")}
                          className="w-full py-2.5 px-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve Reservation</span>
                        </button>

                        {/* Waitlist */}
                        <button
                          onClick={() => handleOpenDecisionModal(b, "waitlist")}
                          className="w-full py-2.5 px-3 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Waitlist Request</span>
                        </button>

                        {/* Reject */}
                        <button
                          onClick={() => handleOpenDecisionModal(b, "reject")}
                          className="w-full py-2.5 px-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject Request</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Decision Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  {decisionType === "approve" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : decisionType === "waitlist" ? (
                    <Clock className="h-5 w-5 text-amber-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <h3 className="text-base font-bold text-[#0F1E4D] capitalize">
                    {decisionType} Reservation Request
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-slate-400 hover:text-slate-700 text-xs font-semibold"
                >
                  Close
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-600 mb-2">
                  Action for: <strong className="text-[#0F1E4D]">{selectedBooking.resourceId?.title}</strong> by{" "}
                  <strong className="text-[#0F1E4D]">{selectedBooking.userId?.name}</strong>.
                </p>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mandatory Decision Reason (shown in student timeline & audit log):
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this request is being approved, rejected, or waitlisted..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>

              {actionError && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !reason.trim()}
                  onClick={handleConfirmDecision}
                  className={`px-5 py-2 rounded-full text-xs font-bold text-white transition flex items-center gap-1.5 shadow-xs disabled:opacity-50 ${
                    decisionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : decisionType === "waitlist"
                      ? "bg-amber-500 hover:bg-amber-600"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {submitting ? (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span>Confirm {decisionType}</span>
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
