"use client";

import React, { use, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Calendar,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Info,
  CalendarClock,
  ArrowRight,
  Layers,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BookResourcePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const resourceId = resolvedParams.id;
  const router = useRouter();

  const { data: session } = useSession();
  const user = session?.user;

  const { data: resData, error: resError, isLoading: resLoading } = useSWR(
    `/api/resources/${resourceId}`,
    fetcher
  );

  const { data: availData } = useSWR(
    `/api/resources/${resourceId}/availability`,
    fetcher
  );

  const resource = resData?.resource;

  // Form states
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("12:00");
  const [purpose, setPurpose] = useState("Prototyping mechanical components for senior capstone project.");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [conflictData, setConflictData] = useState<any>(null);

  // Compute duration
  const startDateTime = new Date(`${selectedDate}T${startTime}:00`);
  const endDateTime = new Date(`${selectedDate}T${endTime}:00`);
  const durationHours =
    endDateTime > startDateTime
      ? (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60 * 60)
      : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setConflictData(null);

    if (durationHours <= 0) {
      setErrorMsg("End time must be after start time");
      setSubmitting(false);
      return;
    }

    if (resource && durationHours > resource.maxDurationHours) {
      setErrorMsg(`Duration exceeds the ${resource.maxDurationHours}h limit for this equipment.`);
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          purpose,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409) {
          // Conflict encountered!
          setConflictData(data);
          setErrorMsg(data.error || "Time slot is already occupied.");
        } else {
          setErrorMsg(data.reason || data.error || "Failed to submit booking request.");
        }
      } else {
        router.push(`/bookings/${data.booking._id}`);
      }
    } catch {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplySuggestedSlot = (suggested: any) => {
    const sDate = new Date(suggested.start);
    const eDate = new Date(suggested.end);

    setSelectedDate(sDate.toISOString().split("T")[0]);
    setStartTime(sDate.toTimeString().substring(0, 5));
    setEndTime(eDate.toTimeString().substring(0, 5));
    setConflictData(null);
    setErrorMsg("");
  };

  if (resLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto p-8">
          <div className="h-64 rounded-2xl bg-slate-900 animate-pulse" />
        </main>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto p-8 text-center">
          <h2 className="text-lg font-bold text-white mb-2">Resource Not Found</h2>
          <Link href="/resources" className="text-xs text-indigo-400 hover:underline">
            Back to Directory
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/resources/${resourceId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {resource.title}</span>
        </Link>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Booking Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-2xl backdrop-blur">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <CalendarClock className="h-4 w-4" />
                <span>Reserve Time Slot</span>
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight mb-2">
                Book {resource.title}
              </h1>
              <p className="text-xs text-slate-400 mb-6">
                Transactions protect your reservation against double booking. Provide clear usage purpose for departmental records.
              </p>

              {/* Error / Conflict Banner */}
              {errorMsg && (
                <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-300">Reservation Notice</div>
                      <div className="mt-0.5 text-red-200/90">{errorMsg}</div>
                    </div>
                  </div>

                  {/* Join Waitlist Action */}
                  <div className="mt-3 pt-3 border-t border-red-900/60 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-amber-300">Need this exact slot?</div>
                      <div className="text-[11px] text-slate-300">
                        Join the waitlist. If the current booking is cancelled, the top-ranked member is auto-promoted.
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={async () => {
                        setSubmitting(true);
                        try {
                          const res = await fetch("/api/waitlist", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              resourceId,
                              slotStart: startDateTime.toISOString(),
                              slotEnd: endDateTime.toISOString(),
                            }),
                          });
                          const data = await res.json();
                          if (!res.ok) {
                            setErrorMsg(data.error || "Failed to join waitlist");
                          } else {
                            router.push("/bookings");
                          }
                        } catch {
                          setErrorMsg("Failed to join waitlist");
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition shadow-md shadow-purple-600/20 shrink-0"
                    >
                      Join Waitlist Queue
                    </button>
                  </div>

                  {/* Render Suggested Conflict-Free Slots */}
                  {conflictData?.suggestedSlots && conflictData.suggestedSlots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-900/60">
                      <div className="font-semibold text-slate-200 mb-2 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-400" />
                        <span>Recommended Conflict-Free Slots:</span>
                      </div>
                      <div className="space-y-1.5">
                        {conflictData.suggestedSlots.map((slot: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplySuggestedSlot(slot)}
                            className="w-full text-left p-2 rounded-lg bg-slate-900/80 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-600/50 text-slate-300 hover:text-white transition flex items-center justify-between text-xs"
                          >
                            <span>{slot.label}</span>
                            <span className="text-[10px] uppercase font-bold text-indigo-400">
                              Use this slot &rarr;
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reservation Date
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Duration Meter & Quota Indicator */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span className="text-slate-300">Requested Duration:</span>
                    <strong className="text-white font-mono">{durationHours.toFixed(1)} hours</strong>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Max: <span className="text-slate-200">{resource.maxDurationHours}h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purpose & Project Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Briefly state your academic project, experiment goals, or design requirements..."
                    className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Reviewed by the department owner prior to confirmation.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Calendar className="h-4 w-4" />
                      <span>
                        {resource.requiresApproval
                          ? "Submit Request for Owner Approval"
                          : "Confirm & Book Slot"}
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Resource Summary & Occupied Slots */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-semibold text-white mb-3">Equipment Summary</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                  <img
                    src={resource.photos?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80"}
                    alt={resource.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-white line-clamp-1">{resource.title}</div>
                  <div className="text-[11px] text-slate-400 capitalize">{resource.category}</div>
                  <div className="text-[11px] text-slate-400">{resource.location}</div>
                </div>
              </div>

              {/* Weekly Quota Rule Reminder */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Weekly Quota Limit:</span>
                  <span className="font-semibold text-white">8 hours max</span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Your Current Usage:</span>
                  <span className="font-semibold text-indigo-400">
                    {user?.weeklyHoursUsed || 0} / 8 hours
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-300">
                  <span>Simultaneous Bookings:</span>
                  <span className="font-semibold text-slate-200">Max 2 active</span>
                </div>
              </div>
            </div>

            {/* Upcoming Busy Slots */}
            {availData?.busySlots && availData.busySlots.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-300">Reserved Intervals</span>
                  <span className="text-[10px] text-amber-400 uppercase font-bold">Occupied</span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availData.busySlots.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-slate-400 flex items-center justify-between text-xs"
                    >
                      <span>
                        {new Date(b.start).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                        {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                        Reserved
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
