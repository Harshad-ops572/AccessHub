import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Credential } from "@/models/Credential";
import { getCurrentUser } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const filterStatus = searchParams.get("status");
    const filterUser = searchParams.get("userId");

    const query: any = {};

    // Managers and Admins can see all credentials or pending ones
    if (user.role === "manager" || user.role === "admin") {
      if (filterStatus) query.status = filterStatus;
      if (filterUser) query.userId = new Types.ObjectId(filterUser);
    } else {
      // Regular users and owners only see their own
      query.userId = new Types.ObjectId(user.id);
      if (filterStatus) query.status = filterStatus;
    }

    const credentials = await Credential.find(query)
      .populate("userId", "name email department")
      .populate("verifiedBy", "name")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ credentials });
  } catch (error: any) {
    console.error("GET /api/credentials error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
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
    const { type, documentUrl } = body;

    if (!type || !documentUrl) {
      return NextResponse.json(
        { error: "Credential type and documentUrl are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const newCred = await Credential.create({
      userId: new Types.ObjectId(user.id),
      type,
      documentUrl,
      status: "pending",
    });

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "CREDENTIAL_SUBMITTED",
      entityType: "Credential",
      entityId: newCred._id.toString(),
      after: { type, documentUrl, status: "pending" },
      reason: "User uploaded certification document for manager review",
    });

    return NextResponse.json({ credential: newCred }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/credentials error:", error);
    return NextResponse.json(
      { error: "Failed to submit credential" },
      { status: 500 }
    );
  }
}
