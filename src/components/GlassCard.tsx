"use client";

import React from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export function GlassCard({
  children,
  className = "",
  hoverEffect = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`rounded-2xl sm:rounded-3xl bg-white/80 backdrop-blur-md border border-white/90 shadow-[0_8px_30px_rgb(47,107,255,0.06)] transition-all duration-300 ${
        hoverEffect
          ? "hover:border-[#2F6BFF]/35 hover:shadow-[0_16px_35px_rgb(47,107,255,0.12)] hover:-translate-y-1"
          : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default GlassCard;

