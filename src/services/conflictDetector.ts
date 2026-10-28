import { Types, ClientSession } from "mongoose";
import { Booking, IBooking, BookingStatus } from "@/models/Booking";
import { IResource } from "@/models/Resource";
import { User } from "@/models/User";

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictingBooking?: {
    start: Date;
    end: Date;
    status: string;
  };
  suggestedSlots: Array<{
    start: Date;
    end: Date;
    label: string;
  }>;
}

/**
 * Checks if a requested slot conflicts with existing confirmed bookings,
 * and if so, computes alternative free slots within operational hours.
 */
export async function detectSlotConflict(
  resourceId: string | Types.ObjectId,
  start: Date,
  end: Date,
  resource: IResource,
  session?: ClientSession
): Promise<ConflictCheckResult> {
  const activeStatuses: BookingStatus[] = ["approved", "checked_in"];

  const query = {
    resourceId: new Types.ObjectId(resourceId.toString()),
    status: { $in: activeStatuses },
    start: { $lt: end },
    end: { $gt: start },
  };

  const conflict = session
    ? ((await Booking.findOne(query).session(session).lean()) as (IBooking & { _id: Types.ObjectId }) | null)
    : ((await Booking.findOne(query).lean()) as (IBooking & { _id: Types.ObjectId }) | null);

  if (!conflict) {
    return {
      hasConflict: false,
      suggestedSlots: [],
    };
  }

  // Generate 2 nearby alternative free slots
  const durationMs = end.getTime() - start.getTime();
  const suggestions: Array<{ start: Date; end: Date; label: string }> = [];

  // 1. Suggest immediately following the conflicting booking
  const afterConflictStart = new Date(conflict.end);
  const afterConflictEnd = new Date(afterConflictStart.getTime() + durationMs);

  const secondConflict = await Booking.findOne({
    resourceId: new Types.ObjectId(resourceId.toString()),
    status: { $in: activeStatuses },
    start: { $lt: afterConflictEnd },
    end: { $gt: afterConflictStart },
  }).lean();

  if (!secondConflict) {
    suggestions.push({
      start: afterConflictStart,
      end: afterConflictEnd,
      label: `Same day after current reservation (${afterConflictStart.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${afterConflictEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`,
    });
  }

  // 2. Suggest next day same time
  const nextDayStart = new Date(start);
  nextDayStart.setDate(nextDayStart.getDate() + 1);
  const nextDayEnd = new Date(nextDayStart.getTime() + durationMs);

  const nextDayConflict = await Booking.findOne({
    resourceId: new Types.ObjectId(resourceId.toString()),
    status: { $in: activeStatuses },
    start: { $lt: nextDayEnd },
    end: { $gt: nextDayStart },
  }).lean();

  if (!nextDayConflict) {
    suggestions.push({
      start: nextDayStart,
      end: nextDayEnd,
      label: `Tomorrow at ${nextDayStart.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })} - ${nextDayEnd.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
    });
  }

  return {
    hasConflict: true,
    conflictingBooking: {
      start: conflict.start,
      end: conflict.end,
      status: conflict.status,
    },
    suggestedSlots: suggestions,
  };
}

export interface QuotaCheckResult {
  allowed: boolean;
  reason?: string;
  weeklyHoursBefore: number;
  hoursRequested: number;
  activeBookingsCount: number;
}

/**
 * Evaluates fair allocation constraints:
 * 1. Weekly quota limit (default 8 hours)
 * 2. Active bookings cap (max 2 active)
 */
export async function evaluateUserQuota(
  userId: string | Types.ObjectId,
  requestedHours: number
): Promise<QuotaCheckResult> {
  const user = await User.findById(userId).lean();
  if (!user) {
    throw new Error("User not found");
  }

  const weeklyHoursBefore = user.weeklyHoursUsed || 0;
  const maxWeeklyHours = 8;

  // Active bookings count (requested, pending_review, approved, checked_in)
  const activeStatuses: BookingStatus[] = ["requested", "pending_review", "approved", "checked_in"];
  const activeBookingsCount = await Booking.countDocuments({
    userId: new Types.ObjectId(userId.toString()),
    status: { $in: activeStatuses },
  });

  if (activeBookingsCount >= 2) {
    return {
      allowed: false,
      reason: `Fairness limit reached: you currently have ${activeBookingsCount} active bookings (maximum 2 permitted simultaneously). Please complete or cancel an existing booking before requesting another.`,
      weeklyHoursBefore,
      hoursRequested: requestedHours,
      activeBookingsCount,
    };
  }

  if (weeklyHoursBefore + requestedHours > maxWeeklyHours) {
    return {
      allowed: false,
      reason: `Weekly quota limit reached: requesting ${requestedHours}h would bring your weekly usage to ${
        weeklyHoursBefore + requestedHours
      }h of the ${maxWeeklyHours}h maximum allowance.`,
      weeklyHoursBefore,
      hoursRequested: requestedHours,
      activeBookingsCount,
    };
  }

  return {
    allowed: true,
    weeklyHoursBefore,
    hoursRequested: requestedHours,
    activeBookingsCount,
  };
}
