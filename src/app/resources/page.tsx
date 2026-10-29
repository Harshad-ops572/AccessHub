"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { ResourceCard } from "@/components/ResourceCard";
import { GlassCard } from "@/components/GlassCard";
import { SectionHeader } from "@/components/SectionHeader";
import {
  Search,
  Compass,
  Layers,
  FlaskConical,
  Camera,
  DoorOpen,
  Cpu,
  Gauge,
  X,
  Filter,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ResourcesDiscoveryPage() {
  const { data: session } = useSession();
  const user = session?.user;

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [location, setLocation] = useState("");
  const [eligibleOnly, setEligibleOnly] = useState(false);

  // Construct URL with query parameters
  const params = new URLSearchParams();
  if (search) params.append("query", search);
  if (category && category !== "all") params.append("category", category);
  if (location) params.append("location", location);
  if (eligibleOnly) params.append("eligibleOnly", "true");

  const { data, error, isLoading } = useSWR(
    `/api/resources?${params.toString()}`,
    fetcher
  );

  const resources = data?.resources || [];

  const categories = [
    { id: "all", label: "All Equipment", icon: Compass },
    { id: "makerspace", label: "Makerspace", icon: Layers },
    { id: "lab", label: "Research Labs", icon: FlaskConical },
    { id: "camera", label: "Cameras & Media", icon: Camera },
    { id: "computer", label: "Computers & IT", icon: Cpu },
    { id: "testing", label: "Testing & Diagnostic", icon: Gauge },
    { id: "room", label: "Studios & Rooms", icon: DoorOpen },
  ];

  const handleResetFilters = () => {
    setSearch("");
    setCategory("all");
    setLocation("");
    setEligibleOnly(false);
  };

  const hasActiveFilters = search || category !== "all" || location || eligibleOnly;

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-slate-600 font-sans">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 text-[#2F6BFF] text-xs font-bold uppercase tracking-wider mb-2 bg-[#EEF4FF] px-3 py-1 rounded-full border border-[#2F6BFF]/20">
              <Compass className="h-3.5 w-3.5" />
              <span>Campus Resource Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F1E4D] tracking-tight">
              Discover Equipment & Spaces
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Browse departmental makerspace tools, cameras, electron microscopes, and collaboration rooms. Real-time credential matching verifies your eligibility instantly.
            </p>
          </div>

          {/* Quick stats summary */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs px-3.5 py-1.5 rounded-full bg-white/80 border border-white shadow-sm text-slate-600 font-semibold">
              <strong className="text-[#0F1E4D]">{resources.length}</strong> resources listed
            </span>
          </div>
        </div>

        {/* Filter Controls Bar in GlassCard */}
        <GlassCard className="p-4 sm:p-5 mb-8 space-y-4 shadow-xl">
          <div className="grid md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tool name, model, safety credential, or specs..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Location Filter */}
            <div className="md:col-span-3">
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Filter by building / hall..."
                className="w-full px-4 py-2.5 rounded-full bg-[#F4F7FF] border border-[#2F6BFF]/15 text-[#0F1E4D] placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#2F6BFF]/40 focus:border-[#2F6BFF] focus:bg-white transition"
              />
            </div>

            {/* "I'm Eligible" Toggle */}
            <div className="md:col-span-3 flex items-center justify-between sm:justify-end gap-3 px-4 py-2 rounded-full bg-[#F4F7FF] border border-[#2F6BFF]/15">
              <label
                htmlFor="eligibleToggle"
                className="text-xs font-bold text-[#0F1E4D] cursor-pointer select-none"
              >
                &ldquo;I&apos;m Eligible&rdquo; Only
              </label>
              <button
                id="eligibleToggle"
                type="button"
                onClick={() => setEligibleOnly(!eligibleOnly)}
                disabled={!user}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 ${
                  eligibleOnly ? "bg-[#2F6BFF]" : "bg-slate-300"
                }`}
                title={!user ? "Log in to use the eligibility filter" : "Filter by your verified credentials"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    eligibleOnly ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all select-none ${
                    isSelected
                      ? "bg-[#2F6BFF] text-white shadow-md shadow-[#2F6BFF]/25"
                      : "bg-white/80 hover:bg-[#EEF4FF] text-slate-600 border border-slate-200/80 hover:border-[#2F6BFF]/30"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-500 hover:text-red-600 hover:bg-red-50 transition ml-auto flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </GlassCard>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-3xl bg-white/70 border border-white animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-3xl bg-red-50 border border-red-200 text-red-700 text-center font-medium">
            Failed to load resources. Please try again.
          </div>
        ) : resources.length === 0 ? (
          <GlassCard className="p-12 text-center max-w-lg mx-auto shadow-lg">
            <Compass className="h-10 w-10 text-[#2F6BFF] mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-[#0F1E4D] mb-1">No resources found</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              {eligibleOnly
                ? "You don't have verified credentials for the equipment matching your search. Try unchecking 'I'm Eligible' or uploading missing certificates."
                : "No campus equipment matches your current search criteria."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-5 py-2 rounded-full text-xs font-semibold bg-[#2F6BFF] text-white hover:bg-[#1E56DF] transition shadow-md shadow-[#2F6BFF]/25"
              >
                Clear all filters
              </button>
            )}
          </GlassCard>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource: any) => (
              <ResourceCard key={resource._id} resource={resource} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
