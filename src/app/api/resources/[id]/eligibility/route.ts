import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { getCurrentUser } from "@/lib/rbac";
import { evaluateUserEligibility } from "@/services/eligibilityEngine";
import { Types } from "mongoose";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid resource ID" }, { status: 400 });
    }

    await connectToDatabase();
    const resource = await Resource.findById(id);
    if (!resource) {
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    const result = await evaluateUserEligibility(user.id, resource);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET /api/resources/[id]/eligibility error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate eligibility" },
      { status: 500 }
    );
  }
}
