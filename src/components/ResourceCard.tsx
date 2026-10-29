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
} from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatusBadge } from "./StatusBadge";
import { PillButton } from "./PillButton";

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

  const [imgError, setImgError] = React.useState(false);
  const hasPhoto = resource.photos && resource.photos.length > 0 && !imgError;

  return (
    <GlassCard
      className="overflow-hidden flex flex-col justify-between group hover:[transform:perspective(1000px)_rotateX(2deg)_rotateY(-1deg)] motion-reduce:hover:transform-none transition-all duration-300"
      hoverEffect
    >
      <div>
        {/* Photo & Category Banner */}
        <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
          {hasPhoto ? (
            <img
              src={resource.photos[0]}
              alt={resource.title}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-blue-100 via-indigo-50 to-sky-100 flex items-center justify-center text-[#2F6BFF]">
              {getCategoryIcon(resource.category)}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-[#0F1E4D] backdrop-blur border border-white flex items-center gap-1.5 capitalize shadow-sm">
              <span className="text-[#2F6BFF]">{getCategoryIcon(resource.category)}</span>
              {resource.category}
            </span>
            {resource.requiresApproval && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#EEF4FF]/95 text-[#2F6BFF] backdrop-blur border border-[#2F6BFF]/20 shadow-sm">
                Approval Required
              </span>
            )}
          </div>

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <StatusBadge status={resource.status} />
          </div>

          {/* Bottom Photo Info: Location */}
          <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-white">
            <div className="flex items-center gap-1.5 truncate font-medium bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <MapPin className="h-3.5 w-3.5 text-sky-300 shrink-0" />
              <span className="truncate">{resource.location}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-white shrink-0 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-sm font-medium">
              <Clock className="h-3 w-3 text-sky-300" />
              <span>Max {resource.maxDurationHours}h</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <h3 className="text-base font-bold text-[#0F1E4D] group-hover:text-[#2F6BFF] transition-colors line-clamp-1 mb-1.5">
            {resource.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
            {resource.description}
          </p>

          {/* Owner Info */}
          {resource.ownerId && (
            <div className="text-[11px] text-slate-500 mb-3 flex items-center gap-1.5">
              <span className="text-slate-400">Department:</span>
              <span className="text-[#0F1E4D] font-medium truncate">
                {resource.ownerId.department || resource.ownerId.name}
              </span>
            </div>
          )}

          {/* Required Credentials */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-[#2F6BFF]" />
              Safety Requirements
            </div>
            {resource.requiredCredentials && resource.requiredCredentials.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {resource.requiredCredentials.map((cred) => (
                  <span
                    key={cred}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#EEF4FF] text-[#2F6BFF] border border-[#2F6BFF]/15"
                  >
                    {cred}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-[#059669] font-medium flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Open to all verified campus members
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Card Footer: Eligibility Indicator & Link */}
      <div className="p-4 sm:p-5 pt-0">
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Eligibility Tag */}
          {resource.userEligibility ? (
            resource.userEligibility.isEligible ? (
              <div className="flex items-center gap-1 text-[11px] text-[#059669] font-semibold bg-[#E6F9F0] px-2.5 py-1 rounded-full border border-[#A7F3D0]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Eligible</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-[#D97706] font-semibold bg-[#FFFBEB] px-2.5 py-1 rounded-full border border-[#FDE68A]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Missing Cert</span>
              </div>
            )
          ) : (
            <div className="text-[11px] text-slate-400 font-medium">Log in to check</div>
          )}

          <PillButton
            href={`/resources/${resource._id}`}
            variant="secondary"
            size="sm"
            showArrow
          >
            View Details
          </PillButton>
        </div>
      </div>
    </GlassCard>
  );
}

export default ResourceCard;
