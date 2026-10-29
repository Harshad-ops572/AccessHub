"use client";

import React, { use, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { GlassCard } from "@/components/GlassCard";
import { PillButton } from "@/components/PillButton";
import { StatusBadge } from "@/components/StatusBadge";
import {
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowLeft,
  Info,
  ChevronRight,
  BookOpen,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ResourceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const resourceId = resolvedParams.id;

  const { data: session } = useSession();
  const user = session?.user;
  const [imgError, setImgError] = useState(false);

  const { data: resData, error: resError, isLoading: resLoading } = useSWR(
    `/api/resources/${resourceId}`,
    fetcher
  );

  const { data: availData } = useSWR(
    `/api/resources/${resourceId}/availability`,
    fetcher
  );

  // Fetch current user credentials to evaluate eligibility
  const { data: credsData } = useSWR(
    user ? `/api/credentials` : null,
    fetcher
  );

  const resource = resData?.resource;
  const userCredentials = credsData?.credentials || [];

  const verifiedUserCredTypes = userCredentials
    .filter((c: any) => c.status === "verified" && (!c.expiresAt || new Date(c.expiresAt) > new Date()))
    .map((c: any) => c.type.toLowerCase().trim());

  const requiredCredentials = resource?.requiredCredentials || [];

  const credentialChecks = requiredCredentials.map((req: string) => {
    const isMet = verifiedUserCredTypes.includes(req.toLowerCase().trim());
    return {
      requirement: req,
      met: isMet,
      reason: isMet
        ? "Verified certificate on file and active"
        : "Missing verified safety certificate",
    };
  });

  const isEligible = credentialChecks.every((c: any) => c.met);

  if (resLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent text-slate-600 font-sans">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="h-64 rounded-3xl bg-white/70 border border-white animate-pulse mb-8" />
          <div className="h-48 rounded-3xl bg-white/70 border border-white animate-pulse" />
        </main>
      </div>
    );
  }

  if (resError || !resource) {
    return (
      <div className="min-h-screen flex flex-col bg-transparent text-slate-600 font-sans">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <GlassCard className="p-8 shadow-xl">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-extrabold text-[#0F1E4D] mb-2">Resource Not Found</h2>
            <p className="text-xs sm:text-sm text-slate-500 mb-6">
              The equipment or space you are looking for does not exist or has been retired.
            </p>
            <PillButton href="/resources" variant="primary">
              Back to Directory
            </PillButton>
          </GlassCard>
        </main>
      </div>
    );
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hasPhoto = resource.photos && resource.photos.length > 0 && !imgError;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-600 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Back Link */}
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#2F6BFF] transition-colors mb-6 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Back to Resources Directory</span>
        </Link>

        {/* Main Grid: Details on Left, Booking & Eligibility on Right */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column (Details, Specs, Rules) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header / Media Banner */}
            <GlassCard className="overflow-hidden shadow-xl">
              <div className="h-72 sm:h-96 w-full relative bg-slate-100">
                {hasPhoto ? (
                  <img
                    src={resource.photos[0]}
                    alt={resource.title}
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-blue-100 via-indigo-50 to-sky-100 flex items-center justify-center text-[#2F6BFF]">
                    <span className="text-sm font-semibold capitalize">{resource.category}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/95 text-[#0F1E4D] backdrop-blur border border-white capitalize shadow-sm">
                    {resource.category}
                  </span>
                  <StatusBadge status={resource.status} />
                </div>
              </div>

              <div className="p-6 sm:p-8">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E4D] tracking-tight mb-3">
                  {resource.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mb-5">
                  <div className="flex items-center gap-1.5 bg-[#F4F7FF] px-3 py-1.5 rounded-full border border-[#2F6BFF]/15">
                    <MapPin className="h-4 w-4 text-[#2F6BFF]" />
                    <span className="font-medium text-[#0F1E4D]">{resource.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#F4F7FF] px-3 py-1.5 rounded-full border border-[#2F6BFF]/15">
                    <Clock className="h-4 w-4 text-[#2F6BFF]" />
                    <span className="font-medium text-[#0F1E4D]">Max {resource.maxDurationHours}h per booking</span>
                  </div>
                  {resource.ownerId && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <span>Managed by:</span>
                      <strong className="text-[#0F1E4D]">
                        {resource.ownerId.department || resource.ownerId.name}
                      </strong>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {resource.description}
                </p>
              </div>
            </GlassCard>

            {/* Rules of Usage */}
            <GlassCard className="p-6 shadow-md">
              <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-3">
                <BookOpen className="h-4 w-4" />
                <span>Operating Rules & Handover Guidelines</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-[#F8FAFF] p-4 rounded-2xl border border-slate-100">
                {resource.rules || "Standard campus makerspace and laboratory conduct rules apply. Report all abnormalities immediately."}
              </p>
            </GlassCard>

            {/* Operating Windows (Availability Schedule) */}
            <GlassCard className="p-6 shadow-md">
              <div className="flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-3">
                <Calendar className="h-4 w-4" />
                <span>Weekly Operational Hours</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {resource.availability?.map((win: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-[#F8FAFF] border border-slate-100 text-xs"
                  >
                    <div className="font-bold text-[#0F1E4D]">
                      {daysOfWeek[win.dayOfWeek]}
                    </div>
                    <div className="text-[11px] text-[#2F6BFF] font-semibold mt-0.5">
                      {win.startTime} &ndash; {win.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Right Column (Eligibility & Booking Card) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Eligibility Engine Status Card */}
            <GlassCard className="p-6 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#2F6BFF]" />
                  <h2 className="text-xs sm:text-sm font-extrabold text-[#0F1E4D] uppercase tracking-wider">
                    Safety & Eligibility Engine
                  </h2>
                </div>
                {user && (
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                      isEligible
                        ? "bg-[#E6F9F0] text-[#059669] border-[#A7F3D0]"
                        : "bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]"
                    }`}
                  >
                    {isEligible ? "Pass" : "Missing Requirements"}
                  </span>
                )}
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <Lock className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 mb-4">
                    Please log in to verify your credentials against this equipment&apos;s requirements.
                  </p>
                  <PillButton
                    href={`/login?callbackUrl=/resources/${resourceId}`}
                    variant="primary"
                    size="sm"
                  >
                    Log In to AccessHub
                  </PillButton>
                </div>
              ) : (
                <div className="space-y-4">
                  {requiredCredentials.length === 0 ? (
                    <div className="p-3.5 rounded-2xl bg-[#E6F9F0] border border-[#A7F3D0] text-xs text-[#059669] flex items-start gap-2.5 font-medium">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[#10B981] mt-0.5" />
                      <div>
                        <div className="font-bold">No specialized certificate required</div>
                        <div className="text-[11px] text-[#059669]/80 mt-0.5">
                          Open to all campus researchers and students with verified status.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {credentialChecks.map((chk: any) => (
                        <div
                          key={chk.requirement}
                          className={`p-3 rounded-2xl border text-xs flex items-start justify-between gap-2.5 transition ${
                            chk.met
                              ? "bg-[#F0FDF4] border-[#BBF7D0] text-slate-700"
                              : "bg-[#FFFBEB] border-[#FDE68A] text-slate-700"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {chk.met ? (
                              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-bold text-[#0F1E4D]">{chk.requirement}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5">{chk.reason}</div>
                            </div>
                          </div>
                          {!chk.met && (
                            <Link
                              href={`/credentials?type=${encodeURIComponent(chk.requirement)}`}
                              className="shrink-0 px-2.5 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold transition shadow-sm"
                            >
                              Upload
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quota indicator */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Your Weekly Hours:</span>
                    <strong className="text-[#0F1E4D]">
                      {user.weeklyHoursUsed || 0} / 8 hrs used
                    </strong>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isEligible ? (
                      <PillButton
                        href={`/resources/${resourceId}/book`}
                        variant="primary"
                        showArrow
                        className="w-full"
                      >
                        Proceed to Slot Reservation
                      </PillButton>
                    ) : (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-full bg-slate-100 text-slate-400 font-bold text-xs sm:text-sm cursor-not-allowed flex items-center justify-center gap-2 border border-slate-200"
                        >
                          <Lock className="h-4 w-4" />
                          <span>Reservation Blocked (Missing Certificate)</span>
                        </button>
                        <p className="text-[11px] text-amber-600 text-center font-medium">
                          Upload your safety document to allow a lab manager to verify your access.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Congestion & Busy Slots Summary */}
            {availData?.busySlots && availData.busySlots.length > 0 && (
              <GlassCard className="p-5 text-xs shadow-md">
                <div className="font-bold text-[#0F1E4D] mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-[#2F6BFF]" />
                  <span>Upcoming Reserved Slots</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {availData.busySlots.map((b: any, i: number) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-[#F8FAFF] border border-slate-100 text-slate-600 flex items-center justify-between"
                    >
                      <span>
                        {new Date(b.start).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                        {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        Reserved
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
