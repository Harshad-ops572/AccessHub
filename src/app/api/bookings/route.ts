import { NextRequest, NextResponse } from "next/server";
import mongoose, { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Resource } from "@/models/Resource";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { getCurrentUser } from "@/lib/rbac";
import { CreateBookingSchema } from "@/validators/booking.schema";
import { evaluateUserEligibility } from "@/services/eligibilityEngine";
import { detectSlotConflict, evaluateUserQuota } from "@/services/conflictDetector";
import { executeBookingTransition } from "@/services/bookingStateMachine";
import { writeAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const pendingOnly = searchParams.get("pendingOnly") === "true";
    const statusFilter = searchParams.get("status");

    let query: any = {};

    if (user.role === "user") {
      query.userId = new Types.ObjectId(user.id);
    } else if (user.role === "owner") {
      // Find resources owned by this owner
      const ownedResources = await Resource.find({
        ownerId: new Types.ObjectId(user.id),
      }).select("_id");
      const resourceIds = ownedResources.map((r) => r._id);

      query.resourceId = { $in: resourceIds };
      if (pendingOnly) {
        query.status = "pending_review";
      }
    }
    // manager and admin can see all bookings

    if (statusFilter && !pendingOnly) {
      query.status = statusFilter;
    }

    const bookings = await Booking.find(query)
      .populate("resourceId", "title category location maxDurationHours photos rules ownerId")
      .populate("userId", "name email department strikes weeklyHoursUsed")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ bookings, count: bookings.length });
  } catch (error: any) {
    console.error("GET /api/bookings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const validated = CreateBookingSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { resourceId, start, end, purpose } = validated.data;
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: "Start time must be before end time" },
        { status: 400 }
      );
    }

    const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);

    const mongooseInstance = await connectToDatabase();
    const resource = await Resource.findById(resourceId);

    if (!resource || resource.status !== "active") {
      return NextResponse.json(
        { error: "Resource is not available for reservation" },
        { status: 404 }
      );
    }

    if (durationHours > resource.maxDurationHours) {
      return NextResponse.json(
        {
          error: `Requested duration (${durationHours}h) exceeds the maximum allowed limit of ${resource.maxDurationHours}h for this equipment.`,
        },
        { status: 400 }
      );
    }

    // 1. Eligibility Check
    const eligibilityResult = await evaluateUserEligibility(user.id, resource);
    if (!eligibilityResult.eligible) {
      const missingDescriptions = eligibilityResult.checks
        .filter((c) => !c.met)
        .map((c) => c.reason)
        .join(" ");

      return NextResponse.json(
        {
          error: "Eligibility check failed",
          reason: missingDescriptions,
          checks: eligibilityResult.checks,
        },
        { status: 403 }
      );
    }

    // 2. Fair Allocation Quota Check
    const quotaResult = await evaluateUserQuota(user.id, durationHours);
    if (!quotaResult.allowed) {
      return NextResponse.json(
        {
          error: "Fairness policy limit reached",
          reason: quotaResult.reason,
          quota: quotaResult,
        },
        { status: 403 }
      );
    }

    // 3. Conflict Detection inside MongoDB Session Transaction
    const session = await mongooseInstance.startSession();
    let newBooking: any;

    try {
      await session.withTransaction(async () => {
        const conflictCheck = await detectSlotConflict(
          resourceId,
          startDate,
          endDate,
          resource,
          session
        );

        if (conflictCheck.hasConflict) {
          throw new ConflictError(
            "The requested time slot has already been reserved by another verified campus member.",
            conflictCheck.conflictingBooking,
            conflictCheck.suggestedSlots
          );
        }

        const initialStatus = resource.requiresApproval ? "pending_review" : "approved";

        const created = await Booking.create(
          [
            {
              userId: new Types.ObjectId(user.id),
              resourceId: new Types.ObjectId(resourceId),
              start: startDate,
              end: endDate,
              purpose,
              status: initialStatus,
              eligibilitySnapshot: {
                eligible: true,
                evaluatedAt: new Date(),
                checks: eligibilityResult.checks,
              },
              fairnessSnapshot: {
                weeklyHoursBefore: quotaResult.weeklyHoursBefore,
                activeBookingsCount: quotaResult.activeBookingsCount,
                strikes: user.strikes || 0,
              },
              decisionReason: resource.requiresApproval
                ? "Submitted to department queue for owner review"
                : "Automatically approved (Standard reservation without approval requirement)",
            },
          ],
          { session }
        );

        newBooking = created[0];

        // If auto-approved, update user weekly hours
        if (initialStatus === "approved") {
          await User.findByIdAndUpdate(
            user.id,
            { $inc: { weeklyHoursUsed: durationHours } },
            { session }
          );
        }

        // Write append-only audit entry
        await writeAudit({
          actorId: user.id,
          actorRole: user.role,
          action: initialStatus === "approved" ? "BOOKING_AUTO_APPROVED" : "BOOKING_REQUESTED",
          entityType: "Booking",
          entityId: newBooking._id.toString(),
          after: {
            resourceId,
            start: startDate,
            end: endDate,
            status: initialStatus,
            purpose,
          },
          reason: resource.requiresApproval
            ? "User submitted booking request to review queue"
            : "User reserved auto-approved resource",
        });

        // Notify resource owner
        if (resource.requiresApproval) {
          await Notification.create(
            [
              {
                userId: resource.ownerId,
                type: "booking_request",
                message: `New booking request from ${user.name} for "${resource.title}".`,
                link: `/owner/queue`,
                read: false,
              },
            ],
            { session }
          );
        }
      });
    } catch (transactionError: any) {
      if (transactionError instanceof ConflictError) {
        return NextResponse.json(
          {
            error: transactionError.message,
            conflict: transactionError.conflictingBooking,
            suggestedSlots: transactionError.suggestedSlots,
          },
          { status: 409 }
        );
      }
      throw transactionError;
    } finally {
      await session.endSession();
    }

    return NextResponse.json({ booking: newBooking }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create booking" },
      { status: 500 }
    );
  }
}

class ConflictError extends Error {
  conflictingBooking?: any;
  suggestedSlots: any[];

  constructor(message: string, conflictingBooking: any, suggestedSlots: any[]) {
    super(message);
    this.name = "ConflictError";
    this.conflictingBooking = conflictingBooking;
    this.suggestedSlots = suggestedSlots;
  }
}
