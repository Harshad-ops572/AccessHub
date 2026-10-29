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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-4xl w-full mx-auto p-8">
          <div className="h-64 rounded-3xl bg-white/70 border border-slate-200/60 animate-pulse shadow-sm" />
        </main>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto p-8 text-center">
          <h2 className="text-lg font-bold text-[#0F1E4D] mb-2">Resource Not Found</h2>
          <Link href="/resources" className="text-xs text-[#2F6BFF] hover:underline font-semibold">
            Back to Directory
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href={`/resources/${resourceId}`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F1E4D] transition mb-6 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to {resource.title}</span>
        </Link>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Booking Form */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-2">
                <CalendarClock className="h-4 w-4" />
                <span>Reserve Time Slot</span>
              </div>
              <h1 className="text-2xl font-bold text-[#0F1E4D] tracking-tight mb-2">
                Book {resource.title}
              </h1>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                Transactions protect your reservation against double booking. Provide clear usage purpose for departmental records.
              </p>

              {/* Error / Conflict Banner */}
              {errorMsg && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-900 text-xs shadow-xs">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                    <div>
                      <div className="font-bold text-red-950">Reservation Notice</div>
                      <div className="mt-0.5 text-red-700">{errorMsg}</div>
                    </div>
                  </div>

                  {/* Join Waitlist Action */}
                  <div className="mt-3 pt-3 border-t border-red-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="font-bold text-amber-800">Need this exact slot?</div>
                      <div className="text-[11px] text-slate-600">
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
                      className="px-3.5 py-2 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs transition shadow-xs shrink-0"
                    >
                      Join Waitlist Queue
                    </button>
                  </div>

                  {/* Render Suggested Conflict-Free Slots */}
                  {conflictData?.suggestedSlots && conflictData.suggestedSlots.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-red-200/70">
                      <div className="font-bold text-[#0F1E4D] mb-2 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Recommended Conflict-Free Slots:</span>
                      </div>
                      <div className="space-y-1.5">
                        {conflictData.suggestedSlots.map((slot: any, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleApplySuggestedSlot(slot)}
                            className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-[#0F1E4D] transition flex items-center justify-between text-xs shadow-xs"
                          >
                            <span className="font-medium">{slot.label}</span>
                            <span className="text-[10px] uppercase font-bold text-[#2F6BFF]">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Reservation Date
                  </label>
                  <input
                    type="date"
                    required
                    min={today}
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Start Time
                    </label>
                    <input
                      type="time"
                      required
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      End Time
                    </label>
                    <input
                      type="time"
                      required
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                    />
                  </div>
                </div>

                {/* Duration Meter & Quota Indicator */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#2F6BFF]" />
                    <span className="text-slate-600">Requested Duration:</span>
                    <strong className="text-[#0F1E4D] font-mono">{durationHours.toFixed(1)} hours</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Max: <span className="font-semibold text-slate-800">{resource.maxDurationHours}h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Purpose & Project Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    placeholder="Briefly state your academic project, experiment goals, or design requirements..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Reviewed by the department owner prior to confirmation.
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-full bg-[#2F6BFF] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting ? (
                    <span className="inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
            <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-sm font-bold text-[#0F1E4D] mb-3">Equipment Summary</h3>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-blue-50 overflow-hidden shrink-0 border border-slate-200/70">
                  <img
                    src={resource.photos?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80"}
                    alt={resource.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#0F1E4D] line-clamp-1">{resource.title}</div>
                  <div className="text-[11px] text-slate-500 capitalize">{resource.category}</div>
                  <div className="text-[11px] text-slate-400">{resource.location}</div>
                </div>
              </div>

              {/* Weekly Quota Rule Reminder */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs space-y-2">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Weekly Quota Limit:</span>
                  <span className="font-bold text-[#0F1E4D]">8 hours max</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Your Current Usage:</span>
                  <span className="font-bold text-[#2F6BFF]">
                    {user?.weeklyHoursUsed || 0} / 8 hours
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Simultaneous Bookings:</span>
                  <span className="font-semibold text-slate-700">Max 2 active</span>
                </div>
              </div>
            </div>

            {/* Upcoming Busy Slots */}
            {availData?.busySlots && availData.busySlots.length > 0 && (
              <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-xs">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-[#0F1E4D]">Reserved Intervals</span>
                  <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full uppercase font-bold">
                    Occupied
                  </span>
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {availData.busySlots.map((b: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600 flex items-center justify-between text-xs"
                    >
                      <span>
                        {new Date(b.start).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                        {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
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
