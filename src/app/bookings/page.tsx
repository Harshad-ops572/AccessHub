"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function UserBookingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/bookings` : null,
    fetcher
  );

  const { data: waitlistData, mutate: mutateWaitlist } = useSWR(
    user ? `/api/waitlist` : null,
    fetcher
  );

  const bookings = data?.bookings || [];
  const waitlist = waitlistData?.waitlist || [];

  // Cancellation Modal
  const [cancellingBooking, setCancellingBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("Project schedule shifted");
  const [cancelling, setCancelling] = useState(false);

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;
    setCancelling(true);

    try {
      await fetch(`/api/bookings/${cancellingBooking._id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason }),
      });
      setCancellingBooking(null);
      mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
      case "pending_review":
        return "bg-amber-950/80 text-amber-300 border-amber-700/60";
      case "checked_in":
        return "bg-cyan-950/80 text-cyan-300 border-cyan-700/60";
      case "returned":
      case "closed":
        return "bg-slate-800 text-slate-300 border-slate-700";
      case "waitlisted":
        return "bg-purple-950/80 text-purple-300 border-purple-700/60";
      case "overdue":
      case "rejected":
      case "cancelled":
        return "bg-red-950/80 text-red-300 border-red-700/60";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  const weeklyHoursUsed = user?.weeklyHoursUsed || 0;
  const maxWeeklyHours = 8;
  const quotaPercentage = Math.min(100, Math.round((weeklyHoursUsed / maxWeeklyHours) * 100));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Calendar className="h-4 w-4" />
              <span>Campus Reservations</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              My Equipment Bookings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Track review statuses, inspection condition reports, and quota consumption.
            </p>
          </div>

          {/* Quota Progress Meter */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 min-w-[280px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400">Weekly Quota Meter</span>
              <span className="font-bold text-white">
                {weeklyHoursUsed} / {maxWeeklyHours} hrs
              </span>
            </div>
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  quotaPercentage >= 100
                    ? "bg-red-500"
                    : quotaPercentage >= 75
                    ? "bg-amber-500"
                    : "bg-indigo-500"
                }`}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>{maxWeeklyHours - weeklyHoursUsed}h remaining this week</span>
              <span>Strikes: {user?.strikes || 0}</span>
            </div>
          </div>
        </div>

        {/* Active Waitlist Section */}
        {waitlist.length > 0 && (
          <div className="mb-8 p-6 rounded-2xl bg-purple-950/20 border border-purple-900/40 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-300">
                  Active Waitlist Queue Positions ({waitlist.length})
                </h2>
              </div>
              <span className="text-[11px] text-purple-400/80">
                Ranked dynamically by fairness scoring formula
              </span>
            </div>

            <div className="space-y-3">
              {waitlist.map((wl: any) => (
                <div
                  key={wl._id}
                  className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white">{wl.resourceId?.title}</h4>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        Priority Score: {wl.priorityScore?.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2.5">
                      <span>
                        Slot:{" "}
                        {new Date(wl.slotStart).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                        {new Date(wl.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(wl.slotEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>&bull;</span>
                      <span>{wl.resourceId?.location}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 mt-1">
                      Score Breakdown: Recent Usage: {wl.scoreBreakdown?.recentUsage ?? 0}h | Strikes:{" "}
                      {wl.scoreBreakdown?.strikes ?? 0} | Wait Hours: {wl.scoreBreakdown?.waitTime ?? 0}h
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-semibold text-emerald-400 block">
                      Auto-promotion active
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Notified immediately if slot is freed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bookings List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-md mx-auto">
            <Calendar className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No reservations yet</h3>
            <p className="text-xs text-slate-400 mb-6">
              Explore underused labs, 3D printers, and equipment across campus to make your first reservation.
            </p>
            <Link
              href="/resources"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Explore Equipment Directory
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((b: any) => {
              const start = new Date(b.start);
              const end = new Date(b.end);
              const canCancel = ["requested", "pending_review", "approved", "waitlisted"].includes(b.status);

              return (
                <div
                  key={b._id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                      <img
                        src={b.resourceId?.photos?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80"}
                        alt={b.resourceId?.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-semibold text-white">
                          {b.resourceId?.title}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 font-medium text-slate-300">
                          <Calendar className="h-3.5 w-3.5 text-indigo-400" />
                          {start.toLocaleDateString([], {
                            weekday: "short",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                          {end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span>&bull;</span>
                        <span>{b.resourceId?.location}</span>
                      </div>

                      {b.decisionReason && (
                        <div className="text-[11px] text-slate-400 mt-2 bg-slate-950/50 p-2 rounded-lg border border-slate-800/80">
                          <strong className="text-slate-300">Status Note:</strong> {b.decisionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800 shrink-0">
                    {canCancel && (
                      <button
                        onClick={() => setCancellingBooking(b)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-900/40 transition"
                      >
                        Cancel
                      </button>
                    )}

                    <Link
                      href={`/bookings/${b._id}`}
                      className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition flex items-center gap-1"
                    >
                      <span>Timeline & Details</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cancellation Modal */}
        {cancellingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-white">Cancel Reservation</h3>
              <p className="text-xs text-slate-300">
                Are you sure you want to cancel your reservation for{" "}
                <strong className="text-white">{cancellingBooking.resourceId?.title}</strong>? Any consumed quota will be credited back to your weekly allowance.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Cancellation Reason:
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-red-600 hover:bg-red-500 text-white"
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
