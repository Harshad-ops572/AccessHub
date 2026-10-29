"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Users,
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Lock,
  ChevronRight,
  ShieldAlert,
  Award,
  ArrowRight,
  Edit2,
  X,
  Check,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUser = session?.user;

  const { data, mutate, isLoading } = useSWR(
    currentUser?.role === "admin" ? "/api/admin/users" : null,
    fetcher
  );

  const users: any[] = data?.users || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newRole, setNewRole] = useState("");
  const [newStrikes, setNewStrikes] = useState<number>(0);
  const [newDept, setNewDept] = useState("");

  const handleOpenEdit = (u: any) => {
    setEditingUser(u);
    setNewRole(u.role);
    setNewStrikes(u.strikes || 0);
    setNewDept(u.department || "");
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setProcessingId(editingUser._id);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingUser._id,
          role: newRole,
          strikes: Number(newStrikes),
          department: newDept,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to update user");

      setSuccessMsg(`Successfully updated user ${editingUser.name}`);
      setEditingUser(null);
      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleResetStrikes = async (userId: string, name: string) => {
    try {
      setProcessingId(userId);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          strikes: 0,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to reset strikes");

      setSuccessMsg(`Reset strikes to 0 for ${name}. Good standing restored.`);
      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.department && u.department.toLowerCase().includes(q));

    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  const getStrikeBadge = (strikes: number) => {
    if (strikes >= 3) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> {strikes} Strikes (Suspended)
        </span>
      );
    }
    if (strikes > 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {strikes} Strike{strikes > 1 ? "s" : ""}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> 0 Strikes (Good Standing)
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "owner":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "manager":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Lock className="w-16 h-16 text-purple-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0F1E4D] mb-2">Administrator Access Required</h1>
          <p className="text-slate-500 mb-6">
            User directory and safety strike adjustments require campus administrator permissions.
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
                Administration Console
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-xs text-slate-500 font-medium">Accountability & Governance</span>
            </div>
            <h1 className="text-3xl font-extrabold text-[#0F1E4D] tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-600" />
              Campus User Directory & Safety Strikes
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Oversee campus member access, monitor fair allocation standing, inspect safety strikes, and manage role authority.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/audit"
              className="px-4 py-2 text-xs rounded-full border border-slate-200 bg-white/80 hover:bg-slate-50 text-slate-700 transition-colors flex items-center gap-2 font-semibold shadow-xs"
            >
              View Audit Log <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Update Failed</p>
              <p className="text-red-600 text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="font-semibold">{successMsg}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-3xl p-4 mb-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 font-medium"
            >
              <option value="">All Roles</option>
              <option value="user">Students / Researchers</option>
              <option value="owner">Equipment Owners</option>
              <option value="manager">Facility Managers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-9 pr-4 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-white/70 rounded-3xl border border-slate-200 shadow-xs">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#0F1E4D]">No Users Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No campus members matched your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => {
              return (
                <div
                  key={u._id}
                  className="bg-white/85 backdrop-blur-md border border-slate-200/80 rounded-3xl p-5 flex flex-col justify-between hover:border-slate-300 transition-all duration-150 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                >
                  <div>
                    {/* Header: Role and Strikes */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                      {getStrikeBadge(u.strikes || 0)}
                    </div>

                    {/* Name & Email */}
                    <h3 className="text-base font-bold text-[#0F1E4D] mb-0.5">{u.name}</h3>
                    <p className="text-xs text-slate-500 mb-2">{u.email}</p>

                    {/* Department */}
                    <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/70 text-xs text-slate-700 mb-4 flex items-center justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-semibold text-slate-800">
                        {u.department || "General Campus"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </button>

                    {u.strikes > 0 && (
                      <button
                        disabled={processingId === u._id}
                        onClick={() => handleResetStrikes(u._id, u.name)}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                        title="Pardon strikes and restore good standing"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        {processingId === u._id ? "Resetting..." : "Reset Strikes"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0F1E4D] flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600" />
                Edit Campus Member
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Modify account attributes for <strong className="text-[#0F1E4D]">{editingUser.name}</strong> ({editingUser.email}). Changes are immutably logged to the audit trail.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Platform Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="user">User (Student / Researcher)</option>
                  <option value="owner">Equipment Owner (Department Head)</option>
                  <option value="manager">Facility Manager (Check-in Desk)</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Safety Strikes Count (3 strikes = automatic suspension)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={newStrikes}
                  onChange={(e) => setNewStrikes(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Department / Laboratory
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === editingUser._id}
                  className="px-5 py-2 text-xs font-bold rounded-full bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5 shadow-xs"
                >
                  <Check className="w-3.5 h-3.5" />
                  {processingId === editingUser._id ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
