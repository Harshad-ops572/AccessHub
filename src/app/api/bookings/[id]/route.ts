import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Inspection } from "@/models/Inspection";
import { Incident } from "@/models/Incident";
import { AuditLog } from "@/models/AuditLog";
import { getCurrentUser } from "@/lib/rbac";
import { Types } from "mongoose";

export async function GET(
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

    await connectToDatabase();
    const booking = await Booking.findById(id)
      .populate("resourceId", "title category location maxDurationHours photos rules ownerId")
      .populate("userId", "name email department strikes weeklyHoursUsed")
      .lean();

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Role check: Only booking owner, resource owner, manager, or admin can access
    const isBookingUser = booking.userId._id.toString() === user.id;
    const isResourceOwner = (booking.resourceId as any).ownerId?.toString() === user.id;
    const isStaffOrAdmin = user.role === "manager" || user.role === "admin";

    if (!isBookingUser && !isResourceOwner && !isStaffOrAdmin) {
      return NextResponse.json(
        { error: "Forbidden: You are not authorized to view this booking" },
        { status: 403 }
      );
    }

    // Fetch related inspections, incidents, and audit timeline
    const [inspections, incidents, auditLogs] = await Promise.all([
      Inspection.find({ bookingId: new Types.ObjectId(id) })
        .populate("recordedBy", "name role")
        .sort({ createdAt: 1 })
        .lean(),
      Incident.find({ bookingId: new Types.ObjectId(id) })
        .populate("reportedBy", "name")
        .populate("resolvedBy", "name")
        .sort({ createdAt: -1 })
        .lean(),
      AuditLog.find({ entityId: id })
        .populate("actorId", "name email role")
        .sort({ timestamp: 1 })
        .lean(),
    ]);

    return NextResponse.json({
      booking,
      inspections,
      incidents,
      auditLogs,
    });
  } catch (error: any) {
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch booking details" },
      { status: 500 }
    );
  }
}
