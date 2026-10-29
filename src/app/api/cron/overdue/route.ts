import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Notification } from "@/models/Notification";
import { writeAudit } from "@/lib/audit";
import { executeBookingTransition } from "@/services/bookingStateMachine";

export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
    throw new Error("CRON_SECRET environment variable is missing in production");
  }

  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();

    // Find bookings currently checked_in whose scheduled end time is in the past
    const overdueBookings = await Booking.find({
      status: "checked_in",
      end: { $lt: now },
    })
      .populate("resourceId", "title ownerId")
      .populate("userId", "name email");

    let transitionedCount = 0;

    for (const booking of overdueBookings) {
      const resourceTitle = (booking as any).resourceId?.title || "Resource";
      const studentId = (booking as any).userId?._id;
      const ownerId = (booking as any).resourceId?.ownerId;

      await executeBookingTransition({
        booking,
        targetStatus: "overdue",
        actorRole: "system",
        reason: `Automated cron check: Scheduled return deadline (${new Date(
          booking.end
        ).toLocaleTimeString()}) has passed without check-in return inspection.`,
      });

      // Notify Student
      if (studentId) {
        await Notification.create({
          userId: studentId,
          message: `OVERDUE NOTICE: Your reservation for "${resourceTitle}" is past due. Please return the equipment to the facility desk immediately to avoid safety strikes.`,
          type: "system",
          link: `/bookings/${booking._id}`,
          read: false,
        });
      }

      // Notify Owner
      if (ownerId) {
        await Notification.create({
          userId: ownerId,
          message: `Facility Alert: Booking for "${resourceTitle}" by ${(booking as any).userId?.name} is overdue.`,
          type: "system",
          link: `/owner/queue`,
          read: false,
        });
      }

      await writeAudit({
        actorRole: "system",
        action: "BOOKING_MARKED_OVERDUE",
        entityType: "Booking",
        entityId: booking._id.toString(),
        before: { status: "checked_in" },
        after: { status: "overdue", overdueAt: now },
        reason: "Scheduled end time elapsed without return inspection",
      });

      transitionedCount++;
    }

    return NextResponse.json({
      success: true,
      overdueDetected: overdueBookings.length,
      transitionedCount,
      timestamp: now.toISOString(),
    });
  } catch (error: any) {
    console.error("Cron overdue error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
