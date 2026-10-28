import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Incident } from "@/models/Incident";
import { Booking } from "@/models/Booking";
import { User } from "@/models/User";
import { Notification } from "@/models/Notification";
import { requireUserWithRole } from "@/lib/rbac";
import { ResolveIncidentSchema } from "@/validators/inspection.schema";
import { writeAudit } from "@/lib/audit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid incident ID" }, { status: 400 });
    }

    const { errorResponse, user } = await requireUserWithRole(["owner", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validated = ResolveIncidentSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const incident = await Incident.findById(id).populate("bookingId");

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const beforeState = incident.toObject();

    incident.status = validated.data.status;
    incident.resolution = validated.data.resolution;
    incident.resolvedBy = new Types.ObjectId(user!.id);
    await incident.save();

    let strikeApplied = false;
    const booking = incident.bookingId as any;

    // Apply penalty strike ONLY after explicit human confirmation
    if (validated.data.applyStrike && booking?.userId) {
      await User.findByIdAndUpdate(booking.userId, {
        $inc: { strikes: 1 },
      });
      strikeApplied = true;

      await writeAudit({
        actorId: user!.id,
        actorRole: user!.role,
        action: "PENALTY_STRIKE_APPLIED",
        entityType: "User",
        entityId: booking.userId.toString(),
        after: { incidentId: id, resolution: validated.data.resolution },
        reason: `Human review confirmed penalty strike for incident: "${validated.data.resolution}"`,
      });

      await Notification.create({
        userId: booking.userId,
        type: "incident_strike",
        message: `A penalty strike was recorded following human review of an incident: "${validated.data.resolution}". This temporarily lowers waitlist priority.`,
        link: `/bookings/${booking._id}`,
      });
    }

    await writeAudit({
      actorId: user!.id,
      actorRole: user!.role,
      action: `INCIDENT_${validated.data.status.toUpperCase()}`,
      entityType: "Incident",
      entityId: id,
      before: beforeState,
      after: incident.toObject(),
      reason: `Human resolution by ${user!.name}: ${validated.data.resolution} (Strike applied: ${strikeApplied})`,
    });

    return NextResponse.json({
      message: `Incident ${validated.data.status} successfully`,
      incident,
      strikeApplied,
    });
  } catch (error: any) {
    console.error("PATCH /api/incidents/[id] error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to resolve incident" },
      { status: 500 }
    );
  }
}
