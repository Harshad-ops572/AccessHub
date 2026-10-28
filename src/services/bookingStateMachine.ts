import { BookingStatus, IBooking } from "@/models/Booking";
import { UserRole } from "@/models/User";
import { writeAudit } from "@/lib/audit";
import { Notification } from "@/models/Notification";
import { Types, ClientSession } from "mongoose";

export interface TransitionRule {
  from: BookingStatus[];
  to: BookingStatus;
  allowedRoles: (UserRole | "system")[];
  requiresReason?: boolean;
}

// Complete Booking State Machine transitions as defined in spec
export const STATE_TRANSITIONS: TransitionRule[] = [
  // requested -> eligibility_check
  {
    from: ["requested"],
    to: "eligibility_check",
    allowedRoles: ["system", "user"],
  },
  // eligibility_check -> pending_review
  {
    from: ["eligibility_check"],
    to: "pending_review",
    allowedRoles: ["system"],
  },
  // eligibility_check -> rejected
  {
    from: ["eligibility_check"],
    to: "rejected",
    allowedRoles: ["system"],
    requiresReason: true,
  },
  // pending_review -> approved
  {
    from: ["pending_review"],
    to: "approved",
    allowedRoles: ["owner", "admin", "system"],
  },
  // pending_review -> rejected
  {
    from: ["pending_review"],
    to: "rejected",
    allowedRoles: ["owner", "admin"],
    requiresReason: true,
  },
  // pending_review -> waitlisted
  {
    from: ["pending_review"],
    to: "waitlisted",
    allowedRoles: ["owner", "admin", "system"],
    requiresReason: true,
  },
  // waitlisted -> approved (Auto-promotion on slot freed)
  {
    from: ["waitlisted"],
    to: "approved",
    allowedRoles: ["system", "owner", "admin"],
  },
  // approved -> checked_in
  {
    from: ["approved"],
    to: "checked_in",
    allowedRoles: ["manager", "owner", "admin"],
  },
  // checked_in -> returned
  {
    from: ["checked_in"],
    to: "returned",
    allowedRoles: ["manager", "owner", "admin"],
  },
  // returned -> closed
  {
    from: ["returned"],
    to: "closed",
    allowedRoles: ["system", "owner", "admin"],
  },
  // returned -> disputed (incident logged)
  {
    from: ["returned"],
    to: "disputed",
    allowedRoles: ["owner", "user", "admin"],
    requiresReason: true,
  },
  // checked_in -> overdue (cron detection)
  {
    from: ["checked_in"],
    to: "overdue",
    allowedRoles: ["system"],
  },
  // Pre-checkin -> cancelled
  {
    from: ["requested", "eligibility_check", "pending_review", "approved", "waitlisted"],
    to: "cancelled",
    allowedRoles: ["user", "owner", "admin"],
    requiresReason: true,
  },
];

/**
 * Validates whether a state machine transition is permitted.
 */
export function canTransition(
  currentStatus: BookingStatus,
  targetStatus: BookingStatus,
  actorRole: UserRole | "system"
): { allowed: boolean; error?: string } {
  // If no change, return allowed
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const matchingRule = STATE_TRANSITIONS.find(
    (rule) =>
      rule.to === targetStatus &&
      rule.from.includes(currentStatus) &&
      (actorRole === "admin" || rule.allowedRoles.includes(actorRole))
  );

  if (!matchingRule) {
    return {
      allowed: false,
      error: `Invalid transition: cannot move booking from "${currentStatus}" to "${targetStatus}" as role "${actorRole}".`,
    };
  }

  return { allowed: true };
}

export interface TransitionBookingParams {
  booking: IBooking;
  targetStatus: BookingStatus;
  actorId?: string;
  actorRole: UserRole | "system";
  reason?: string;
  session?: ClientSession;
}

/**
 * Centrally executes a booking state transition, updates the document,
 * creates an immutable audit record, and dispatches in-app notifications.
 */
export async function executeBookingTransition({
  booking,
  targetStatus,
  actorId,
  actorRole,
  reason,
  session,
}: TransitionBookingParams) {
  const check = canTransition(booking.status, targetStatus, actorRole);
  if (!check.allowed) {
    throw new Error(check.error);
  }

  // Check mandatory reason requirement
  const rule = STATE_TRANSITIONS.find((r) => r.to === targetStatus && r.from.includes(booking.status));
  if (rule?.requiresReason && (!reason || reason.trim().length === 0)) {
    throw new Error(`A mandatory reason is required to transition to status "${targetStatus}".`);
  }

  const beforeStatus = booking.status;
  booking.status = targetStatus;
  if (reason) {
    booking.decisionReason = reason;
  }

  if (session) {
    await booking.save({ session });
  } else {
    await booking.save();
  }

  // 1. Immutable Audit Log
  await writeAudit({
    actorId,
    actorRole,
    action: `BOOKING_${targetStatus.toUpperCase()}`,
    entityType: "Booking",
    entityId: booking._id.toString(),
    before: { status: beforeStatus },
    after: { status: targetStatus, reason },
    reason: reason || `Transitioned from ${beforeStatus} to ${targetStatus}`,
  });

  // 2. Dispatch in-app notification to the booking owner
  try {
    let notifMessage = "";
    switch (targetStatus) {
      case "approved":
        notifMessage = `Your reservation has been APPROVED. Reason: ${reason || "Verified"}`;
        break;
      case "rejected":
        notifMessage = `Your reservation request was REJECTED. Reason: ${reason}`;
        break;
      case "waitlisted":
        notifMessage = `Your reservation has been WAITLISTED. Reason: ${reason}`;
        break;
      case "checked_in":
        notifMessage = `You have been checked in. Please inspect equipment before use.`;
        break;
      case "returned":
        notifMessage = `Your return condition report has been logged.`;
        break;
      case "cancelled":
        notifMessage = `Reservation was cancelled. Reason: ${reason}`;
        break;
      case "overdue":
        notifMessage = `ATTENTION: Equipment is overdue. Please return immediately to avoid penalties.`;
        break;
      default:
        notifMessage = `Reservation status updated to ${targetStatus}.`;
    }

    await Notification.create({
      userId: booking.userId,
      type: `booking_${targetStatus}`,
      message: notifMessage,
      link: `/bookings/${booking._id}`,
      read: false,
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
  }

  return booking;
}
