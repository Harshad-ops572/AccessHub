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
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500">
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
                : "text-slate-700"
            }`}
          />
        ))}
        <span className="ml-1 text-xs font-bold text-slate-200">{rating} / 5</span>
      </div>
    );
  };

  const delta = returnInspection && checkin
    ? returnInspection.conditionRating - checkin.conditionRating
    : 0;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-5">
      {/* Header with Delta Flag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-400" />
            <span>Condition Record Comparison (Before vs After)</span>
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Photographic & checklist comparison of equipment state at handover and return.
          </p>
        </div>

        {returnInspection && checkin && (
          <div>
            {delta < 0 ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60 flex items-center gap-1.5 shadow-sm">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                <span>Rating Drop: {delta} Stars (Damage Flagged)</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Pristine Return (No Degradation)</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Side-by-side Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Check-in Column */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              1. Handover Check-in
            </span>
            {checkin ? (
              renderStars(checkin.conditionRating)
            ) : (
              <span className="text-[10px] text-slate-500">Pending</span>
            )}
          </div>

          {checkin ? (
            <>
              {/* Photo */}
              <div className="h-44 w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative group">
                <img
                  src={
                    checkin.photos?.[0] ||
                    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"
                  }
                  alt="Check-in condition"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-slate-950/80 text-slate-300 backdrop-blur">
                  Check-in Photo
                </span>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                  Inspector Notes:
                </span>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {checkin.notes || "No special conditions noted upon handover."}
                </p>
              </div>

              {/* Checklist */}
              {checkin.checklist && checkin.checklist.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Safety Checklist:
                  </span>
                  {checkin.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] flex items-center justify-between text-slate-300 py-0.5"
                    >
                      <span>{item.item}</span>
                      {item.passed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                Verified by {checkin.recordedBy?.name || "Lab Staff"} on{" "}
                {new Date(checkin.createdAt).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              Check-in inspection has not occurred yet.
            </div>
          )}
        </div>

        {/* Return Column */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              2. Return Inspection
            </span>
            {returnInspection ? (
              renderStars(returnInspection.conditionRating)
            ) : (
              <span className="text-[10px] text-slate-500">Pending Return</span>
            )}
          </div>

          {returnInspection ? (
            <>
              {/* Photo */}
              <div className="h-44 w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-800 relative group">
                <img
                  src={
                    returnInspection.photos?.[0] ||
                    "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80"
                  }
                  alt="Return condition"
                  className="h-full w-full object-cover"
                />
                <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] bg-slate-950/80 text-slate-300 backdrop-blur">
                  Return Photo
                </span>
              </div>

              {/* Notes */}
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 block mb-0.5">
                  Inspector Notes:
                </span>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  {returnInspection.notes || "Standard return handover."}
                </p>
              </div>

              {/* Checklist */}
              {returnInspection.checklist && returnInspection.checklist.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Safety Checklist:
                  </span>
                  {returnInspection.checklist.map((item, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] flex items-center justify-between text-slate-300 py-0.5"
                    >
                      <span>{item.item}</span>
                      {item.passed ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-red-400" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800">
                Logged by {returnInspection.recordedBy?.name || "Lab Staff"} on{" "}
                {new Date(returnInspection.createdAt).toLocaleDateString()}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-xs text-slate-500">
              Return inspection will be recorded upon equipment return.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default ConditionComparison;
