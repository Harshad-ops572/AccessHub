import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Resource } from "@/models/Resource";
import { User } from "@/models/User";
import { Waitlist } from "@/models/Waitlist";
import { getCurrentUser } from "@/lib/rbac";
import { executeBookingTransition } from "@/services/bookingStateMachine";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const body = await req.json();
    const reason = body.reason || "Cancelled by user";

    await connectToDatabase();
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const resource = await Resource.findById(booking.resourceId);

    const isBookingUser = booking.userId.toString() === user.id;
    const isResourceOwner = resource && resource.ownerId.toString() === user.id;
    const isAdmin = user.role === "admin";

    if (!isBookingUser && !isResourceOwner && !isAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You cannot cancel this booking" },
        { status: 403 }
      );
    }

    const previousStatus = booking.status;

    // Execute state transition
    await executeBookingTransition({
      booking,
      targetStatus: "cancelled",
      actorId: user.id,
      actorRole: user.role,
      reason,
    });

    // If it was previously approved, refund weekly hours quota
    if (previousStatus === "approved") {
      const durationHours = (booking.end.getTime() - booking.start.getTime()) / (1000 * 60 * 60);
      await User.findByIdAndUpdate(booking.userId, {
        $inc: { weeklyHoursUsed: -durationHours },
      });
    }

    // Auto-promote top-ranked waitlist entry if one exists
    const topWaitlisted = await Waitlist.findOne({
      resourceId: booking.resourceId,
      status: "active",
      slotStart: { $lte: booking.start },
      slotEnd: { $gte: booking.end },
    }).sort({ priorityScore: -1 });

    let promotedUserId: string | null = null;
    if (topWaitlisted) {
      topWaitlisted.status = "accepted";
      await topWaitlisted.save();

      // Create new approved booking for the promoted waitlist entry
      const promotedBooking = await Booking.create({
        userId: topWaitlisted.userId,
        resourceId: booking.resourceId,
        start: booking.start,
        end: booking.end,
        purpose: "Auto-promoted from waitlist priority queue upon cancellation",
        status: "approved",
        decisionReason: `Auto-promoted from waitlist queue (Priority Score: ${topWaitlisted.priorityScore.toFixed(
          2
        )}). Slot freed by prior cancellation.`,
      });

      promotedUserId = topWaitlisted.userId.toString();
    }

    return NextResponse.json({
      message: "Booking cancelled successfully",
      booking,
      promotedWaitlistUser: promotedUserId,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/cancel error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel booking" },
      { status: 500 }
    );
  }
}
