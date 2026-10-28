import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/rbac";
import { connectToDatabase } from "@/lib/db";
import { Notification } from "@/models/Notification";
import { Types } from "mongoose";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await connectToDatabase();
  const notifications = await Notification.find({
    userId: new Types.ObjectId(user.id),
  })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  return NextResponse.json({ notifications });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  await connectToDatabase();

  if (id) {
    await Notification.updateOne(
      { _id: new Types.ObjectId(id), userId: new Types.ObjectId(user.id) },
      { $set: { read: true } }
    );
  } else {
    // Mark all as read
    await Notification.updateMany(
      { userId: new Types.ObjectId(user.id), read: false },
      { $set: { read: true } }
    );
  }

  return NextResponse.json({ success: true });
}
