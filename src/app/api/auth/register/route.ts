import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/models/User";
import { RegisterSchema } from "@/validators/auth.schema";
import { writeAudit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedData = RegisterSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validatedData.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password, department } = validatedData.data;

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Every self-registered account must be created with role "user" and verificationStatus "verified"
    const role = "user";
    const verificationStatus = "verified";

    const newUser = await User.create({
      name,
      email,
      passwordHash,
      department,
      role: "user",
      verificationStatus: "verified",
      strikes: 0,
      weeklyHoursUsed: 0,
    });

    await writeAudit({
      actorId: newUser._id.toString(),
      actorRole: "user",
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: newUser._id.toString(),
      after: { email, role: "user", department, verificationStatus: "verified" },
      reason: "Self-service registration",
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          department: newUser.department,
          verificationStatus: newUser.verificationStatus,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error during registration" },
      { status: 500 }
    );
  }
}
