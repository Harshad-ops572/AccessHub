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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Inbox className="h-4 w-4" />
              <span>Owner Approval Queue</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Review Reservation Requests
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Verify research purposes, inspect student safety credentials, and approve or waitlist slots with auditable reasons.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300">
              <strong className="text-white">{pendingBookings.length}</strong> requests pending review
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : pendingBookings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-md mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">All caught up!</h3>
            <p className="text-xs text-slate-400 mb-4">
              There are no pending equipment reservation requests awaiting your review.
            </p>
            <Link
              href="/owner/resources"
              className="text-xs font-semibold text-indigo-400 hover:underline"
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
                  className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-xl"
                >
                  <div className="grid lg:grid-cols-12 gap-6 items-start">
                    {/* Left Info: Resource & Requester */}
                    <div className="lg:col-span-8 space-y-4">
                      {/* Resource Title & Slot */}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-950 text-indigo-300 border border-indigo-800">
                            {b.resourceId?.category || "Equipment"}
                          </span>
                          <h3 className="text-lg font-bold text-white">
                            {b.resourceId?.title}
                          </h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 mt-1">
                          <span className="flex items-center gap-1 font-medium text-indigo-400">
                            <Calendar className="h-3.5 w-3.5" />
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
                      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-indigo-400" />
                            <span className="font-semibold text-white">{b.userId?.name}</span>
                            <span className="text-slate-500 font-mono">({b.userId?.email})</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            Dept: <strong className="text-slate-200">{b.userId?.department}</strong>
                          </span>
                        </div>

                        {/* Quota & Strikes Breakdown */}
                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                          <span>
                            Weekly Quota:{" "}
                            <strong className="text-slate-200">
                              {b.userId?.weeklyHoursUsed || 0} / 8 hrs
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span>
                            Penalty Strikes:{" "}
                            <strong className={b.userId?.strikes > 0 ? "text-red-400" : "text-emerald-400"}>
                              {b.userId?.strikes || 0}
                            </strong>
                          </span>
                          <span>&bull;</span>
                          <span className="flex items-center gap-1 text-emerald-400">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>Safety Verified</span>
                          </span>
                        </div>
                      </div>

                      {/* Purpose */}
                      <div>
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-1">
                          Research / Project Purpose
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed bg-slate-800/40 p-3 rounded-lg border border-slate-700/50">
                          &ldquo;{b.purpose}&rdquo;
                        </p>
                      </div>
                    </div>

                    {/* Right Actions Column */}
                    <div className="lg:col-span-4 flex flex-col justify-between h-full pt-4 lg:pt-0 lg:pl-6 border-t lg:border-t-0 lg:border-l border-slate-800 space-y-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-300 mb-2">
                          Owner Decision Control
                        </div>
                        <p className="text-[11px] text-slate-400 mb-4">
                          All decisions require a recorded reason for full audit transparency.
                        </p>
                      </div>

                      <div className="space-y-2">
                        {/* Approve */}
                        <button
                          onClick={() => handleOpenDecisionModal(b, "approve")}
                          className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve Reservation</span>
                        </button>

                        {/* Waitlist */}
                        <button
                          onClick={() => handleOpenDecisionModal(b, "waitlist")}
                          className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                        >
                          <Clock className="h-4 w-4" />
                          <span>Waitlist Request</span>
                        </button>

                        {/* Reject */}
                        <button
                          onClick={() => handleOpenDecisionModal(b, "reject")}
                          className="w-full py-2 px-3 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  {decisionType === "approve" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : decisionType === "waitlist" ? (
                    <Clock className="h-5 w-5 text-amber-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-400" />
                  )}
                  <h3 className="text-base font-bold text-white capitalize">
                    {decisionType} Reservation Request
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-slate-400 hover:text-white text-xs"
                >
                  Close
                </button>
              </div>

              <div>
                <p className="text-xs text-slate-300 mb-2">
                  Action for: <strong className="text-white">{selectedBooking.resourceId?.title}</strong> by{" "}
                  <strong className="text-white">{selectedBooking.userId?.name}</strong>.
                </p>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mandatory Decision Reason (shown in student timeline & audit log):
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this request is being approved, rejected, or waitlisted..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {actionError && (
                <div className="p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs">
                  {actionError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submitting || !reason.trim()}
                  onClick={handleConfirmDecision}
                  className={`px-4 py-2 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 disabled:opacity-50 ${
                    decisionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : decisionType === "waitlist"
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-red-600 hover:bg-red-500"
                  }`}
                >
                  {submitting ? (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
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
