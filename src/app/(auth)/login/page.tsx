"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Layers, LogIn, Sparkles, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { PillButton } from "@/components/PillButton";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (res?.error) {
        setError(res.error || "Invalid credentials");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
  };

  const demoAccounts = [
    { label: "Admin", email: "admin@campus.test", desc: "Global audit & controls", badge: "admin" },
    { label: "Owner (Engineering)", email: "owner.eng@campus.test", desc: "Makerspace & 3D printer", badge: "owner" },
    { label: "Owner (Media)", email: "owner.media@campus.test", desc: "DSLR cameras & sound booth", badge: "owner" },
    { label: "Manager", email: "manager@campus.test", desc: "Check-in/return & verification", badge: "manager" },
    { label: "Student A (Eligible)", email: "student.a@campus.test", desc: "Verified credentials", badge: "user" },
    { label: "Student B (Missing Cred)", email: "student.b@campus.test", desc: "Needs safety cert", badge: "user" },
    { label: "Student C (Quota Limit)", email: "student.c@campus.test", desc: "Used 8/8 weekly hrs", badge: "user" },
  ];

  return (
    <GlassCard className="w-full max-w-4xl grid md:grid-cols-5 gap-6 sm:gap-8 p-6 sm:p-8 shadow-2xl">
      {/* Left Form Column */}
      <div className="md:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#2F6BFF] to-[#38bdf8] flex items-center justify-center shadow-md shadow-[#2F6BFF]/25">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0F1E4D] tracking-tight">AccessHub</h1>
              <p className="text-xs text-slate-400 font-medium">Campus Resource Sharing</p>
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-[#0F1E4D] tracking-tight mb-2">Welcome Back</h2>
          <p className="text-xs sm:text-sm text-slate-500 mb-6">
            Sign in to reserve campus equipment, access specialized labs, and view bookings.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F1E4D] mb-1.5">
                Campus Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.test"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#0F1E4D] mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
              />
            </div>

            <PillButton
              type="submit"
              disabled={loading}
              className="w-full mt-2"
              showArrow
            >
              {loading ? "Signing in..." : "Sign In to AccessHub"}
            </PillButton>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[#2F6BFF] font-semibold hover:underline">
            Register here
          </Link>
        </div>
      </div>

      {/* Right Demo Accounts Column with Clean Role Chips */}
      <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F1E4D]">
              Demo Quick-Fill
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-3 leading-relaxed">
            Select any role chip below to auto-fill credentials:
          </p>

          <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
            {demoAccounts.map((acc) => {
              const isSelected = email === acc.email;
              return (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`w-full text-left p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-2 select-none ${
                    isSelected
                      ? "bg-[#EEF4FF] border-[#2F6BFF] shadow-sm text-[#0F1E4D]"
                      : "bg-white/80 border-slate-200/70 hover:border-[#2F6BFF]/40 hover:bg-[#F8FAFF] text-slate-600"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#0F1E4D] truncate">{acc.label}</div>
                    <div className="text-[10px] text-slate-400 truncate">{acc.desc}</div>
                    <div className="text-[10px] text-[#2F6BFF] font-mono truncate">{acc.email}</div>
                  </div>
                  <span
                    className={`shrink-0 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                      acc.badge === "admin"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : acc.badge === "owner"
                        ? "bg-blue-50 text-[#2F6BFF] border-blue-200"
                        : acc.badge === "manager"
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}
                  >
                    {acc.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 p-2.5 rounded-xl bg-[#E6F9F0] border border-[#A7F3D0]/60 text-[11px] text-[#059669] flex items-center gap-2 font-medium">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Demo database ready with pre-configured personas</span>
        </div>
      </div>
    </GlassCard>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-transparent text-slate-600">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-400">
            <span className="inline-block h-6 w-6 border-2 border-[#2F6BFF] border-t-transparent rounded-full animate-spin mb-2" />
            <div>Loading login portal...</div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
