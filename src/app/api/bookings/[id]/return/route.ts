import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Inspection } from "@/models/Inspection";
import { Incident } from "@/models/Incident";
import { requireUserWithRole } from "@/lib/rbac";
import { InspectionSchema } from "@/validators/inspection.schema";
import { executeBookingTransition } from "@/services/bookingStateMachine";
import { writeAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid booking ID" }, { status: 400 });
    }

    const { errorResponse, user } = await requireUserWithRole(["manager", "owner", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validated = InspectionSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const booking = await Booking.findById(id);

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.status !== "checked_in" && booking.status !== "overdue") {
      return NextResponse.json(
        { error: `Cannot return booking with status "${booking.status}". Must be "checked_in" or "overdue".` },
        { status: 400 }
      );
    }

    // Find previous check-in inspection
    const checkinInspection = await Inspection.findOne({
      bookingId: booking._id,
      type: "checkin",
    }).lean();

    const checkinRating = checkinInspection?.conditionRating || 5;
    const returnRating = validated.data.conditionRating;
    const ratingDelta = returnRating - checkinRating;

    const returnInspection = await Inspection.create({
      bookingId: booking._id,
      type: "return",
      conditionRating: returnRating,
      checklist: validated.data.checklist,
      notes: validated.data.notes,
      photos: validated.data.photos,
      recordedBy: new Types.ObjectId(user!.id),
    });

    let damageIncidentCreated = false;
    let incidentId: string | null = null;

    // Detect Condition Drop or Reported Damage
    const failedChecklistItems = validated.data.checklist.filter((c) => !c.passed);
    const hasConditionDrop = ratingDelta < 0 || failedChecklistItems.length > 0;

    if (hasConditionDrop || body.reportDamage) {
      const severity = ratingDelta <= -2 ? "high" : "medium";
      const failedItemsDesc = failedChecklistItems.map((c) => c.item).join(", ");

      const damageIncident = await Incident.create({
        bookingId: booking._id,
        type: "damage",
        description: `Condition rating dropped from ${checkinRating}/5 to ${returnRating}/5. ${
          failedItemsDesc ? `Failed checklist: ${failedItemsDesc}. ` : ""
        }Inspector notes: "${validated.data.notes || "Damage flagged on return."}"`,
        severity,
        status: "open",
        photos: validated.data.photos,
        reportedBy: new Types.ObjectId(user!.id),
      });

      damageIncidentCreated = true;
      incidentId = damageIncident._id.toString();

      await writeAudit({
        actorId: user!.id,
        actorRole: user!.role,
        action: "INCIDENT_AUTOMATICALLY_LOGGED",
        entityType: "Incident",
        entityId: damageIncident._id.toString(),
        after: {
          bookingId: id,
          ratingDelta,
          severity,
          notes: validated.data.notes,
        },
        reason: `Automated condition drop detection: rating dropped by ${Math.abs(ratingDelta)} stars on return inspection`,
      });
    }

    // Transition booking state: if incident raised, mark returned -> disputed; else returned -> closed
    await executeBookingTransition({
      booking,
      targetStatus: "returned",
      actorId: user!.id,
      actorRole: user!.role,
      reason: `Returned by ${user!.name}. Final condition rating: ${returnRating}/5. Rating delta: ${ratingDelta}. ${
        hasConditionDrop ? "Damage incident logged for human review." : "Clean return."
      }`,
    });

    if (!hasConditionDrop && !body.reportDamage) {
      await executeBookingTransition({
        booking,
        targetStatus: "closed",
        actorId: user!.id,
        actorRole: user!.role,
        reason: "All return checks passed with pristine condition rating. Booking safely closed.",
      });
    } else {
      await executeBookingTransition({
        booking,
        targetStatus: "disputed",
        actorId: user!.id,
        actorRole: user!.role,
        reason: "Damage or condition degradation flagged during return inspection. Awaiting human resolution.",
      });
    }

    await writeAudit({
      actorId: user!.id,
      actorRole: user!.role,
      action: "INSPECTION_RETURN_RECORDED",
      entityType: "Inspection",
      entityId: returnInspection._id.toString(),
      after: {
        bookingId: id,
        checkinRating,
        returnRating,
        ratingDelta,
        hasConditionDrop,
        incidentId,
      },
      reason: "Return inspection recorded with condition comparison",
    });

    return NextResponse.json({
      message: "Return inspection completed",
      inspection: returnInspection,
      ratingDelta,
      hasConditionDrop,
      incidentCreated: damageIncidentCreated,
      booking,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/return error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete return inspection" },
      { status: 500 }
    );
  }
}
