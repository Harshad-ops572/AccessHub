"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldAlert,
  User,
  Clock,
  MessageSquare,
  XCircle,
  FileText,
  Scale,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OwnerIncidentsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/incidents` : null,
    fetcher
  );

  const incidents = data?.incidents || [];

  // Resolution Modal State
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [status, setStatus] = useState<"resolved" | "dismissed">("resolved");
  const [resolution, setResolution] = useState("Repaired in lab, user briefed on handling guidelines.");
  const [applyStrike, setApplyStrike] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerateAiSummary = async (incidentId: string) => {
    setAiGenerating(incidentId);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/summarise`, {
        method: "POST",
      });
      if (res.ok) {
        mutate();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAiGenerating(null);
    }
  };

  const handleConfirmResolution = async () => {
    if (!selectedIncident) return;
    setResolving(true);
    setErrorMsg("");

    try {
      const res = await fetch(`/api/incidents/${selectedIncident._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          resolution,
          applyStrike,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to resolve incident");
      } else {
        setSelectedIncident(null);
        mutate();
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider mb-1">
              <AlertTriangle className="h-4 w-4" />
              <span>Incident Resolution Center</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F1E4D] tracking-tight">
              Manage Equipment Damage & Incidents
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Review condition degradation, inspect AI advisory analyses, and record human resolution outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-4 py-2 rounded-full bg-white/80 border border-slate-200 text-xs text-slate-600 shadow-xs">
              <strong className="text-[#0F1E4D] font-bold">{incidents.length}</strong> incidents on record
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-3xl bg-white/70 border border-slate-200/60 animate-pulse shadow-xs" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/80 border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-md mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F1E4D] mb-1">No open incidents</h3>
            <p className="text-xs text-slate-500">
              All shared lab equipment and studios are in nominal operating condition.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {incidents.map((inc: any) => {
              const booking = inc.bookingId;
              const resource = booking?.resourceId;
              const student = booking?.userId;

              return (
                <div
                  key={inc._id}
                  className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 transition shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-700 border border-red-200">
                        {inc.type}
                      </span>
                      <span className="text-sm font-bold text-[#0F1E4D]">
                        {resource?.title || "Equipment Incident"}
                      </span>
                      <span className="text-xs text-slate-400">
                        (Severity: <strong className="text-amber-600 uppercase font-bold">{inc.severity}</strong>)
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        inc.status === "resolved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : inc.status === "dismissed"
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                      }`}
                    >
                      {inc.status}
                    </span>
                  </div>

                  {/* Incident Details & Student Info */}
                  <div className="grid md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Description & Inspector Observation:
                      </div>
                      <p className="text-slate-700 leading-relaxed">{inc.description}</p>
                      <div className="text-[10px] text-slate-400 pt-1">
                        Reported by {inc.reportedBy?.name || "Staff"} on{" "}
                        {new Date(inc.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-1.5">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Borrower & Location Details:
                      </div>
                      <div className="text-slate-700">
                        User: <strong className="text-[#0F1E4D]">{student?.name || "Student"}</strong> ({student?.department})
                      </div>
                      <div className="text-slate-700">
                        Current Penalty Strikes:{" "}
                        <strong className="text-amber-600 font-bold">{student?.strikes || 0}</strong>
                      </div>
                      <div className="text-slate-500">Facility: {resource?.location}</div>
                    </div>
                  </div>

                  {/* Advisory AI Summary Block */}
                  {inc.aiSummary ? (
                    <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/70 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-[#2F6BFF] font-bold text-[11px]">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        <span>Advisory Analysis (Requires Human Confirmation)</span>
                      </div>
                      <p className="text-slate-700 whitespace-pre-line leading-relaxed font-sans text-[11px]">
                        {inc.aiSummary}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleGenerateAiSummary(inc._id)}
                      disabled={aiGenerating === inc._id}
                      className="px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200/60 text-[#2F6BFF] text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>
                        {aiGenerating === inc._id
                          ? "Generating Advisory Summary..."
                          : "Generate AI Advisory Summary"}
                      </span>
                    </button>
                  )}

                  {/* Resolution Notes (If Resolved) */}
                  {inc.resolution && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                      <strong>Human Resolution:</strong> {inc.resolution} (Recorded by{" "}
                      {inc.resolvedBy?.name || "Owner"})
                    </div>
                  )}

                  {/* Action Bar for Open Incidents */}
                  {inc.status === "open" && (
                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setStatus("resolved");
                          setResolution("Equipment inspected and repaired. Normal operation restored.");
                        }}
                        className="px-5 py-2.5 rounded-full bg-[#2F6BFF] hover:bg-blue-600 text-white font-semibold text-xs transition shadow-xs"
                      >
                        Resolve / Dismiss Incident
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Resolution Modal */}
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-lg p-6 rounded-3xl bg-white border border-slate-200 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-[#0F1E4D]">Resolve Incident Record</h3>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-400 hover:text-slate-700"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Resolution Status:
                  </label>
                  <select
                    value={status}
                    onChange={(e: any) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                  >
                    <option value="resolved">Resolved (Corrective action completed)</option>
                    <option value="dismissed">Dismissed (Minor wear / No fault found)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Human Resolution Notes (Auditable):
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe maintenance performed, replacement parts, or user briefing..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                  />
                </div>

                {/* Strike Confirmation */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#0F1E4D] block">
                      Apply Penalty Strike to Borrower
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Human confirmation required. Strikes temporarily reduce waitlist priority for 30 days.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={applyStrike}
                    onChange={(e) => setApplyStrike(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedIncident(null)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={resolving || !resolution.trim()}
                  onClick={handleConfirmResolution}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#2F6BFF] hover:bg-blue-600 text-white transition shadow-xs"
                >
                  {resolving ? "Saving..." : "Confirm Resolution"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
