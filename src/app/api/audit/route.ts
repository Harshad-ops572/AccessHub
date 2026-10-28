import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { AuditLog } from "@/models/AuditLog";
import { getCurrentUser } from "@/lib/rbac";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "admin" && user.role !== "owner" && user.role !== "manager") {
      return NextResponse.json(
        { error: "Forbidden: Only staff and administrators can access the audit log" },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get("entityType");
    const entityId = searchParams.get("entityId");
    const action = searchParams.get("action");
    const actorRole = searchParams.get("actorRole");
    const search = searchParams.get("search");
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const skip = (page - 1) * limit;

    const query: any = {};

    if (entityType) query.entityType = entityType;
    if (entityId && Types.ObjectId.isValid(entityId)) query.entityId = entityId;
    if (action) query.action = action;
    if (actorRole) query.actorRole = actorRole;

    if (search) {
      query.$or = [
        { reason: { $regex: search, $options: "i" } },
        { action: { $regex: search, $options: "i" } },
        { entityId: { $regex: search, $options: "i" } },
      ];
    }

    const total = await AuditLog.countDocuments(query);
    const logs = await AuditLog.find(query)
      .populate("actorId", "name email role department")
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    return NextResponse.json({
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("GET /api/audit error:", error);
    return NextResponse.json({ error: "Failed to fetch audit records" }, { status: 500 });
  }
}
