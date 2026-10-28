"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";
import { ResourceCard } from "@/components/ResourceCard";
import {
  Search,
  SlidersHorizontal,
  Compass,
  CheckCircle2,
  Sparkles,
  Layers,
  FlaskConical,
  Camera,
  DoorOpen,
  Cpu,
  Gauge,
  X,
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
    { id: "computer", label: "High-Performance Compute", icon: Cpu },
    { id: "testing", label: "Testing & Diagnostics", icon: Gauge },
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <Compass className="h-4 w-4" />
              <span>Campus Resource Directory</span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Discover Equipment & Spaces
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Browse departmental makerspace tools, cameras, electron microscopes, and collaboration rooms. Real-time credential matching verifies your eligibility instantly.
            </p>
          </div>

          {/* Quick stats / summary */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
              <strong className="text-white">{resources.length}</strong> resources available
            </span>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur shadow-xl mb-8 space-y-4">
          <div className="grid md:grid-cols-12 gap-3">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by tool name, model, safety credential, or specs..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>

            {/* "I'm Eligible" Toggle */}
            <div className="md:col-span-3 flex items-center justify-between sm:justify-end gap-3 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/60">
              <label htmlFor="eligibleToggle" className="text-xs font-medium text-slate-300 cursor-pointer select-none">
                &ldquo;I&apos;m Eligible&rdquo; Only
              </label>
              <button
                id="eligibleToggle"
                type="button"
                onClick={() => setEligibleOnly(!eligibleOnly)}
                disabled={!user}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-40 ${
                  eligibleOnly ? "bg-indigo-600" : "bg-slate-700"
                }`}
                title={!user ? "Log in to use the eligibility filter" : "Filter by your verified credentials"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    eligibleOnly ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = category === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                      : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60"
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
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition ml-auto flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Resources Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-red-950/30 border border-red-900 text-red-200 text-center">
            Failed to load resources. Please try again.
          </div>
        ) : resources.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800/80 max-w-lg mx-auto">
            <Compass className="h-10 w-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white mb-1">No resources found</h3>
            <p className="text-xs text-slate-400 mb-4">
              {eligibleOnly
                ? "You don't have verified credentials for the equipment matching your search. Try unchecking 'I'm Eligible' or uploading missing certificates."
                : "No campus equipment matches your search criteria."}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white transition"
              >
                Clear all filters
              </button>
            )}
          </div>
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
