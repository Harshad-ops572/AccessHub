import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Notification } from "@/models/Notification";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET || "campus_cron_secret";
    
    // Allow cron secret header or local development
    if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized cron trigger" }, { status: 401 });
    }

    await connectToDatabase();

    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Find bookings starting between now and 2 hours from now that are approved
    const upcomingBookings = await Booking.find({
      status: "approved",
      start: { $gte: now, $lte: inTwoHours },
    })
      .populate("resourceId", "title location")
      .populate("userId", "name email");

    let notificationsCreated = 0;

    for (const booking of upcomingBookings) {
      // Check if reminder was already sent for this booking
      const existingNotif = await Notification.findOne({
        userId: (booking as any).userId._id,
        link: `/bookings/${booking._id}`,
        message: { $regex: /starts soon/i },
      });

      if (!existingNotif) {
        const resourceTitle = (booking as any).resourceId?.title || "Equipment";
        const location = (booking as any).resourceId?.location || "campus lab";
        const startTimeStr = new Date(booking.start).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        await Notification.create({
          userId: (booking as any).userId._id,
          message: `Booking Reminder: Your reservation for "${resourceTitle}" at ${location} starts soon at ${startTimeStr}. Please bring your campus ID.`,
          type: "system",
          link: `/bookings/${booking._id}`,
          read: false,
        });

        notificationsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      upcomingFound: upcomingBookings.length,
      notificationsCreated,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Cron reminders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
