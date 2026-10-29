"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  ScrollText,
  ShieldCheck,
  Filter,
  Search,
  ArrowRight,
  User,
  Clock,
  Lock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Activity,
  Layers,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminAuditPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const queryParams = new URLSearchParams();
  queryParams.set("page", page.toString());
  queryParams.set("limit", "25");
  if (actionFilter) queryParams.set("action", actionFilter);
  if (roleFilter) queryParams.set("actorRole", roleFilter);
  if (entityFilter) queryParams.set("entityType", entityFilter);
  if (searchQuery) queryParams.set("search", searchQuery);

  const url = user && ["admin", "owner", "manager"].includes(user.role)
    ? `/api/audit?${queryParams.toString()}`
    : null;

  const { data, isLoading } = useSWR(url, fetcher, { refreshInterval: 10000 });

  const logs: any[] = data?.logs || [];
  const pagination = data?.pagination || { total: 0, pages: 1 };

  const getActionStyle = (action: string) => {
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
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Lock className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F1E4D] mb-2">Administrator Access Required</h1>
          <p className="text-slate-500 mb-6">
            The immutable campus audit log contains sensitive cross-departmental operations and requires Administrator privileges.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-purple-600 hover:bg-purple-700 font-semibold text-white transition-colors shadow-xs"
          >
            Sign in as Campus Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Compliance & Accountability
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Step 8 of Judge Walkthrough</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F1E4D] tracking-tight flex items-center gap-3">
              <ScrollText className="w-8 h-8 text-purple-600" />
              Campus Audit Trail
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Append-only, tamper-proof record of every booking state transition, condition inspection, approval reason, and incident resolution.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/users"
              className="px-4 py-2 text-xs rounded-full border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 font-semibold shadow-xs"
            >
              User Directory <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Total Audit Entries</span>
            <span className="text-2xl font-extrabold text-[#0F1E4D]">{pagination.total}</span>
          </div>
          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Integrity Mode</span>
            <span className="text-sm font-bold text-emerald-700 flex items-center gap-1.5 mt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Append-Only Immutable
            </span>
          </div>
          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-xs text-slate-500 block mb-1 font-medium">State Machine Sync</span>
            <span className="text-sm font-bold text-[#2F6BFF] flex items-center gap-1.5 mt-1">
              <Activity className="w-4 h-4" /> Real-time Polled
            </span>
          </div>
          <div className="p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <span className="text-xs text-slate-500 block mb-1 font-medium">Active Page</span>
            <span className="text-sm font-bold text-[#0F1E4D] mt-1 block">
              Page {page} of {pagination.pages || 1}
            </span>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Action Filter */}
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="">All Actions</option>
              <option value="BOOKING_CREATED">BOOKING_CREATED</option>
              <option value="BOOKING_APPROVED">BOOKING_APPROVED</option>
              <option value="BOOKING_REJECTED">BOOKING_REJECTED</option>
              <option value="BOOKING_CHECKED_IN">BOOKING_CHECKED_IN</option>
              <option value="BOOKING_RETURNED">BOOKING_RETURNED</option>
              <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
              <option value="BOOKING_MARKED_OVERDUE">BOOKING_MARKED_OVERDUE</option>
              <option value="CREDENTIAL_VERIFIED">CREDENTIAL_VERIFIED</option>
              <option value="CREDENTIAL_REJECTED">CREDENTIAL_REJECTED</option>
              <option value="INCIDENT_AUTOMATICALLY_LOGGED">INCIDENT_AUTOMATICALLY_LOGGED</option>
              <option value="INCIDENT_RESOLVED">INCIDENT_RESOLVED</option>
            </select>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="">All Roles</option>
              <option value="user">User / Student</option>
              <option value="owner">Equipment Owner</option>
              <option value="manager">Facility Manager</option>
              <option value="admin">Administrator</option>
              <option value="system">System (Cron/Daemon)</option>
            </select>

            {/* Entity Filter */}
            <select
              value={entityFilter}
              onChange={(e) => {
                setEntityFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200 rounded-full px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="">All Entities</option>
              <option value="Booking">Booking</option>
              <option value="Credential">Credential</option>
              <option value="Incident">Incident</option>
              <option value="Resource">Resource</option>
              <option value="User">User</option>
            </select>

            {(actionFilter || roleFilter || entityFilter || searchQuery) && (
              <button
                onClick={() => {
                  setActionFilter("");
                  setRoleFilter("");
                  setEntityFilter("");
                  setSearchQuery("");
                  setPage(1);
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-bold px-2.5 py-1"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search reason or ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Audit Log Table */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-3xl border border-slate-200 shadow-xs">
            <ScrollText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F1E4D]">No Records Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No audit actions matched your selected filters. Try broadening your criteria.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const dateObj = new Date(log.timestamp);
              const formattedDate = dateObj.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div
                  key={log._id}
                  className="bg-white/85 backdrop-blur-md border border-slate-200/80 hover:border-slate-300 rounded-2xl p-4 transition-all shadow-xs"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2.5">
                    {/* Action & Entity Badges */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full border font-mono ${getActionStyle(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>

                      <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                        {log.entityType}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getRoleBadge(
                          log.actorRole
                        )}`}
                      >
                        {log.actorRole}
                      </span>
                    </div>

                    {/* Timestamp & Record ID */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {formattedDate} {formattedTime}
                      </span>
                      <span className="text-slate-400 text-[11px] truncate max-w-[120px]" title={log._id}>
                        #{log._id.slice(-8)}
                      </span>
                    </div>
                  </div>

                  {/* State Change Badges */}
                  {log.before && log.after && (log.before.status || log.after.status) && (
                    <div className="mb-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/70 inline-flex items-center gap-2 text-xs font-mono">
                      <span className="text-slate-500">
                        {log.before.status || "new"}
                      </span>
                      <ArrowRight className="w-3 h-3 text-[#2F6BFF]" />
                      <span className="font-bold text-[#0F1E4D]">
                        {log.after.status}
                      </span>
                    </div>
                  )}

                  {/* Recorded Justification / Reason */}
                  {log.reason && (
                    <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 mb-2 leading-relaxed">
                      &quot;{log.reason}&quot;
                    </p>
                  )}

                  {/* Actor details footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Actor:{" "}
                        <strong className="text-slate-800">
                          {log.actorId?.name || (log.actorRole === "system" ? "Campus Automated Cron" : "Unknown")}
                        </strong>{" "}
                        {log.actorId?.email && `(${log.actorId.email})`}
                      </span>
                    </div>

                    <div className="text-slate-400 font-mono text-[11px]">
                      Target: {log.entityType} ID {log.entityId}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
            <span className="text-xs text-slate-500 font-medium">
              Showing page {page} of {pagination.pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-colors flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-700 transition-colors flex items-center gap-1 shadow-xs"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
