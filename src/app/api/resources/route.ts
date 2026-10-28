import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Resource } from "@/models/Resource";
import { Credential } from "@/models/Credential";
import { requireUserWithRole, getCurrentUser } from "@/lib/rbac";
import { ResourceSchema } from "@/validators/resource.schema";
import { writeAudit } from "@/lib/audit";
import { Types } from "mongoose";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("query") || "";
    const category = searchParams.get("category") || "";
    const location = searchParams.get("location") || "";
    const eligibleOnly = searchParams.get("eligibleOnly") === "true";
    const ownerId = searchParams.get("ownerId") || "";

    const filter: any = {};

    // By default, only active resources are discoverable unless filtered by owner
    if (!ownerId) {
      filter.status = "active";
    } else {
      filter.ownerId = new Types.ObjectId(ownerId);
    }

    if (category && category !== "all") {
      filter.category = category;
    }

    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { location: { $regex: query, $options: "i" } },
        { requiredCredentials: { $regex: query, $options: "i" } },
      ];
    }

    let resources = await Resource.find(filter)
      .populate("ownerId", "name email department")
      .sort({ createdAt: -1 })
      .lean();

    // If "eligibleOnly" filter is checked, filter against current user's verified credentials
    const currentUser = await getCurrentUser();
    let userVerifiedCreds: string[] = [];

    if (currentUser) {
      const activeCredentials = await Credential.find({
        userId: new Types.ObjectId(currentUser.id),
        status: "verified",
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: null },
          { expiresAt: { $gt: new Date() } },
        ],
      }).lean();

      userVerifiedCreds = activeCredentials.map((c) => c.type.toLowerCase().trim());
    }

    // Attach eligibility status to each resource for the current user
    const formattedResources = resources.map((r: any) => {
      const reqCreds = (r.requiredCredentials || []).map((c: string) => c.toLowerCase().trim());
      const missingCreds = reqCreds.filter((reqC: string) => !userVerifiedCreds.includes(reqC));
      const isEligible = currentUser ? missingCreds.length === 0 : false;

      return {
        ...r,
        userEligibility: {
          isEligible,
          missingCredsCount: missingCreds.length,
          missingCreds,
        },
      };
    });

    if (eligibleOnly && currentUser) {
      const filtered = formattedResources.filter((r) => r.userEligibility.isEligible);
      return NextResponse.json({ resources: filtered, total: filtered.length });
    }

    return NextResponse.json({ resources: formattedResources, total: formattedResources.length });
  } catch (error: any) {
    console.error("GET /api/resources error:", error);
    return NextResponse.json(
      { error: "Failed to fetch resources" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { errorResponse, user } = await requireUserWithRole(["owner", "admin"]);
    if (errorResponse) return errorResponse;

    const body = await req.json();
    const validated = ResourceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validated.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const resource = await Resource.create({
      ...validated.data,
      ownerId: new Types.ObjectId(user!.id),
    });

    await writeAudit({
      actorId: user!.id,
      actorRole: user!.role,
      action: "RESOURCE_CREATED",
      entityType: "Resource",
      entityId: resource._id.toString(),
      after: {
        title: resource.title,
        category: resource.category,
        location: resource.location,
        requiredCredentials: resource.requiredCredentials,
      },
      reason: "Owner published resource listing",
    });

    return NextResponse.json({ resource }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/resources error:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  }
}
