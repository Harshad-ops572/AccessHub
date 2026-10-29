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
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending_review":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "checked_in":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "returned":
      case "closed":
        return "bg-slate-100 text-slate-700 border-slate-200";
      case "waitlisted":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "overdue":
      case "rejected":
      case "cancelled":
        return "bg-red-50 text-red-600 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const weeklyHoursUsed = user?.weeklyHoursUsed || 0;
  const maxWeeklyHours = 8;
  const quotaPercentage = Math.min(100, Math.round((weeklyHoursUsed / maxWeeklyHours) * 100));

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="h-4 w-4" />
              <span>Campus Reservations</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F1E4D] tracking-tight">
              My Equipment Bookings
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Track review statuses, inspection condition reports, and quota consumption.
            </p>
          </div>

          {/* Quota Progress Meter */}
          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] min-w-[280px]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-500 font-medium">Weekly Quota Meter</span>
              <span className="font-bold text-[#0F1E4D]">
                {weeklyHoursUsed} / {maxWeeklyHours} hrs
              </span>
            </div>
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  quotaPercentage >= 100
                    ? "bg-red-500"
                    : quotaPercentage >= 75
                    ? "bg-amber-500"
                    : "bg-[#2F6BFF]"
                }`}
                style={{ width: `${quotaPercentage}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-500 mt-2 flex items-center justify-between font-medium">
              <span>{maxWeeklyHours - weeklyHoursUsed}h remaining this week</span>
              <span>Strikes: {user?.strikes || 0}</span>
            </div>
          </div>
        </div>

        {/* Active Waitlist Section */}
        {waitlist.length > 0 && (
          <div className="mb-8 p-6 rounded-3xl bg-purple-50/70 border border-purple-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-600" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-purple-900">
                  Active Waitlist Queue Positions ({waitlist.length})
                </h2>
              </div>
              <span className="text-[11px] text-purple-700 font-medium">
                Ranked dynamically by fairness scoring formula
              </span>
            </div>

            <div className="space-y-3">
              {waitlist.map((wl: any) => (
                <div
                  key={wl._id}
                  className="p-4 rounded-2xl bg-white border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-[#0F1E4D]">{wl.resourceId?.title}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        Priority Score: {wl.priorityScore?.toFixed(2)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2.5">
                      <span>
                        Slot:{" "}
                        {new Date(wl.slotStart).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                        {new Date(wl.slotStart).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(wl.slotEnd).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span>&bull;</span>
                      <span>{wl.resourceId?.location}</span>
                    </div>

                    <div className="text-[10px] text-slate-400 mt-1">
                      Score Breakdown: Recent Usage: {wl.scoreBreakdown?.recentUsage ?? 0}h | Strikes:{" "}
                      {wl.scoreBreakdown?.strikes ?? 0} | Wait Hours: {wl.scoreBreakdown?.waitTime ?? 0}h
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 block">
                      Auto-promotion active
                    </span>
                    <span className="text-[10px] text-slate-400">
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
              <div key={i} className="h-32 rounded-3xl bg-white/70 border border-slate-200/60 animate-pulse shadow-xs" />
            ))}
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/80 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md mx-auto">
            <Calendar className="h-10 w-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F1E4D] mb-1">No reservations yet</h3>
            <p className="text-xs text-slate-500 mb-6">
              Explore underused labs, 3D printers, and equipment across campus to make your first reservation.
            </p>
            <Link
              href="/resources"
              className="px-5 py-2.5 rounded-full bg-[#2F6BFF] hover:bg-blue-600 text-white text-xs font-semibold shadow-xs"
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
                  className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-blue-50 overflow-hidden shrink-0 border border-slate-200/70">
                      <img
                        src={b.resourceId?.photos?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80"}
                        alt={b.resourceId?.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-[#0F1E4D]">
                          {b.resourceId?.title}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                            b.status
                          )}`}
                        >
                          {b.status.replace("_", " ")}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1 font-semibold text-[#0F1E4D]">
                          <Calendar className="h-3.5 w-3.5 text-[#2F6BFF]" />
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
                        <div className="text-[11px] text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <strong className="text-[#0F1E4D]">Status Note:</strong> {b.decisionReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 shrink-0">
                    {canCancel && (
                      <button
                        onClick={() => setCancellingBooking(b)}
                        className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200 transition"
                      >
                        Cancel
                      </button>
                    )}

                    <Link
                      href={`/bookings/${b._id}`}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-[#2F6BFF] border border-blue-200/60 transition flex items-center gap-1"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-[#0F1E4D]">Cancel Reservation</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to cancel your reservation for{" "}
                <strong className="text-[#0F1E4D]">{cancellingBooking.resourceId?.title}</strong>? Any consumed quota will be credited back to your weekly allowance.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Cancellation Reason:
                </label>
                <input
                  type="text"
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Keep Reservation
                </button>
                <button
                  type="button"
                  disabled={cancelling}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-full text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-xs"
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
