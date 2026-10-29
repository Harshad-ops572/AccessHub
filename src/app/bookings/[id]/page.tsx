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
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-5xl w-full mx-auto p-8">
          <div className="h-64 rounded-3xl bg-white/70 border border-slate-200/60 animate-pulse shadow-xs" />
        </main>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto p-12 text-center">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-[#0F1E4D] mb-2">Booking Not Found</h2>
          <Link href="/bookings" className="text-xs text-[#2F6BFF] hover:underline font-semibold">
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

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#0F1E4D] transition mb-6 font-medium"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to All Bookings</span>
        </Link>

        {/* Header Summary */}
        <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadge(
                  booking.status
                )}`}
              >
                {booking.status.replace("_", " ")}
              </span>
              <span className="text-xs text-slate-400 font-mono">ID: {booking._id}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E4D] tracking-tight">
              {booking.resourceId?.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
              <span className="flex items-center gap-1 text-[#2F6BFF] font-semibold">
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
              className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-[#2F6BFF] border border-blue-200/60 text-xs font-semibold transition"
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
            <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Recorded Project Purpose
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70">
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
              <div className="p-6 rounded-3xl bg-red-50/50 border border-red-200 shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-red-700 text-xs font-bold uppercase tracking-wider">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Reported Incidents ({incidents.length})</span>
                </div>

                <div className="space-y-3">
                  {incidents.map((inc: any) => (
                    <div
                      key={inc._id}
                      className="p-4 rounded-2xl bg-white border border-red-100 text-xs space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#0F1E4D] capitalize flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-red-50 text-red-700 border border-red-200 uppercase">
                            {inc.type}
                          </span>
                          <span>Severity: {inc.severity}</span>
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            inc.status === "resolved"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200"
                          }`}
                        >
                          {inc.status}
                        </span>
                      </div>

                      <p className="text-slate-600">{inc.description}</p>

                      {inc.aiSummary && (
                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200/70 text-[11px] text-blue-900 whitespace-pre-line leading-relaxed">
                          {inc.aiSummary}
                        </div>
                      )}

                      {inc.resolution && (
                        <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
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
            <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <TimelineView bookingId={bookingId} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
