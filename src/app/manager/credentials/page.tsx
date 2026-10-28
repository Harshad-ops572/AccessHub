"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  User,
  ExternalLink,
  Search,
  Filter,
  AlertTriangle,
  Award,
  ChevronRight,
  Eye,
  Check,
  X,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ManagerCredentialsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [activeTab, setActiveTab] = useState<"pending" | "verified" | "rejected" | "all">("pending");
  const [searchQuery, setSearchQuery] = useState("");

  const url = user && (user.role === "manager" || user.role === "admin")
    ? `/api/credentials${activeTab !== "all" ? `?status=${activeTab}` : ""}`
    : null;

  const { data, mutate, isLoading } = useSWR(url, fetcher);
  const credentials: any[] = data?.credentials || [];

  // Modal State for Reject
  const [rejectingCred, setRejectingCred] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Inspect Modal
  const [inspectingCred, setInspectingCred] = useState<any>(null);

  const handleVerify = async (credId: string, credType: string) => {
    try {
      setProcessingId(credId);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/credentials/${credId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify" }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to verify credential");
      }

      setSuccessMsg(`Successfully verified ${credType}!`);
      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingCred || !rejectionReason.trim()) return;

    try {
      setProcessingId(rejectingCred._id);
      setErrorMsg("");
      setSuccessMsg("");

      const res = await fetch(`/api/credentials/${rejectingCred._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reject",
          rejectionReason: rejectionReason.trim(),
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || "Failed to reject credential");
      }

      setSuccessMsg(`Credential marked as rejected.`);
      setRejectingCred(null);
      setRejectionReason("");
      mutate();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredCredentials = credentials.filter((c) => {
    const q = searchQuery.toLowerCase();
    const studentName = c.userId?.name?.toLowerCase() || "";
    const studentEmail = c.userId?.email?.toLowerCase() || "";
    const credType = c.type?.toLowerCase() || "";
    return studentName.includes(q) || studentEmail.includes(q) || credType.includes(q);
  });

  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    return (
      <div className="min-h-screen bg-neutral-900 text-neutral-100">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <ShieldCheck className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Restricted Access</h1>
          <p className="text-neutral-400 mb-6">
            You must be logged in as a Campus Facility Manager or Admin to verify student safety certifications.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-semibold text-white transition-colors"
          >
            Switch to Manager Account
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
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                Facility Manager Console
              </span>
              <span className="text-neutral-500">•</span>
              <span className="text-xs text-neutral-400">Step 3 of Judge Walkthrough</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <Award className="w-8 h-8 text-emerald-400" />
              Safety Credential Verification Queue
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              Review and approve safety licenses, radiation certifications, and machine-shop permits required for restricted campus resources.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/manager/checkin"
              className="px-4 py-2 text-sm rounded-lg border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-200 transition-colors flex items-center gap-2 font-medium"
            >
              Check-in Desk <ChevronRight className="w-4 h-4 text-neutral-400" />
            </Link>
          </div>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/50 border border-red-800 text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Action Failed</p>
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

        {/* Filter Tabs and Search Bar */}
        <div className="bg-neutral-800/60 border border-neutral-700/80 rounded-2xl p-4 mb-6 backdrop-blur flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "pending"
                  ? "bg-amber-500 text-neutral-950 font-semibold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4" />
              Pending Review
            </button>
            <button
              onClick={() => setActiveTab("verified")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "verified"
                  ? "bg-emerald-500 text-neutral-950 font-semibold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              Verified Active
            </button>
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "rejected"
                  ? "bg-red-500 text-neutral-950 font-semibold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              <XCircle className="w-4 h-4" />
              Rejected
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-neutral-700 text-white font-semibold"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              All Records
            </button>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student or cert type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg pl-9 pr-4 py-2 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Credentials Table / Cards */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-400">Loading safety credentials...</p>
          </div>
        ) : filteredCredentials.length === 0 ? (
          <div className="text-center py-16 bg-neutral-800/30 rounded-2xl border border-neutral-800">
            <ShieldCheck className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-neutral-300">No Credentials Found</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto mt-1">
              {activeTab === "pending"
                ? "All student safety documents have been reviewed. Clean queue!"
                : "No certification records match the current filter criteria."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCredentials.map((cred) => {
              const isPending = cred.status === "pending";
              const isVerified = cred.status === "verified";
              const isRejected = cred.status === "rejected";

              return (
                <div
                  key={cred._id}
                  className={`flex flex-col justify-between rounded-2xl border transition-all duration-200 p-5 ${
                    isPending
                      ? "bg-neutral-800/90 border-amber-600/50 shadow-lg shadow-amber-950/20"
                      : isVerified
                      ? "bg-neutral-800/50 border-emerald-900/60"
                      : "bg-neutral-800/40 border-neutral-700/60 opacity-80"
                  }`}
                >
                  <div>
                    {/* Header: Status badge & timestamp */}
                    <div className="flex items-center justify-between mb-3">
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border flex items-center gap-1.5 ${
                          isPending
                            ? "bg-amber-950/80 text-amber-400 border-amber-700/80"
                            : isVerified
                            ? "bg-emerald-950/80 text-emerald-400 border-emerald-800"
                            : "bg-red-950/80 text-red-400 border-red-800"
                        }`}
                      >
                        {isPending && <Clock className="w-3 h-3 animate-pulse" />}
                        {isVerified && <CheckCircle2 className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        {cred.status.toUpperCase()}
                      </span>

                      <span className="text-[11px] text-neutral-500">
                        {new Date(cred.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Credential Name */}
                    <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                      {cred.type}
                    </h3>

                    {/* Student Info */}
                    <div className="bg-neutral-900/80 rounded-xl p-3 mb-4 border border-neutral-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between text-neutral-300">
                        <span className="text-neutral-500 flex items-center gap-1">
                          <User className="w-3.5 h-3.5" /> Student:
                        </span>
                        <span className="font-semibold text-white">
                          {cred.userId?.name || "Student"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="text-neutral-500">Email:</span>
                        <span>{cred.userId?.email || "N/A"}</span>
                      </div>
                      {cred.userId?.department && (
                        <div className="flex items-center justify-between text-neutral-400">
                          <span className="text-neutral-500">Dept:</span>
                          <span className="text-emerald-400/90 font-medium">
                            {cred.userId.department}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Rejection / Expiration notes if applicable */}
                    {isRejected && cred.rejectionReason && (
                      <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-900/60 text-xs text-red-300 mb-4">
                        <span className="font-semibold">Reason:</span> {cred.rejectionReason}
                      </div>
                    )}

                    {isVerified && (
                      <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-[11px] text-emerald-300/80 mb-4 space-y-0.5">
                        <p>Verified by: <span className="font-medium text-neutral-200">{cred.verifiedBy?.name || "Manager"}</span></p>
                        {cred.expiresAt && (
                          <p>Valid through: <span className="font-medium text-neutral-200">{new Date(cred.expiresAt).toLocaleDateString()}</span></p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions & Inspect Button */}
                  <div className="pt-3 border-t border-neutral-700/60 flex flex-col gap-2">
                    <button
                      onClick={() => setInspectingCred(cred)}
                      className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white flex items-center justify-center gap-2 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Certificate Document
                    </button>

                    {isPending && (
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          disabled={processingId === cred._id}
                          onClick={() => handleVerify(cred._id, cred.type)}
                          className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {processingId === cred._id ? "Verifying..." : "Approve"}
                        </button>
                        <button
                          disabled={processingId === cred._id}
                          onClick={() => {
                            setRejectingCred(cred);
                            setRejectionReason("");
                          }}
                          className="py-2 px-3 text-xs font-semibold rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <X className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Reject Modal */}
      {rejectingCred && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-400" />
                Reject Credential
              </h3>
              <button
                onClick={() => setRejectingCred(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Please specify why <strong className="text-neutral-200">{rejectingCred.userId?.name}&apos;s</strong> {rejectingCred.type} cannot be verified. This will be audited and shared with the student.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Rejection Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Training certificate date is older than 2 years or document signature is missing."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg p-3 text-sm text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-red-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setRejectingCred(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rejectionReason.trim() || processingId === rejectingCred._id}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50"
                >
                  {processingId === rejectingCred._id ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect Document Modal */}
      {inspectingCred && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  {inspectingCred.type}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Uploaded by {inspectingCred.userId?.name} ({inspectingCred.userId?.email})
                </p>
              </div>
              <button
                onClick={() => setInspectingCred(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mb-4 bg-neutral-950 rounded-xl p-4 border border-neutral-800 flex flex-col items-center justify-center">
              {inspectingCred.documentUrl.startsWith("http") ? (
                <div className="w-full text-center">
                  {/* If it's an image */}
                  {inspectingCred.documentUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                    <img
                      src={inspectingCred.documentUrl}
                      alt="Credential Certificate"
                      className="max-h-96 mx-auto rounded-lg shadow-md object-contain"
                    />
                  ) : (
                    <div className="py-8 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-800 flex items-center justify-center mx-auto text-emerald-400">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-200">
                          External Certificate Document
                        </p>
                        <p className="text-xs text-neutral-500 font-mono mt-1 break-all max-w-md mx-auto">
                          {inspectingCred.documentUrl}
                        </p>
                      </div>
                      <a
                        href={inspectingCred.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                      >
                        Open Certificate in New Tab <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-xs text-neutral-400 font-mono">
                    {inspectingCred.documentUrl}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-neutral-500">
                Current status: <strong className="text-neutral-300">{inspectingCred.status}</strong>
              </span>
              <div className="flex gap-2">
                {inspectingCred.status === "pending" && (
                  <button
                    onClick={() => {
                      const id = inspectingCred._id;
                      const type = inspectingCred.type;
                      setInspectingCred(null);
                      handleVerify(id, type);
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Certificate
                  </button>
                )}
                <button
                  onClick={() => setInspectingCred(null)}
                  className="px-4 py-2 text-xs font-medium rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
