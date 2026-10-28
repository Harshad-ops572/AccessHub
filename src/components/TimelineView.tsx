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
        return "bg-blue-500/20 text-blue-400 border-blue-500/40";
      case "BOOKING_APPROVED":
      case "CREDENTIAL_VERIFIED":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "BOOKING_REJECTED":
      case "CREDENTIAL_REJECTED":
        return "bg-red-500/20 text-red-400 border-red-500/40";
      case "BOOKING_CHECKED_IN":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      case "BOOKING_RETURNED":
        return "bg-teal-500/20 text-teal-400 border-teal-500/40";
      case "BOOKING_MARKED_OVERDUE":
      case "INCIDENT_AUTOMATICALLY_LOGGED":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "INCIDENT_RESOLVED":
        return "bg-purple-500/20 text-purple-400 border-purple-500/40";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-950/80 text-purple-300 border-purple-800";
      case "owner":
        return "bg-blue-950/80 text-blue-300 border-blue-800";
      case "manager":
        return "bg-amber-950/80 text-amber-300 border-amber-800";
      case "system":
        return "bg-emerald-950/80 text-emerald-300 border-emerald-800";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  if (isLoading) {
    return (
      <div className="py-8 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        Loading immutable audit timeline...
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="py-6 text-center text-xs text-neutral-500 border border-neutral-800 rounded-xl bg-neutral-900/50">
        No state changes recorded yet for this booking.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" />
          Immutable Booking Lifecycle Audit Trail
        </h4>
        <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          Append-Only ({logs.length} entries)
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-neutral-800">
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
              <div className="absolute -left-6 top-1 w-3 h-3 rounded-full border-2 border-neutral-900 bg-emerald-500 ring-2 ring-emerald-500/20 group-hover:scale-125 transition-transform" />

              <div className="bg-neutral-900/90 border border-neutral-800/80 rounded-xl p-3.5 hover:border-neutral-700 transition-colors">
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
                      className={`text-[10px] font-medium px-2 py-0.5 rounded-full border uppercase ${getRoleBadge(
                        log.actorRole
                      )}`}
                    >
                      {log.actorRole}
                    </span>
                  </div>

                  <span className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {dateStr}
                  </span>
                </div>

                {/* State delta if present */}
                {log.before && log.after && (log.before.status || log.after.status) && (
                  <div className="mb-2 px-2.5 py-1 rounded-lg bg-neutral-950/60 border border-neutral-800/60 inline-flex items-center gap-2 text-xs font-mono">
                    <span className="text-neutral-400">
                      {log.before.status || "initial"}
                    </span>
                    <ArrowRight className="w-3 h-3 text-emerald-400" />
                    <span className="font-semibold text-emerald-300">
                      {log.after.status}
                    </span>
                  </div>
                )}

                {/* Recorded Reason */}
                {log.reason && (
                  <p className="text-xs text-neutral-300 leading-relaxed bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-800/40">
                    &quot;{log.reason}&quot;
                  </p>
                )}

                {/* Actor Info */}
                <div className="mt-2.5 pt-2 border-t border-neutral-800/40 flex items-center justify-between text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-neutral-400" />
                    Recorded by:{" "}
                    <strong className="text-neutral-300 font-medium">
                      {log.actorId?.name || (log.actorRole === "system" ? "Campus Automated Cron" : "Campus Staff")}
                    </strong>
                  </span>
                  <span className="font-mono text-[10px] text-neutral-600 truncate max-w-[150px]">
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
