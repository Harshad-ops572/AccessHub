"use client";

import React, { use } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { ExplainDecisionPanel } from "@/components/ExplainDecisionPanel";
import { ConditionComparison } from "@/components/ConditionComparison";
import { TimelineView } from "@/components/TimelineView";
import {
  Calendar,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ArrowLeft,
  ScrollText,
  User,
  Info,
  HelpCircle,
  Check,
  AlertTriangle,
  History,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const bookingId = resolvedParams.id;

  const { data: session } = useSession();
  const currentUser = session?.user;

  const { data, error, isLoading } = useSWR(
    `/api/bookings/${bookingId}`,
    fetcher
  );

  const booking = data?.booking;
  const inspections = data?.inspections || [];
  const incidents = data?.incidents || [];
  const auditLogs = data?.auditLogs || [];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto p-8">
          <div className="h-64 rounded-2xl bg-slate-900 animate-pulse" />
        </main>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white mb-2">Booking Not Found</h2>
          <Link href="/bookings" className="text-xs text-indigo-400 hover:underline">
            Back to My Bookings
          </Link>
        </main>
      </div>
    );
  }

  const start = new Date(booking.start);
  const end = new Date(booking.end);
  const durationHours = ((end.getTime() - start.getTime()) / (1000 * 60 * 60)).toFixed(1);

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Bookings</span>
        </Link>

        {/* Header Summary */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(
                  booking.status
                )}`}
              >
                {booking.status.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-500 font-mono">ID: {booking._id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {booking.resourceId?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-2">
              <span className="flex items-center gap-1 text-indigo-400 font-medium">
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
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {booking.resourceId?.location}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/resources/${booking.resourceId?._id}`}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
            >
              View Equipment Info
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: Plain-Language Decision Explainer & Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* "Explain This Decision" Panel */}
            <ExplainDecisionPanel
              status={booking.status}
              decisionReason={booking.decisionReason}
              fairnessSnapshot={booking.fairnessSnapshot}
              eligibilitySnapshot={booking.eligibilitySnapshot}
            />

            {/* Purpose & Research Notes */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Recorded Project Purpose
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                &ldquo;{booking.purpose}&rdquo;
              </p>
            </div>

            {/* Inspection Condition Records (Before & After Comparison) */}
            {inspections.length > 0 && (
              <ConditionComparison
                checkin={inspections.find((i: any) => i.type === "checkin")}
                returnInspection={inspections.find((i: any) => i.type === "return")}
              />
            )}

            {/* Incidents Section */}
            {incidents.length > 0 && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-red-950/60 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-red-400 text-xs font-semibold uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Reported Incidents ({incidents.length})</span>
                </div>

                <div className="space-y-3">
                  {incidents.map((inc: any) => (
                    <div
                      key={inc._id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white capitalize flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-950 text-red-300 border border-red-800 uppercase">
                            {inc.type}
                          </span>
                          <span>Severity: {inc.severity}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            inc.status === "resolved"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : "bg-amber-950 text-amber-300 border border-amber-800"
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>

                      <p className="text-slate-300">{inc.description}</p>

                      {inc.aiSummary && (
                        <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-indigo-200 whitespace-pre-line leading-relaxed">
                          {inc.aiSummary}
                        </div>
                      )}

                      {inc.resolution && (
                        <div className="text-[11px] text-emerald-300 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-900/40">
                          <strong>Human Resolution:</strong> {inc.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Immutable Audit Timeline */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <TimelineView bookingId={bookingId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
