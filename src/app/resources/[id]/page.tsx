"use client";

import React, { use, useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
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
  ExternalLink,
  ChevronRight,
  BookOpen,
  Sparkles,
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
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-12">
          <div className="h-64 rounded-2xl bg-slate-900 animate-pulse mb-8" />
          <div className="h-48 rounded-2xl bg-slate-900 animate-pulse" />
        </main>
      </div>
    );
  }

  if (resError || !resource) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto px-4 py-16 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Resource Not Found</h2>
          <p className="text-sm text-slate-400 mb-6">
            The equipment or space you are looking for does not exist or has been retired.
          </p>
          <Link
            href="/resources"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
          >
            Back to Directory
          </Link>
        </main>
      </div>
    );
  }

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Back Link */}
        <Link
          href="/resources"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-6"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Resources Directory</span>
        </Link>

        {/* Main Grid: Details on Left, Booking & Eligibility on Right */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column (Details, Specs, Rules) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Header / Media Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl">
              <div className="h-72 sm:h-96 w-full relative">
                <img
                  src={
                    resource.photos?.[0] ||
                    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80"
                  }
                  alt={resource.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-950/80 text-white backdrop-blur border border-slate-700 capitalize">
                    {resource.category}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                      resource.status === "active"
                        ? "bg-emerald-950/80 text-emerald-300 border border-emerald-700/60"
                        : "bg-amber-950/80 text-amber-300 border border-amber-700/60"
                    }`}
                  >
                    {resource.status}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-2">
                  {resource.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-indigo-400" />
                    <span>{resource.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-indigo-400" />
                    <span>Max {resource.maxDurationHours}h per booking</span>
                  </div>
                  {resource.ownerId && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500">Department:</span>
                      <span className="text-slate-300 font-medium">
                        {resource.ownerId.department || resource.ownerId.name}
                      </span>
                    </div>
                  )}
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {resource.description}
                </p>
              </div>
            </div>

            {/* Rules of Usage */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <BookOpen className="h-4 w-4" />
                <span>Operating Rules & Handover Guidelines</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                {resource.rules || "Standard campus makerspace and laboratory conduct rules apply. Report all abnormalities immediately."}
              </p>
            </div>

            {/* Operating Windows (Availability Schedule) */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-3">
                <Calendar className="h-4 w-4" />
                <span>Weekly Operational Hours</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {resource.availability?.map((win: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                  >
                    <div className="font-semibold text-slate-200">
                      {daysOfWeek[win.dayOfWeek]}
                    </div>
                    <div className="text-[11px] text-indigo-400 mt-0.5">
                      {win.startTime} &ndash; {win.endTime}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (Eligibility & Booking Card) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Eligibility Engine Status Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Safety & Eligibility Engine
                  </h2>
                </div>
                {user && (
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      isEligible
                        ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/60"
                        : "bg-amber-950/80 text-amber-300 border-amber-700/60"
                    }`}
                  >
                    {isEligible ? "Pass" : "Missing Requirements"}
                  </span>
                )}
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <Lock className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 mb-4">
                    Please log in to verify your credentials against this equipment&apos;s requirements.
                  </p>
                  <Link
                    href={`/login?callbackUrl=/resources/${resourceId}`}
                    className="inline-block px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition"
                  >
                    Log In to AccessHub
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {requiredCredentials.length === 0 ? (
                    <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-300 flex items-start gap-2.5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <div>
                        <div className="font-semibold">No specialized certificate required</div>
                        <div className="text-[11px] text-emerald-400/80 mt-0.5">
                          Open to all campus researchers and students with verified status.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {credentialChecks.map((chk: any) => (
                        <div
                          key={chk.requirement}
                          className={`p-3 rounded-xl border text-xs flex items-start justify-between gap-2.5 transition ${
                            chk.met
                              ? "bg-emerald-950/20 border-emerald-800/40 text-slate-200"
                              : "bg-amber-950/30 border-amber-800/50 text-slate-200"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {chk.met ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            )}
                            <div>
                              <div className="font-semibold text-white">{chk.requirement}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">{chk.reason}</div>
                            </div>
                          </div>
                          {!chk.met && (
                            <Link
                              href={`/credentials?type=${encodeURIComponent(chk.requirement)}`}
                              className="shrink-0 px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold transition"
                            >
                              Upload
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Quota indicator */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Your Weekly Hours:</span>
                    <span className="font-semibold text-slate-200">
                      {user.weeklyHoursUsed || 0} / 8 hrs used
                    </span>
                  </div>

                  {/* Action Button */}
                  <div className="pt-2">
                    {isEligible ? (
                      <Link
                        href={`/resources/${resourceId}/book`}
                        className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                      >
                        <Calendar className="h-4 w-4" />
                        <span>Proceed to Slot Reservation</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <div className="space-y-2">
                        <button
                          disabled
                          className="w-full py-3 px-4 rounded-xl bg-slate-800 text-slate-500 font-semibold text-sm cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          <Lock className="h-4 w-4" />
                          <span>Reservation Blocked (Missing Certificate)</span>
                        </button>
                        <p className="text-[11px] text-amber-400/90 text-center">
                          Upload your safety document to allow a lab manager to verify your access.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Congestion & Busy Slots Summary */}
            {availData?.busySlots && availData.busySlots.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
                <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <span>Upcoming Reserved Slots</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {availData.busySlots.map((b: any, i: number) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 flex items-center justify-between"
                    >
                      <span>
                        {new Date(b.start).toLocaleDateString([], { month: "short", day: "numeric" })},{" "}
                        {new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(b.end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-amber-400">
                        Reserved
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
