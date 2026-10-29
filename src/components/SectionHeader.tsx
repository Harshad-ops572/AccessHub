"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface SectionHeaderProps {
  title: string | React.ReactNode;
  subtitle?: string | React.ReactNode;
  icon?: React.ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  subtitle,
  icon,
  viewAllHref,
  viewAllLabel = "View all",
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="h-9 w-9 rounded-xl bg-[#EEF4FF] border border-[#2F6BFF]/20 text-[#2F6BFF] flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            {icon}
          </div>
        )}
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0F1E4D] tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="group inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#2F6BFF] hover:text-[#1E56DF] transition-colors self-start sm:self-auto shrink-0"
        >
          <span>{viewAllLabel}</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export default SectionHeader;

