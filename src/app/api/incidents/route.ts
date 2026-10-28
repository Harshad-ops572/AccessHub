import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Incident } from "@/models/Incident";
import { Booking } from "@/models/Booking";
import { Resource } from "@/models/Resource";
import { getCurrentUser } from "@/lib/rbac";
import { IncidentSchema } from "@/validators/inspection.schema";
import { writeAudit } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query: any = {};
    if (status) query.status = status;

    if (user.role === "user") {
      // Find incidents for user's bookings
      const userBookings = await Booking.find({ userId: new Types.ObjectId(user.id) }).select("_id");
      query.bookingId = { $in: userBookings.map((b) => b._id) };
    } else if (user.role === "owner") {
      // Find incidents on equipment owned by this owner
      const ownedResources = await Resource.find({ ownerId: new Types.ObjectId(user.id) }).select("_id");
      const resourceBookings = await Booking.find({ resourceId: { $in: ownedResources.map((r) => r._id) } }).select("_id");
      query.bookingId = { $in: resourceBookings.map((b) => b._id) };
    }
    // manager and admin see all

    const incidents = await Incident.find(query)
      .populate({
        path: "bookingId",
        populate: [
          { path: "resourceId", select: "title category location ownerId" },
          { path: "userId", select: "name email department strikes" },
        ],
      })
      .populate("reportedBy", "name role")
      .populate("resolvedBy", "name role")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ incidents, count: incidents.length });
  } catch (error: any) {
    console.error("GET /api/incidents error:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
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
    const validated = IncidentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const booking = await Booking.findById(validated.data.bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const incident = await Incident.create({
      bookingId: booking._id,
      type: validated.data.type,
      description: validated.data.description,
      severity: validated.data.severity,
      status: "open",
      photos: validated.data.photos,
      reportedBy: new Types.ObjectId(user.id),
    });

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "INCIDENT_REPORTED",
      entityType: "Incident",
      entityId: incident._id.toString(),
      after: {
        bookingId: validated.data.bookingId,
        type: validated.data.type,
        severity: validated.data.severity,
        description: validated.data.description,
      },
      reason: `Incident reported by ${user.name} (${user.role})`,
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/incidents error:", error);
    return NextResponse.json(
      { error: "Failed to report incident" },
      { status: 500 }
    );
  }
}
