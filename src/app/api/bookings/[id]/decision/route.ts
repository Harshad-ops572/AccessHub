import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Resource } from "@/models/Resource";
import { User } from "@/models/User";
import { requireUserWithRole, canManageResource } from "@/lib/rbac";
import { DecisionSchema } from "@/validators/booking.schema";
import { executeBookingTransition } from "@/services/bookingStateMachine";
import { detectSlotConflict } from "@/services/conflictDetector";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const { errorResponse, user } = await requireUserWithRole(["owner", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validated = DecisionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { decision, reason } = validated.data;

    const mongooseInstance = await connectToDatabase();
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const resource = await Resource.findById(booking.resourceId);
    if (!resource) {
      return NextResponse.json({ error: "Associated resource not found" }, { status: 404 });
    }

    // Verify caller owns this resource or is admin
    if (!canManageResource(resource.ownerId.toString(), user!)) {
      return NextResponse.json(
        { error: "Forbidden: You are not the authorized owner of this equipment" },
        { status: 403 }
      );
    }

    let targetStatus: "approved" | "rejected" | "waitlisted";
    if (decision === "approve") targetStatus = "approved";
    else if (decision === "reject") targetStatus = "rejected";
    else targetStatus = "waitlisted";

    // If approving, run conflict check inside transaction to guarantee two simultaneous requests for same slot cannot both be approved!
    if (targetStatus === "approved") {
      const session = await mongooseInstance.startSession();
      try {
        await session.withTransaction(async () => {
          // Check for conflicts with other approved bookings
          const conflict = await detectSlotConflict(
            booking.resourceId.toString(),
            booking.start,
            booking.end,
            resource,
            session
          );

          if (conflict.hasConflict) {
            throw new Error(
              "Slot conflict: another booking for this equipment was already approved during this exact time slot."
            );
          }

          // Transition to approved
          await executeBookingTransition({
            booking,
            targetStatus: "approved",
            actorId: user!.id,
            actorRole: user!.role,
            reason,
            session,
          });

          // Compute hours and update requester weekly hours
          const durationHours = (booking.end.getTime() - booking.start.getTime()) / (1000 * 60 * 60);
          await User.findByIdAndUpdate(
            booking.userId,
            { $inc: { weeklyHoursUsed: durationHours } },
            { session }
          );
        });
      } finally {
        await session.endSession();
      }
    } else {
      // Rejection or waitlisting
      await executeBookingTransition({
        booking,
        targetStatus,
        actorId: user!.id,
        actorRole: user!.role,
        reason,
      });
    }

    return NextResponse.json({
      message: `Booking has been ${targetStatus}`,
      booking,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/decision error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to execute decision" },
      { status: 500 }
    );
  }
}
