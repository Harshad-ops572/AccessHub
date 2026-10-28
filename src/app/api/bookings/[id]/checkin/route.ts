import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Booking } from "@/models/Booking";
import { Inspection } from "@/models/Inspection";
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

    if (booking.status !== "approved") {
      return NextResponse.json(
        { error: `Cannot check in booking with status "${booking.status}". Must be "approved".` },
        { status: 400 }
      );
    }

    const inspection = await Inspection.create({
      bookingId: booking._id,
      type: "checkin",
      conditionRating: validated.data.conditionRating,
      checklist: validated.data.checklist,
      notes: validated.data.notes,
      photos: validated.data.photos,
      recordedBy: new Types.ObjectId(user!.id),
    });

    // Execute state machine transition to checked_in
    await executeBookingTransition({
      booking,
      targetStatus: "checked_in",
      actorId: user!.id,
      actorRole: user!.role,
      reason: `Checked in by ${user!.name}. Condition rating: ${validated.data.conditionRating}/5. Notes: ${validated.data.notes || "None"}`,
    });

    await writeAudit({
      actorId: user!.id,
      actorRole: user!.role,
      action: "INSPECTION_CHECKIN_RECORDED",
      entityType: "Inspection",
      entityId: inspection._id.toString(),
      after: {
        bookingId: id,
        conditionRating: validated.data.conditionRating,
        notes: validated.data.notes,
        photos: validated.data.photos,
      },
      reason: "Handover check-in inspection recorded",
    });

    return NextResponse.json({
      message: "Check-in completed successfully",
      inspection,
      booking,
    });
  } catch (error: any) {
    console.error("POST /api/bookings/[id]/checkin error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to complete check-in" },
      { status: 500 }
    );
  }
}
