"use client";

import React from "react";
import { Star, ShieldCheck, AlertTriangle, ArrowRight, Check, X, Camera } from "lucide-react";

interface InspectionRecord {
  _id: string;
  type: "checkin" | "return";
  conditionRating: number;
  checklist: Array<{ item: string; passed: boolean }>;
  notes: string;
  photos: string[];
  createdAt: string | Date;
  recordedBy?: {
    name: string;
    role: string;
  };
}

interface ConditionComparisonProps {
  checkin?: InspectionRecord;
  returnInspection?: InspectionRecord;
}

export function ConditionComparison({
  checkin,
  returnInspection,
}: ConditionComparisonProps) {
  if (!checkin && !returnInspection) {
    return (
      <div className="p-6 rounded-3xl bg-white/80 border border-slate-200/80 text-center text-xs text-slate-500 shadow-xs">
        No condition inspection records logged yet.
      </div>
    );
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= rating
                ? "text-amber-400 fill-amber-400"
                : "text-slate-200"
            }`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-[#0F1E4D]">{rating} / 5</span>
      </div>
    );
  };

  const delta = returnInspection && checkin
    ? returnInspection.conditionRating - checkin.conditionRating
    : 0;

  return (
    <div className="p-6 rounded-3xl bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
      {/* Header with Delta Flag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-bold text-[#0F1E4D] uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#2F6BFF]" />
            <span>Condition Record Comparison (Before vs After)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Photographic & checklist comparison of equipment state at handover and return.
          </p>
        </div>

        {returnInspection && checkin && (
          <div>
            {delta < 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1.5 shadow-xs">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span>Rating Drop: {delta} Stars (Damage Flagged)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                <span>Pristine Return (No Degradation)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Side-by-side Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Check-in Column */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              1. Handover Check-in
            </span>
            {checkin ? (
              renderStars(checkin.conditionRating)
            ) : (
              <span className="text-[10px] text-slate-400">Pending</span>
            )}
          </div>

          {checkin ? (
            <>
              {/* Photo */}
              <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                <img
                  src={
                    checkin.photos?.[0] ||
                    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"
                  }
                  alt="Check-in condition"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/90 text-slate-700 backdrop-blur shadow-xs">
                  Check-in Photo
                </span>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Inspector Notes:
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70">
                  {checkin.notes || "No special conditions noted upon handover."}
                </p>
              </div>

              {/* Checklist */}
              {checkin.checklist && checkin.checklist.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Safety Checklist:
                  </span>
                  {checkin.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] flex items-center justify-between text-slate-700 py-1 px-2.5 rounded-lg bg-white border border-slate-200/60"
                    >
                      <span className="font-medium">{item.item}</span>
                      {item.passed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                Verified by {checkin.recordedBy?.name || "Lab Staff"} on{" "}
                {new Date(checkin.createdAt).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Check-in inspection has not occurred yet.
            </div>
          )}
        </div>

        {/* Return Column */}
        <div className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200/70 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-[#2F6BFF]">
              2. Return Inspection
            </span>
            {returnInspection ? (
              renderStars(returnInspection.conditionRating)
            ) : (
              <span className="text-[10px] text-slate-400">Pending Return</span>
            )}
          </div>

          {returnInspection ? (
            <>
              {/* Photo */}
              <div className="h-44 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative group">
                <img
                  src={
                    returnInspection.photos?.[0] ||
                    "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80"
                  }
                  alt="Return condition"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/90 text-slate-700 backdrop-blur shadow-xs">
                  Return Photo
                </span>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Inspector Notes:
                </span>
                <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200/70">
                  {returnInspection.notes || "Standard return handover."}
                </p>
              </div>

              {/* Checklist */}
              {returnInspection.checklist && returnInspection.checklist.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Safety Checklist:
                  </span>
                  {returnInspection.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] flex items-center justify-between text-slate-700 py-1 px-2.5 rounded-lg bg-white border border-slate-200/60"
                    >
                      <span className="font-medium">{item.item}</span>
                      {item.passed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-500" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-200/60">
                Logged by {returnInspection.recordedBy?.name || "Lab Staff"} on{" "}
                {new Date(returnInspection.createdAt).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-400">
              Return inspection will be recorded upon equipment return.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ConditionComparison;
