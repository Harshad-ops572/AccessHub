"use client";

import React from "react";
import Link from "next/link";
import {
  MapPin,
  Clock,
  ShieldCheck,
  AlertCircle,
  Cpu,
  Camera,
  Layers,
  FlaskConical,
  DoorOpen,
  Gauge,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface ResourceCardProps {
  resource: {
    _id: string;
    title: string;
    category: string;
    description: string;
    location: string;
    photos: string[];
    maxDurationHours: number;
    requiredCredentials: string[];
    requiresApproval: boolean;
    status: string;
    ownerId?: {
      name: string;
      department: string;
    };
    userEligibility?: {
      isEligible: boolean;
      missingCredsCount: number;
      missingCreds: string[];
    };
  };
}

export function ResourceCard({ resource }: ResourceCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "makerspace":
        return <Layers className="h-4 w-4" />;
      case "lab":
        return <FlaskConical className="h-4 w-4" />;
      case "camera":
        return <Camera className="h-4 w-4" />;
      case "computer":
        return <Cpu className="h-4 w-4" />;
      case "testing":
        return <Gauge className="h-4 w-4" />;
      case "room":
        return <DoorOpen className="h-4 w-4" />;
      default:
        return <Cpu className="h-4 w-4" />;
    }
  };

  const photo = resource.photos?.[0] || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80";

  return (
    <div className="group rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1">
      <div>
        {/* Photo & Category Banner */}
        <div className="relative h-48 w-full bg-slate-800 overflow-hidden">
          <img
            src={photo}
            alt={resource.title}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-950/80 text-white backdrop-blur border border-slate-700/60 flex items-center gap-1.5 capitalize shadow-sm">
              {getCategoryIcon(resource.category)}
              {resource.category}
            </span>
            {resource.requiresApproval && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-950/90 text-indigo-300 backdrop-blur border border-indigo-700/60 shadow-sm">
                Approval Required
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm ${
                resource.status === "active"
                  ? "bg-emerald-950/85 text-emerald-300 border border-emerald-700/60"
                  : "bg-amber-950/85 text-amber-300 border border-amber-700/60"
              }`}
            >
              {resource.status}
            </span>
          </div>

          {/* Bottom Photo Info: Location */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-1.5 truncate font-medium bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur">
              <MapPin className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{resource.location}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-300 shrink-0 bg-slate-950/60 px-2 py-0.5 rounded backdrop-blur font-medium">
              <Clock className="h-3 w-3 text-slate-400" />
              <span>Max {resource.maxDurationHours}h</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base font-semibold text-white group-hover:text-indigo-300 transition line-clamp-1 mb-1.5">
            {resource.title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-2 mb-3 leading-relaxed">
            {resource.description}
          </p>

          {/* Owner Info */}
          {resource.ownerId && (
            <div className="text-[11px] text-slate-400 mb-3 flex items-center gap-1.5">
              <span className="text-slate-500">Managed by:</span>
              <span className="text-slate-300 font-medium truncate">
                {resource.ownerId.department || resource.ownerId.name}
              </span>
            </div>
          )}

          {/* Required Credentials */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-indigo-400" />
              Safety Requirements
            </div>
            {resource.requiredCredentials && resource.requiredCredentials.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {resource.requiredCredentials.map((cred) => (
                  <span
                    key={cred}
                    className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                  >
                    {cred}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Open to all verified campus members
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Eligibility Indicator & Link */}
      <div className="p-4 pt-0">
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
          {/* Eligibility Tag */}
          {resource.userEligibility ? (
            resource.userEligibility.isEligible ? (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60 shadow-sm">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>You&apos;re Eligible</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] text-amber-300 font-semibold bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/60 shadow-sm">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                <span>Missing Cert</span>
              </div>
            )
          ) : (
            <div className="text-[11px] text-slate-500 font-medium">Sign in to check eligibility</div>
          )}

          <Link
            href={`/resources/${resource._id}`}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white transition-all shadow-md shadow-indigo-600/25 hover:shadow-indigo-600/40"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
export default ResourceCard;
