"use client";

import React from "react";

interface StatusBadgeProps {
  status?: string;
  label?: string;
  className?: string;
}

export function StatusBadge({
  status = "available",
  label,
  className = "",
}: StatusBadgeProps) {
  const normalized = (status || "").toLowerCase().trim();

  // Green pill "Available" with dot and text (from the screenshot)
  if (normalized === "available" || normalized === "active") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#E6F9F0] text-[#059669] border border-[#A7F3D0]/70 shadow-sm ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0 animate-pulse" />
        <span>{label || (normalized === "active" ? "Available" : "Available")}</span>
      </span>
    );
  }

  if (normalized === "approved" || normalized === "verified") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EEF4FF] text-[#2F6BFF] border border-[#BFDBFE] shadow-sm ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#2F6BFF] shrink-0" />
        <span>{label || (normalized === "approved" ? "Approved" : "Verified")}</span>
      </span>
    );
  }

  if (normalized === "pending" || normalized === "pending_review" || normalized === "waitlisted") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] shadow-sm ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#F59E0B] shrink-0" />
        <span>{label || (normalized === "waitlisted" ? "Waitlisted" : "Pending Review")}</span>
      </span>
    );
  }

  if (normalized === "maintenance") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5] shadow-sm ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#F97316] shrink-0" />
        <span>{label || "Maintenance"}</span>
      </span>
    );
  }

  if (normalized === "checked_in" || normalized === "in_use") {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] shadow-sm ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
        <span>{label || "Checked In"}</span>
      </span>
    );
  }

  if (["overdue", "rejected", "cancelled", "disputed"].includes(normalized)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] shadow-sm ${className}`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#EF4444] shrink-0" />
        <span>{label || normalized.replace("_", " ")}</span>
      </span>
    );
  }

  // Default fallback
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-sm ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 shrink-0" />
      <span>{label || normalized.replace("_", " ")}</span>
    </span>
  );
}

export default StatusBadge;

