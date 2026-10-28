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
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-950/80 text-red-400 border border-red-800 flex items-center gap-1">
          <ShieldAlert className="w-3 h-3" /> {strikes} Strikes (Suspended)
        </span>
      );
    }
    if (strikes > 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-400 border border-amber-800 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {strikes} Strike{strikes > 1 ? "s" : ""}
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800 flex items-center gap-1">
        <CheckCircle2 className="w-3 h-3" /> 0 Strikes (Good Standing)
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-900/60 text-purple-300 border-purple-700";
      case "owner":
        return "bg-blue-900/60 text-blue-300 border-blue-700";
      case "manager":
        return "bg-amber-900/60 text-amber-300 border-amber-700";
      default:
        return "bg-neutral-800 text-neutral-300 border-neutral-700";
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <Lock className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Administrator Access Required</h1>
          <p className="text-neutral-400 mb-6">
            User directory and safety strike adjustments require campus administrator permissions.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 font-semibold text-white transition-colors"
          >
            Sign in as Campus Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-950/80 text-purple-400 border border-purple-800">
                Administration Console
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-xs text-neutral-400">Accountability & Governance</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-purple-400" />
              Campus User Directory & Safety Strikes
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Oversee campus member access, monitor fair allocation standing, inspect safety strikes, and manage role authority.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/audit"
              className="px-4 py-2 text-sm rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-2 font-medium"
            >
              View Audit Log <ArrowRight className="w-4 h-4 text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Update Failed</p>
              <p className="text-red-300 text-xs mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-sm flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="font-medium">{successMsg}</p>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-4 mb-6 backdrop-blur flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Roles</option>
              <option value="user">Students / Researchers</option>
              <option value="owner">Equipment Owners</option>
              <option value="manager">Facility Managers</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-3 py-2 text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Users Table */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-400">Loading user directory...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 bg-neutral-800/30 rounded-2xl border border-neutral-800">
            <Users className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-300">No Users Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              No campus members matched your search criteria.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredUsers.map((u) => {
              return (
                <div
                  key={u._id}
                  className="bg-neutral-800/60 border border-neutral-700/70 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-600 transition-all duration-150"
                >
                  <div>
                    {/* Header: Role and Strikes */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${getRoleBadge(
                          u.role
                        )}`}
                      >
                        {u.role}
                      </span>
                      {getStrikeBadge(u.strikes || 0)}
                    </div>

                    {/* Name & Email */}
                    <h3 className="text-base font-bold text-white mb-0.5">{u.name}</h3>
                    <p className="text-xs text-neutral-400 mb-2">{u.email}</p>

                    {/* Department */}
                    <div className="bg-neutral-900/80 rounded-xl p-2.5 border border-neutral-800/80 text-xs text-neutral-300 mb-4 flex items-center justify-between">
                      <span className="text-neutral-500">Department:</span>
                      <span className="font-medium text-neutral-200">
                        {u.department || "General Campus"}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-neutral-700/60 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEdit(u)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                    </button>

                    {u.strikes > 0 && (
                      <button
                        disabled={processingId === u._id}
                        onClick={() => handleResetStrikes(u._id, u.name)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                Edit Campus Member
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Modify account attributes for <strong className="text-neutral-200">{editingUser.name}</strong> ({editingUser.email}). Changes are immutably logged to the audit trail.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Platform Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="user">User (Student / Researcher)</option>
                  <option value="owner">Equipment Owner (Department Head)</option>
                  <option value="manager">Facility Manager (Check-in Desk)</option>
                  <option value="admin">Platform Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Safety Strikes Count (3 strikes = automatic suspension)
                </label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={newStrikes}
                  onChange={(e) => setNewStrikes(Number(e.target.value))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Department / Laboratory
                </label>
                <input
                  type="text"
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-2.5 text-sm text-neutral-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingId === editingUser._id}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-purple-600 hover:bg-purple-500 text-white transition-colors disabled:opacity-50 flex items-center gap-1.5"
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
