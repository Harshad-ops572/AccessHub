"use client";

import React, { useState } from "react";
import {
  HelpCircle,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Scale,
  ChevronDown,
  ChevronUp,
  Check,
  Info,
} from "lucide-react";
import { DEFAULT_SCORE_WEIGHTS } from "@/lib/fairnessConstants";

interface ExplainDecisionPanelProps {
  status: string;
  decisionReason?: string;
  fairnessSnapshot?: {
    weeklyHoursBefore: number;
    activeBookingsCount: number;
    strikes: number;
    priorityScore?: number;
  };
  eligibilitySnapshot?: {
    eligible: boolean;
    checks: Array<{ requirement: string; met: boolean; reason: string }>;
  };
  waitlistData?: {
    priorityScore: number;
    position: number;
    totalInQueue: number;
    scoreBreakdown?: {
      recentUsage: number;
      strikes: number;
      waitTime: number;
    };
  };
}

export function ExplainDecisionPanel({
  status,
  decisionReason,
  fairnessSnapshot,
  eligibilitySnapshot,
  waitlistData,
}: ExplainDecisionPanelProps) {
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  const hoursUsed = waitlistData?.scoreBreakdown?.recentUsage ?? fairnessSnapshot?.weeklyHoursBefore ?? 0;
  const strikes = waitlistData?.scoreBreakdown?.strikes ?? fairnessSnapshot?.strikes ?? 0;
  const waitHours = waitlistData?.scoreBreakdown?.waitTime ?? 1.0;
  const score = waitlistData?.priorityScore ?? fairnessSnapshot?.priorityScore ?? 0.5;

  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center text-[#2F6BFF] shadow-xs">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F1E4D]">
              Explain This Decision
            </h3>
            <span className="text-[10px] text-slate-500">
              Fair campus allocation & safety transparency
            </span>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-blue-50 text-[#2F6BFF] border border-blue-200/60">
          Status: {status.replace("_", " ")}
        </span>
      </div>

      {/* Plain Language Summary */}
      <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/80 text-xs text-slate-700 leading-relaxed">
        <strong className="text-[#0F1E4D] block mb-1">Decision Summary:</strong>
        {decisionReason ||
          (status === "approved"
            ? "Approved: All safety prerequisites verified and user usage is within the 8-hour weekly quota limit."
            : status === "waitlisted"
            ? `Waitlisted: Slot is congested. Ranked at queue position ${waitlistData?.position || 1} of ${
                waitlistData?.totalInQueue || 1
              } (Priority score: ${score.toFixed(2)}).`
            : "Request received and validated under AccessHub fair allocation policy.")}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-2.5 text-center text-xs">
        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] text-slate-500 block mb-0.5">Weekly Quota</span>
          <strong className="text-[#0F1E4D] text-sm">{hoursUsed} / 8h</strong>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] text-slate-500 block mb-0.5">Penalty Strikes</span>
          <strong className={strikes > 0 ? "text-red-500 text-sm" : "text-emerald-600 text-sm"}>
            {strikes}
          </strong>
        </div>

        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
          <span className="text-[10px] text-slate-500 block mb-0.5">Priority Score</span>
          <strong className="text-[#2F6BFF] text-sm">{score.toFixed(2)}</strong>
        </div>
      </div>

      {/* Formula Explainer Toggle */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="w-full py-2.5 px-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-semibold transition flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-[#2F6BFF]" />
            <span>View Scoring Formula & Weight Breakdown</span>
          </span>
          {showFormulaDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showFormulaDetails && (
          <div className="mt-2.5 p-4 rounded-2xl bg-white border border-slate-200 text-xs space-y-2 text-slate-600 shadow-sm">
            <div className="font-mono text-[11px] text-[#2F6BFF] bg-blue-50/70 p-2.5 rounded-xl border border-blue-100 font-semibold">
              Score = w1 &times; [1 / (1 + HoursUsed)] + w2 &times; WaitHours - w3 &times; Strikes
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-500 pt-1">
              <div>
                Usage Weight (w1): <strong className="text-slate-800">{DEFAULT_SCORE_WEIGHTS.w1}</strong>
              </div>
              <div>
                Wait Weight (w2): <strong className="text-slate-800">{DEFAULT_SCORE_WEIGHTS.w2}</strong>
              </div>
              <div>
                Strike Penalty (w3): <strong className="text-slate-800">{DEFAULT_SCORE_WEIGHTS.w3}</strong>
              </div>
            </div>

            <p className="text-[10px] text-slate-500 pt-1 leading-relaxed">
              Lower past usage and longer queue waiting increase priority. No-shows or late returns add strikes that decrease priority. Strikes decay automatically after 30 days.
            </p>
          </div>
        )}
      </div>

      {/* Credential Checks */}
      {eligibilitySnapshot?.checks && (
        <div className="pt-2 border-t border-slate-100 space-y-2">
          <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-[#2F6BFF]" />
            <span>Safety Prerequisites</span>
          </div>
          {eligibilitySnapshot.checks.map((chk, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-[11px] flex items-center justify-between"
            >
              <span className="text-slate-700 font-medium">{chk.requirement}</span>
              <span className="text-emerald-600 flex items-center gap-1 text-[10px] font-bold">
                <Check className="h-3.5 w-3.5" />
                Verified
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
export default ExplainDecisionPanel;
