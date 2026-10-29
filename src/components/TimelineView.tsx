"use client";

import React from "react";
import useSWR from "swr";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  User,
  ArrowRight,
  Sparkles,
  Lock,
} from "lucide-react";

interface TimelineViewProps {
  bookingId: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function TimelineView({ bookingId }: TimelineViewProps) {
  const { data, isLoading } = useSWR(
    bookingId ? `/api/audit?entityId=${bookingId}` : null,
    fetcher
  );

  const logs: any[] = data?.logs || [];

  const getActionColor = (action: string) => {
    switch (action) {
      case "BOOKING_CREATED":
        return "bg-blue-50 text-[#2F6BFF] border-blue-200";
      case "BOOKING_APPROVED":
      case "CREDENTIAL_VERIFIED":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "BOOKING_REJECTED":
      case "CREDENTIAL_REJECTED":
        return "bg-red-50 text-red-600 border-red-200";
      case "BOOKING_CHECKED_IN":
        return "bg-cyan-50 text-cyan-700 border-cyan-200";
      case "BOOKING_RETURNED":
        return "bg-teal-50 text-teal-700 border-teal-200";
      case "BOOKING_MARKED_OVERDUE":
      case "INCIDENT_AUTOMATICALLY_LOGGED":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "INCIDENT_RESOLVED":
        return "bg-purple-50 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "owner":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "manager":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "system":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-[#2F6BFF] border-t-transparent rounded-full animate-spin" />
        Loading immutable audit timeline...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-slate-500 border border-slate-200 rounded-2xl bg-white/60">
        No state changes recorded yet for this booking.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h4 className="text-sm font-bold text-[#0F1E4D] flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#2F6BFF]" />
          Immutable Booking Lifecycle Audit Trail
        </h4>
        <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          Append-Only ({logs.length} entries)
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {logs.map((log) => {
          const dateStr = new Date(log.timestamp).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div key={log._id} className="relative group">
              {/* Stepper node circle */}
              <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 border-white bg-[#2F6BFF] ring-2 ring-blue-500/20 group-hover:scale-125 transition-transform" />

              <div className="bg-white/90 border border-slate-200/80 rounded-2xl p-4 hover:border-slate-300 transition-colors shadow-xs">
                {/* Header: Action name + Timestamp + Actor */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-mono ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(
                        log.actorRole
                      )}`}
                    >
                      {log.actorRole}
                    </span>
                  </div>

                  <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {dateStr}
                  </span>
                </div>

                {/* State delta if present */}
                {log.before && log.after && (log.before.status || log.after.status) && (
                  <div className="mb-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 inline-flex items-center gap-2 text-xs font-mono">
                    <span className="text-slate-500">
                      {log.before.status || "initial"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-[#2F6BFF]" />
                    <span className="font-semibold text-[#0F1E4D]">
                      {log.after.status}
                    </span>
                  </div>
                )}

                {/* Recorded Reason */}
                {log.reason && (
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    &quot;{log.reason}&quot;
                  </p>
                )}

                {/* Actor Info */}
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    Recorded by:{" "}
                    <strong className="text-slate-800 font-medium">
                      {log.actorId?.name || (log.actorRole === "system" ? "Campus Automated Cron" : "Campus Staff")}
                    </strong>
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
                    ID: {log._id}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default TimelineView;
