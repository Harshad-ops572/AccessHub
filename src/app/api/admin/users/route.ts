import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    await connectToDatabase();
    const users = await User.find({})
      .select("-passwordHash")
      .sort({ strikes: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, strikes, role, department } = body;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: "Valid userId is required" }, { status: 400 });
    }

    await connectToDatabase();
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const beforeState = {
      strikes: targetUser.strikes,
      role: targetUser.role,
      department: targetUser.department,
    };

    if (typeof strikes === "number") targetUser.strikes = Math.max(0, strikes);
    if (role && ["user", "owner", "manager", "admin"].includes(role)) targetUser.role = role;
    if (department) targetUser.department = department.trim();

    await targetUser.save();

    await writeAudit({
      actorId: currentUser.id,
      actorRole: "admin",
      action: "USER_UPDATED",
      entityType: "User",
      entityId: targetUser._id.toString(),
      before: beforeState,
      after: {
        strikes: targetUser.strikes,
        role: targetUser.role,
        department: targetUser.department,
      },
      reason: `Administrator updated user profile: strikes set to ${targetUser.strikes}, role set to ${targetUser.role}`,
    });

    return NextResponse.json({
      message: "User successfully updated",
      user: {
        id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        department: targetUser.department,
        strikes: targetUser.strikes,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
