"use client";

import React from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import {
  Layers,
  Plus,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Settings,
  ExternalLink,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function OwnerResourcesPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const { data, error, isLoading, mutate } = useSWR(
    user ? `/api/resources?ownerId=${user.id}` : null,
    fetcher
  );

  const resources = data?.resources || [];

  const handleToggleStatus = async (resourceId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "active" ? "maintenance" : "active";
    try {
      await fetch(`/api/resources/${resourceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          reason: `Owner toggled status to ${nextStatus}`,
        }),
      });
      mutate();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-900">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Layers className="h-4 w-4" />
              <span>Departmental Equipment Portfolio</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Manage Lab & Equipment Listings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Publish underused lab assets, adjust safety credential prerequisites, and update availability.
            </p>
          </div>

          <Link
            href="/owner/resources/new"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>List New Equipment</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 max-w-md mx-auto">
            <Layers className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No equipment listed yet</h3>
            <p className="text-xs text-slate-400 mb-6">
              Share your underused laboratory gear, makerspace cutters, or cameras with certified campus teams.
            </p>
            <Link
              href="/owner/resources/new"
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              Add First Listing
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {resources.map((res: any) => (
              <div
                key={res._id}
                className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                    <img
                      src={res.photos?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=200&q=80"}
                      alt={res.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-white">{res.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 capitalize border border-slate-700">
                        {res.category}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-indigo-400" />
                        {res.location}
                      </span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        Max {res.maxDurationHours}h
                      </span>
                      <span>&bull;</span>
                      <span>
                        {res.requiredCredentials?.length || 0} safety prerequisites
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* Status Toggle Button */}
                  <button
                    onClick={() => handleToggleStatus(res._id, res.status)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                      res.status === "active"
                        ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/60 hover:bg-emerald-950/80"
                        : "bg-amber-950/40 text-amber-300 border-amber-800/60 hover:bg-amber-950/80"
                    }`}
                  >
                    {res.status === "active" ? "Active (Click to Pause)" : "Maintenance (Click to Activate)"}
                  </button>

                  <Link
                    href={`/resources/${res._id}`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                    title="View Public Page"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
