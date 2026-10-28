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
    <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-900/40 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-indigo-950 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
            <Scale className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Explain This Decision
            </h3>
            <span className="text-[10px] text-slate-400">
              Fair campus allocation & safety transparency
            </span>
          </div>
        </div>

        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700">
          Status: {status.replace("_", " ")}
        </span>
      </div>

      {/* Plain Language Summary */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-200 leading-relaxed">
        <strong className="text-white block mb-1">Decision Summary:</strong>
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
        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Weekly Quota</span>
          <strong className="text-white text-sm">{hoursUsed} / 8h</strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Penalty Strikes</span>
          <strong className={strikes > 0 ? "text-red-400 text-sm" : "text-emerald-400 text-sm"}>
            {strikes}
          </strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-950/50 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Priority Score</span>
          <strong className="text-indigo-400 text-sm">{score.toFixed(2)}</strong>
        </div>
      </div>

      {/* Formula Explainer Toggle */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => setShowFormulaDetails(!showFormulaDetails)}
          className="w-full py-2 px-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white text-[11px] font-medium transition flex items-center justify-between"
        >
          <span className="flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-indigo-400" />
            <span>View Scoring Formula & Weight Breakdown</span>
          </span>
          {showFormulaDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
        </button>

        {showFormulaDetails && (
          <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2 text-slate-300">
            <div className="font-mono text-[11px] text-indigo-300 bg-slate-900 p-2 rounded border border-slate-800">
              Score = w1 &times; [1 / (1 + HoursUsed)] + w2 &times; WaitHours - w3 &times; Strikes
            </div>

            <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400 pt-1">
              <div>
                Usage Weight (w1): <strong className="text-slate-200">{DEFAULT_SCORE_WEIGHTS.w1}</strong>
              </div>
              <div>
                Wait Weight (w2): <strong className="text-slate-200">{DEFAULT_SCORE_WEIGHTS.w2}</strong>
              </div>
              <div>
                Strike Penalty (w3): <strong className="text-slate-200">{DEFAULT_SCORE_WEIGHTS.w3}</strong>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 pt-1">
              Lower past usage and longer queue waiting increase priority. No-shows or late returns add strikes that decrease priority. Strikes decay automatically after 30 days.
            </p>
          </div>
        )}
      </div>

      {/* Credential Checks */}
      {eligibilitySnapshot?.checks && (
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
          <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center gap-1">
            <ShieldCheck className="h-3 w-3 text-indigo-400" />
            <span>Safety Prerequisites</span>
          </div>
          {eligibilitySnapshot.checks.map((chk, idx) => (
            <div
              key={idx}
              className="p-2 rounded-lg bg-slate-950/40 border border-slate-800 text-[11px] flex items-center justify-between"
            >
              <span className="text-slate-300">{chk.requirement}</span>
              <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-semibold">
                <Check className="h-3 w-3" />
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
