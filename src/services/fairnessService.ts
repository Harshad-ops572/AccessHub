import { Types } from "mongoose";
import { User, IUser } from "@/models/User";
import { Booking } from "@/models/Booking";
import { Waitlist, IWaitlist } from "@/models/Waitlist";

export {
  type ScoreWeights,
  type PriorityScoreResult,
  DEFAULT_SCORE_WEIGHTS,
  calculateWaitlistPriorityScore,
} from "@/lib/fairnessConstants";

/**
 * Computes queue position for a user on a given resource slot.
 */
export async function getWaitlistQueuePosition(
  resourceId: string | Types.ObjectId,
  waitlistId: string | Types.ObjectId
): Promise<{ position: number; totalInQueue: number }> {
  const activeEntries = await Waitlist.find({
    resourceId: new Types.ObjectId(resourceId.toString()),
    status: "active",
  })
    .sort({ priorityScore: -1, createdAt: 1 })
    .lean();

  const totalInQueue = activeEntries.length;
  const index = activeEntries.findIndex(
    (e) => e._id.toString() === waitlistId.toString()
  );

  return {
    position: index !== -1 ? index + 1 : 1,
    totalInQueue: Math.max(1, totalInQueue),
  };
}

/**
 * Generates a plain-language explanation of a booking or waitlist decision.
 */
export function generateDecisionExplanation(booking: {
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
}): string {
  if (booking.decisionReason) {
    return booking.decisionReason;
  }

  const { status, fairnessSnapshot, eligibilitySnapshot } = booking;

  if (status === "approved") {
    return `Approved: All prerequisite safety credentials verified and within weekly quota (${
      fairnessSnapshot?.weeklyHoursBefore || 0
    }/8h used).`;
  }

  if (status === "waitlisted") {
    return `Waitlisted: Slot currently congested. Your queue priority score is ${
      fairnessSnapshot?.priorityScore?.toFixed(2) || "0.50"
    } based on recent departmental usage (${fairnessSnapshot?.weeklyHoursBefore || 0}h used, ${
      fairnessSnapshot?.strikes || 0
    } penalty strikes).`;
  }

  if (status === "rejected") {
    if (eligibilitySnapshot && !eligibilitySnapshot.eligible) {
      const missing = eligibilitySnapshot.checks
        .filter((c) => !c.met)
        .map((c) => c.requirement)
        .join(", ");
      return `Rejected: Missing required verified safety certifications (${missing}).`;
    }
    return `Rejected by department head during review queue inspection.`;
  }

  if (status === "pending_review") {
    return `Pending Owner Review: Submitted to department queue. Awaiting lab owner confirmation.`;
  }

  return `Status updated to ${status}.`;
}
