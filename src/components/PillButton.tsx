"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface PillButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
  showArrow?: boolean;
  icon?: React.ReactNode;
}

export function PillButton({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  type = "button",
  disabled = false,
  className = "",
  showArrow = false,
  icon,
}: PillButtonProps) {
  const sizeStyles = {
    sm: "px-3.5 py-1.5 text-xs gap-1.5",
    md: "px-5 py-2.5 text-xs sm:text-sm gap-2",
    lg: "px-6 py-3.5 text-sm sm:text-base gap-2.5",
  }[size];

  const variantStyles = {
    primary:
      "bg-[#2F6BFF] hover:bg-[#1E56DF] text-white shadow-md shadow-[#2F6BFF]/25 hover:shadow-lg hover:shadow-[#2F6BFF]/35 active:bg-[#1948bd]",
    secondary:
      "bg-[#EEF4FF] hover:bg-[#E0ECFF] text-[#2F6BFF] border border-[#2F6BFF]/15 active:bg-[#D5E4FF]",
    outline:
      "bg-white/80 hover:bg-[#EEF4FF] text-[#2F6BFF] border border-[#2F6BFF]/30 active:bg-[#E0ECFF]",
    ghost:
      "bg-transparent hover:bg-slate-100 text-slate-600 hover:text-[#0F1E4D]",
  }[variant];

  const baseStyles = `inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0 ${sizeStyles} ${variantStyles} ${className}`;

  const content = (
    <>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {showArrow && <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`group ${baseStyles}`}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group ${baseStyles}`}
    >
      {content}
    </button>
  );
}

export default PillButton;

