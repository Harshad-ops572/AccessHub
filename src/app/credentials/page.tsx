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
  const [docUrl, setDocUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/uploads", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Upload failed");
        setShowUrlFallback(true);
      } else {
        setDocUrl(data.url);
      }
    } catch {
      setErrorMsg("Failed to upload file");
      setShowUrlFallback(true);
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUrl) {
      setErrorMsg("Please upload a file or provide a document URL");
      return;
    }
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
      <div className="mb-8 pb-6 border-b border-slate-200/70">
        <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-1">
          <Award className="h-4 w-4" />
          <span>Safety & Competency Portfolio</span>
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F1E4D] tracking-tight">
          My Safety Credentials
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Upload certificates and lab training documentation. Certified lab managers verify them before equipment access.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Left Column: Upload Form */}
        <div className="lg:col-span-5">
          <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-base font-bold text-[#0F1E4D] mb-1 flex items-center gap-2">
              <UploadCloud className="h-4 w-4 text-[#2F6BFF]" />
              <span>Submit Certificate</span>
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Select or type the required certification name and provide the verification document URL.
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Certificate submitted! Sent to manager queue for review.</span>
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Credential Type / Certificate Name
                </label>
                <input
                  type="text"
                  required
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  placeholder="e.g. 3D Printer Safety Certification"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                />
              </div>

              {/* Quick select buttons */}
              <div>
                <span className="text-[10px] text-slate-500 block mb-1.5 font-semibold">
                  Frequently Required Certifications:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {commonCertificates.map((cert) => (
                    <button
                      key={cert}
                      type="button"
                      onClick={() => setType(cert)}
                      className={`text-[10px] px-2.5 py-1 rounded-full border transition font-medium ${
                        type === cert
                          ? "bg-blue-50 text-[#2F6BFF] border-blue-200"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900"
                      }`}
                    >
                      {cert}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Upload Document / Proof of Completion
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#2F6BFF] file:text-white hover:file:bg-blue-600 file:cursor-pointer p-2 rounded-xl bg-slate-50 border border-slate-200"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  PNG, JPG, WEBP images or PDF under 5 MB.
                </span>

                {uploading && (
                  <div className="mt-2 text-xs text-[#2F6BFF] flex items-center gap-2">
                    <span className="inline-block h-3 w-3 border-2 border-blue-200 border-t-[#2F6BFF] rounded-full animate-spin" />
                    <span>Uploading file to storage...</span>
                  </div>
                )}

                {docUrl && (
                  <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span className="truncate">Attached: {docUrl}</span>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowUrlFallback(!showUrlFallback)}
                    className="text-[11px] text-[#2F6BFF] hover:underline font-medium"
                  >
                    {showUrlFallback ? "Hide URL input" : "Or paste URL directly"}
                  </button>
                </div>

                {showUrlFallback && (
                  <div className="mt-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Document URL (Fallback)
                    </label>
                    <input
                      type="url"
                      value={docUrl}
                      onChange={(e) => setDocUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting || uploading}
                className="w-full py-2.5 px-4 rounded-full bg-[#2F6BFF] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
              >
                {submitting ? (
                  <span className="inline-block h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
          <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
            <h2 className="text-base font-bold text-[#0F1E4D] flex items-center gap-2">
              <Award className="h-4 w-4 text-[#2F6BFF]" />
              <span>Current Status ({credentials.length})</span>
            </h2>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-2xl bg-white/70 border border-slate-200/60 animate-pulse shadow-xs" />
                ))}
              </div>
            ) : credentials.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                You have not submitted any safety credentials yet.
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred: any) => (
                  <div
                    key={cred._id}
                    className="p-4 rounded-2xl bg-white border border-slate-200/70 flex items-start justify-between gap-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xs font-bold text-[#0F1E4D]">{cred.type}</h3>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            cred.status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : cred.status === "pending"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-red-50 text-red-600 border border-red-200"
                          }`}
                        >
                          {cred.status}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 space-y-0.5">
                        {cred.status === "verified" && cred.verifiedBy && (
                          <div>Verified by {cred.verifiedBy?.name || "Lab Manager"}</div>
                        )}
                        {cred.expiresAt && (
                          <div>Expires: {new Date(cred.expiresAt).toLocaleDateString()}</div>
                        )}
                        {cred.status === "pending" && (
                          <div className="text-amber-700 font-medium">
                            Awaiting manager review in the verification queue.
                          </div>
                        )}
                        {cred.status === "rejected" && cred.rejectionReason && (
                          <div className="text-red-600">Reason: {cred.rejectionReason}</div>
                        )}
                      </div>
                    </div>

                    <a
                      href={cred.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition"
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
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading credentials...</div>}>
        <CredentialsContent />
      </Suspense>
    </div>
  );
}
