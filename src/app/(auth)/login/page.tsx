"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, LogIn, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

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
    { label: "Owner (Eng)", email: "owner.eng@campus.test", desc: "Makerspace & 3D printer", badge: "owner" },
    { label: "Owner (Media)", email: "owner.media@campus.test", desc: "DSLR cameras & sound booth", badge: "owner" },
    { label: "Manager", email: "manager@campus.test", desc: "Check-in/return & verification", badge: "manager" },
    { label: "Student A (Eligible)", email: "student.a@campus.test", desc: "Verified credentials", badge: "user" },
    { label: "Student B (Missing Cred)", email: "student.b@campus.test", desc: "Needs safety cert", badge: "user" },
    { label: "Student C (Quota Limit)", email: "student.c@campus.test", desc: "Used 8/8 weekly hrs", badge: "user" },
  ];

  return (
    <div className="w-full max-w-4xl grid md:grid-cols-5 gap-6 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur shadow-2xl">
      {/* Left Form Column */}
      <div className="md:col-span-3 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">AccessHub</h1>
              <p className="text-xs text-slate-400">Trusted Campus Resource Sharing</p>
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-white mb-2">Welcome Back</h2>
          <p className="text-sm text-slate-400 mb-6">
            Log in with your college credentials to reserve equipment, labs, and spaces.
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-800/80 text-red-200 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Campus Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@campus.test"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-indigo-400 hover:underline font-medium">
            Register here
          </Link>
        </div>
      </div>

      {/* Right Demo Accounts Column */}
      <div className="md:col-span-2 border-t md:border-t-0 md:border-l border-slate-800/80 pt-6 md:pt-0 md:pl-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Judge / Demo Quick Login
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Click any role below to prefill credentials (password is <code className="text-slate-300">password123</code>):
          </p>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {demoAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickFill(acc.email)}
                className={`w-full text-left p-2.5 rounded-lg border transition flex items-start justify-between gap-2 ${
                  email === acc.email
                    ? "bg-indigo-950/60 border-indigo-500/80 text-white"
                    : "bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 text-slate-300"
                }`}
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 truncate">{acc.label}</div>
                  <div className="text-[11px] text-slate-400 truncate">{acc.desc}</div>
                  <div className="text-[10px] text-indigo-400 font-mono truncate">{acc.email}</div>
                </div>
                <span
                  className={`shrink-0 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                    acc.badge === "admin"
                      ? "bg-purple-900/60 text-purple-300 border border-purple-700/50"
                      : acc.badge === "owner"
                      ? "bg-blue-900/60 text-blue-300 border border-blue-700/50"
                      : acc.badge === "manager"
                      ? "bg-amber-900/60 text-amber-300 border border-amber-700/50"
                      : "bg-emerald-900/60 text-emerald-300 border border-emerald-700/50"
                  }`}
                >
                  {acc.badge}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 p-2.5 rounded-lg bg-slate-800/30 border border-slate-700/40 text-[11px] text-slate-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>Fictional campus seed data ready</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-950 text-slate-100">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-400">
            <span className="inline-block h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
            <div>Loading login portal...</div>
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
