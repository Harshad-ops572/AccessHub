"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  ShieldCheck,
  Compass,
  ScrollText,
  Sparkles,
  ArrowRight,
  Lock,
  Clock,
  ClipboardCheck,
} from "lucide-react";
import { useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-20 sm:py-28 border-b border-slate-900 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(99,102,241,0.2),rgba(15,23,42,0))]">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0a_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-700/50 text-indigo-300 text-xs font-semibold mb-6 backdrop-blur shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>Campus Resource & Equipment Sharing Platform</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1] sm:leading-[1.1]">
              Unlock underused campus labs, <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                makerspaces, and tools
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              A trusted, auditable platform where academic departments share advanced research equipment with students and innovators. Built with hard safety verification, condition inspections, and explainable fair allocation.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/resources"
                className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-sm transition-all duration-200 flex items-center gap-2 shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/40 group hover:-translate-y-0.5"
              >
                <Compass className="h-4 w-4" />
                <span>Explore Campus Resources</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {user ? (
                <Link
                  href={
                    user.role === "owner"
                      ? "/owner/queue"
                      : user.role === "manager"
                      ? "/manager/checkin"
                      : user.role === "admin"
                      ? "/admin/audit"
                      : "/bookings"
                  }
                  className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition flex items-center gap-2 shadow-md hover:-translate-y-0.5"
                >
                  <span>Go to My Dashboard ({user.role})</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-sm transition flex items-center gap-2 shadow-md hover:-translate-y-0.5"
                >
                  <Lock className="h-4 w-4 text-slate-400" />
                  <span>Demo Logins (1-Click Switcher)</span>
                </Link>
              )}
            </div>

            {/* Quick stats / Highlights */}
            <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur transition-all">
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  Safety Verification
                </div>
                <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Required credentials verified by certified lab managers before access.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur transition-all">
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-400" />
                  Zero Conflicts
                </div>
                <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Database transactions prevent double bookings with suggested alternatives.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur transition-all">
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-amber-400" />
                  Condition Tracking
                </div>
                <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Check-in and return photos & ratings detect damage or deterioration instantly.
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 backdrop-blur transition-all">
                <div className="text-base font-bold text-white flex items-center gap-2">
                  <ScrollText className="h-4 w-4 text-purple-400" />
                  Audit Trail
                </div>
                <div className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Append-only immutable record of every approval, rejection, and condition change.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5-Minute Judge Tour Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              5-Minute Evaluation Walkthrough
            </h2>
            <p className="text-sm text-slate-400 mt-2 max-w-xl mx-auto">
              Follow this recommended journey to experience the end-to-end lifecycle across roles.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 relative group hover:border-indigo-600/50 transition">
              <div className="h-8 w-8 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 flex items-center justify-center font-bold text-xs mb-4">
                1
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Discovery & Eligibility Engine
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Log in as <span className="text-indigo-300 font-mono">student.b</span>. Attempt to book the Ultimaker 3D Printer. Notice the eligibility engine detects a missing Safety Certification, guides you to upload it, and records reasons.
              </p>
              <Link
                href="/resources"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <span>Browse equipment</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 relative group hover:border-indigo-600/50 transition">
              <div className="h-8 w-8 rounded-lg bg-blue-950 border border-blue-700/60 text-blue-400 flex items-center justify-center font-bold text-xs mb-4">
                2
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Approval Queue & Quotas
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Switch to <span className="text-blue-300 font-mono">owner.eng</span>. Review the pending queue with eligibility and fairness snapshots. Approve or waitlist with a mandatory recorded reason.
              </p>
              <Link
                href="/login"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <span>Switch to Owner</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 relative group hover:border-indigo-600/50 transition">
              <div className="h-8 w-8 rounded-lg bg-amber-950 border border-amber-700/60 text-amber-400 flex items-center justify-center font-bold text-xs mb-4">
                3
              </div>
              <h3 className="text-base font-semibold text-white mb-2">
                Check-in, Return & Audit
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Log in as <span className="text-amber-300 font-mono">manager</span>. Perform check-in inspection, then return condition rating comparison. Flag damage incident, inspect advisory AI summary, and review the immutable timeline.
              </p>
              <Link
                href="/login"
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>Switch to Manager</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-900 py-8 bg-slate-950 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>AccessHub &copy; 2026. All campus demo data is fictional.</div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Next.js App Router</span>
            <span>&bull;</span>
            <span>MongoDB Atlas</span>
            <span>&bull;</span>
            <span>Auth.js RBAC</span>
            <span>&bull;</span>
            <span>Zod</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
