import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Waitlist } from "@/models/Waitlist";
import { Resource } from "@/models/Resource";
import { User } from "@/models/User";
import { getCurrentUser } from "@/lib/rbac";
import { calculateWaitlistPriorityScore, getWaitlistQueuePosition } from "@/services/fairnessService";
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
    const resourceId = searchParams.get("resourceId");

    const query: any = { status: "active" };

    if (resourceId) {
      query.resourceId = new Types.ObjectId(resourceId);
    } else if (user.role === "user") {
      query.userId = new Types.ObjectId(user.id);
    }

    const waitlistEntries = await Waitlist.find(query)
      .populate("resourceId", "title category location maxDurationHours photos")
      .populate("userId", "name email department strikes weeklyHoursUsed")
      .sort({ priorityScore: -1 })
      .lean();

    return NextResponse.json({ waitlist: waitlistEntries, count: waitlistEntries.length });
  } catch (error: any) {
    console.error("GET /api/waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to fetch waitlist" },
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
    const { resourceId, slotStart, slotEnd } = body;

    if (!resourceId || !slotStart || !slotEnd) {
      return NextResponse.json(
        { error: "resourceId, slotStart, and slotEnd are required" },
        { status: 400 }
      );
    }

    await connectToDatabase();
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    // Check if user is already on waitlist for this slot
    const existingEntry = await Waitlist.findOne({
      resourceId: new Types.ObjectId(resourceId),
      userId: new Types.ObjectId(user.id),
      slotStart: new Date(slotStart),
      status: "active",
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "You are already active on the waitlist for this time slot" },
        { status: 409 }
      );
    }

    const dbUser = await User.findById(user.id);
    const strikes = dbUser?.strikes || 0;
    const weeklyHours = dbUser?.weeklyHoursUsed || 0;

    // Calculate initial priority score
    const scoreResult = calculateWaitlistPriorityScore(weeklyHours, 1.0, strikes);

    const newWaitlistEntry = await Waitlist.create({
      resourceId: new Types.ObjectId(resourceId),
      userId: new Types.ObjectId(user.id),
      slotStart: new Date(slotStart),
      slotEnd: new Date(slotEnd),
      priorityScore: scoreResult.score,
      scoreBreakdown: {
        recentUsage: scoreResult.breakdown.recentUsage,
        strikes: scoreResult.breakdown.strikes,
        waitTime: scoreResult.breakdown.waitHours,
      },
      status: "active",
    });

    const queuePos = await getWaitlistQueuePosition(resourceId, newWaitlistEntry._id);

    await writeAudit({
      actorId: user.id,
      actorRole: user.role,
      action: "WAITLIST_JOINED",
      entityType: "Waitlist",
      entityId: newWaitlistEntry._id.toString(),
      after: {
        resourceId,
        slotStart,
        slotEnd,
        priorityScore: scoreResult.score,
        queuePosition: queuePos.position,
      },
      reason: `Student joined waitlist queue. Priority score: ${scoreResult.score} (Position ${queuePos.position} of ${queuePos.totalInQueue})`,
    });

    return NextResponse.json(
      {
        message: "Successfully joined waitlist queue",
        entry: newWaitlistEntry,
        queuePosition: queuePos.position,
        totalInQueue: queuePos.totalInQueue,
        scoreResult,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json(
      { error: "Failed to join waitlist" },
      { status: 500 }
    );
  }
}
