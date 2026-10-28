"use client";

import React, { useState, Suspense } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Award,
  UploadCloud,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  FileText,
  ExternalLink,
  Plus,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function CredentialsContent() {
  const { data: session } = useSession();
  const user = session?.user;
  const searchParams = useSearchParams();
  const prefillType = searchParams.get("type") || "";

  const { data, mutate, isLoading } = useSWR(
    user ? `/api/credentials` : null,
    fetcher
  );

  const credentials = data?.credentials || [];

  const [type, setType] = useState(prefillType || "3D Printer Safety Certification");
  const [docUrl, setDocUrl] = useState("https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const res = await fetch("/api/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          documentUrl: docUrl,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        setErrorMsg(resData.error || "Failed to submit credential");
      } else {
        setSuccess(true);
        mutate();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setErrorMsg("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const commonCertificates = [
    "3D Printer Safety Certification",
    "Media Lab Gear Certification",
    "Electronics & High-Voltage Protocol",
    "Cleanroom Level 1 Access",
    "Laser Cutter Safety Qualification",
    "BSL-2 Biosafety Training",
  ];

  return (
    <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 pb-6 border-b border-slate-900">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Award className="h-4 w-4" />
          <span>Safety & Competency Portfolio</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          My Safety Credentials
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Upload certificates and lab training documentation. Certified lab managers verify them before equipment access.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl backdrop-blur">
            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-indigo-400" />
              <span>Submit Certificate</span>
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Select or type the required certification name and provide the verification document URL.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>Certificate submitted! Sent to manager queue for review.</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Credential Type / Certificate Name
                </label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. 3D Printer Safety Certification"
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Quick select buttons */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1.5 font-medium">
                  Frequently Required Certifications:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commonCertificates.map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => setType(cert)}
                      className={`text-[10px] px-2 py-1 rounded-md border transition ${
                        type === cert
                          ? "bg-indigo-950 text-indigo-300 border-indigo-700"
                          : "bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200"
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Document URL / Proof of Completion
                </label>
                <input
                  type="url"
                  required
                  value={docUrl}
                  onChange={(e) => setDocUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Link to digital certificate, badge, or scan.
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Upload for Verification</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Active Credentials List */}
        <div className="lg:col-span-7">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-400" />
              <span>Current Status ({credentials.length})</span>
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-slate-800/60 animate-pulse" />
                ))}
              </div>
            ) : credentials.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                You have not submitted any safety credentials yet.
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred: any) => (
                  <div
                    key={cred._id}
                    className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-bold text-white">{cred.type}</h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            cred.status === "verified"
                              ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                              : cred.status === "pending"
                              ? "bg-amber-950 text-amber-300 border border-amber-800"
                              : "bg-red-950 text-red-300 border border-red-800"
                          }`}
                        >
                          {cred.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 space-y-0.5">
                        {cred.status === "verified" && cred.verifiedBy && (
                          <div>Verified by {cred.verifiedBy?.name || "Lab Manager"}</div>
                        )}
                        {cred.expiresAt && (
                          <div>Expires: {new Date(cred.expiresAt).toLocaleDateString()}</div>
                        )}
                        {cred.status === "pending" && (
                          <div className="text-amber-400/90">
                            Awaiting manager review in the verification queue.
                          </div>
                        )}
                        {cred.status === "rejected" && cred.rejectionReason && (
                          <div className="text-red-400">Reason: {cred.rejectionReason}</div>
                        )}
                      </div>
                    </div>

                    <a
                      href={cred.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Inspect Document"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UserCredentialsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading credentials...</div>}>
        <CredentialsContent />
      </Suspense>
    </div>
  );
}
