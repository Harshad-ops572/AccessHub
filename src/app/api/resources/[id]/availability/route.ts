import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { Booking } from "@/models/Booking";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    await connectToDatabase();
    const resource = await Resource.findById(id).select("availability maxDurationHours status title").lean();
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");

    const now = new Date();
    const startDate = fromStr ? new Date(fromStr) : new Date(now.setHours(0, 0, 0, 0));
    const endDate = toStr ? new Date(toStr) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    // Find all active or reserved bookings that block the slot
    const busyBookings = await Booking.find({
      resourceId: new Types.ObjectId(id),
      status: { $in: ["approved", "checked_in"] },
      start: { $lt: endDate },
      end: { $gt: startDate },
    })
      .select("start end status")
      .lean();

    return NextResponse.json({
      resourceId: id,
      title: resource.title,
      status: resource.status,
      maxDurationHours: resource.maxDurationHours,
      weeklyWindows: resource.availability,
      busySlots: busyBookings.map((b) => ({
        start: b.start,
        end: b.end,
        status: b.status,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/resources/[id]/availability error:", error);
    return NextResponse.json(
      { error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
