import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { requireUserWithRole, canManageResource } from "@/lib/rbac";
import { ResourceUpdateSchema } from "@/validators/resource.schema";
import { writeAudit } from "@/lib/audit";
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
    const resource = await Resource.findById(id)
      .populate("ownerId", "name email department")
      .lean();

    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    return NextResponse.json({ resource });
  } catch (error: any) {
    console.error("GET /api/resources/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch resource" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    const { errorResponse, user } = await requireUserWithRole(["owner", "admin"]);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const existing = await Resource.findById(id);
    if (!existing) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    if (!canManageResource(existing.ownerId.toString(), user!)) {
      return NextResponse.json(
        { error: "Forbidden: You do not own this resource" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const validated = ResourceUpdateSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const beforeState = existing.toObject();
    Object.assign(existing, validated.data);
    await existing.save();

    await writeAudit({
      actorId: user!.id,
      actorRole: user!.role,
      action: "RESOURCE_UPDATED",
      entityType: "Resource",
      entityId: id,
      before: beforeState,
      after: existing.toObject(),
      reason: body.reason || "Owner updated resource details/status",
    });

    return NextResponse.json({ resource: existing });
  } catch (error: any) {
    console.error("PATCH /api/resources/[id] error:", error);
    return NextResponse.json({ error: "Failed to update resource" }, { status: 500 });
  }
}
