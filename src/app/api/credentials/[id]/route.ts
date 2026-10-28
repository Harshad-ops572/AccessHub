import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Credential } from "@/models/Credential";
import { getCurrentUser } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Types } from "mongoose";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "manager" && user.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only managers and admins can verify credentials" },
        { status: 403 }
      );
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid credential ID" }, { status: 400 });
    }

    const body = await req.json();
    const { action, rejectionReason, expiresAt } = body;

    if (!action || !["verify", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "Valid action is required ('verify' or 'reject')" },
        { status: 400 }
      );
    }

    if (action === "reject" && (!rejectionReason || !rejectionReason.trim())) {
      return NextResponse.json(
        { error: "Rejection reason is required when rejecting a credential" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const credential = await Credential.findById(id);
    if (!credential) {
      return NextResponse.json({ error: "Credential not found" }, { status: 404 });
    }

    const beforeState = {
      status: credential.status,
      verifiedBy: credential.verifiedBy?.toString(),
    };

    if (action === "verify") {
      credential.status = "verified";
      credential.verifiedBy = new Types.ObjectId(user.id);
      credential.rejectionReason = undefined;
      // Default expiration 1 year from now if not explicitly passed
      credential.expiresAt = expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
      await credential.save();

      await writeAudit({
        actorId: user.id,
        actorRole: user.role,
        action: "CREDENTIAL_VERIFIED",
        entityType: "Credential",
        entityId: credential._id.toString(),
        before: beforeState,
        after: {
          status: credential.status,
          verifiedBy: user.id,
          expiresAt: credential.expiresAt,
        },
        reason: `Credential verified by campus manager: ${credential.type}`,
      });
    } else {
      credential.status = "rejected";
      credential.verifiedBy = new Types.ObjectId(user.id);
      credential.rejectionReason = rejectionReason.trim();
      await credential.save();

      await writeAudit({
        actorId: user.id,
        actorRole: user.role,
        action: "CREDENTIAL_REJECTED",
        entityType: "Credential",
        entityId: credential._id.toString(),
        before: beforeState,
        after: {
          status: credential.status,
          verifiedBy: user.id,
          rejectionReason: credential.rejectionReason,
        },
        reason: `Credential rejected: ${rejectionReason.trim()}`,
      });
    }

    const updated = await Credential.findById(id)
      .populate("userId", "name email department")
      .populate("verifiedBy", "name")
      .lean();

    return NextResponse.json({
      message: `Credential successfully ${action === "verify" ? "verified" : "rejected"}`,
      credential: updated,
    });
  } catch (error: any) {
    console.error("PATCH /api/credentials/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update credential" },
      { status: 500 }
    );
  }
}
