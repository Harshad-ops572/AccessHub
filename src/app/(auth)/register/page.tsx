"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Layers, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { GlassCard } from "@/components/GlassCard";
import { PillButton } from "@/components/PillButton";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Mechanical Engineering");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, department }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      }
    } catch {
      setError("An unexpected error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  const departments = [
    "Mechanical Engineering",
    "Computer Science & AI",
    "Electrical & Electronics",
    "Media & Design Arts",
    "Civil & Environmental",
    "Biomedical Research",
    "Business & Entrepreneurship",
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-transparent text-slate-600">
      <GlassCard className="w-full max-w-lg p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-[#2F6BFF] to-[#38bdf8] flex items-center justify-center shadow-md shadow-[#2F6BFF]/25">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-[#0F1E4D] tracking-tight">AccessHub</h1>
            <p className="text-xs text-slate-400 font-medium">Join Campus Resource Network</p>
          </div>
        </div>

        <h2 className="text-2xl font-extrabold text-[#0F1E4D] tracking-tight mb-2">Create Account</h2>
        <p className="text-xs sm:text-sm text-slate-500 mb-6">
          Register with your institutional details to access shared labs, equipment, and makerspaces.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 rounded-xl bg-[#E6F9F0] border border-[#A7F3D0] text-[#059669] text-xs flex items-center gap-2 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Account created! Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F1E4D] mb-1.5">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1E4D] mb-1.5">Campus Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@campus.test"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1E4D] mb-1.5">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#0F1E4D] mb-1.5">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <PillButton
            type="submit"
            disabled={loading || success}
            className="w-full mt-2"
            showArrow
          >
            {loading ? "Registering..." : "Create Free Account"}
          </PillButton>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
          Already registered?{" "}
          <Link href="/login" className="text-[#2F6BFF] font-semibold hover:underline">
            Sign in
          </Link>
        </div>
      </GlassCard>
    </div>
  );
}
