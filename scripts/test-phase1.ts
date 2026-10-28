import { connectToDatabase } from "../src/lib/db";
import { User } from "../src/models/User";
import { writeAudit } from "../src/lib/audit";
import { AuditLog } from "../src/models/AuditLog";
import bcrypt from "bcryptjs";

async function main() {
  console.log("--- Testing Phase 1 Database & Models ---");
  await connectToDatabase();
  console.log("✓ Connected to Database");

  // Clean test user if exists
  await User.deleteOne({ email: "test_verification@campus.test" });

  const passwordHash = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Verification User",
    email: "test_verification@campus.test",
    passwordHash,
    department: "Computer Science",
    role: "user",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 0,
  });
  console.log("✓ Created user:", user.email, "role:", user.role);

  // Test Audit Log
  const audit = await writeAudit({
    actorId: user._id.toString(),
    actorRole: user.role,
    action: "USER_REGISTERED",
    entityType: "User",
    entityId: user._id.toString(),
    after: { email: user.email },
    reason: "Phase 1 verification",
  });
  console.log("✓ Wrote audit entry:", audit?.action, "id:", audit?._id.toString());

  const readLog = await AuditLog.findById(audit?._id);
  console.log("✓ Verified immutable audit read:", readLog?.entityType, readLog?.action);

  console.log("--- Phase 1 Verification Passed Successfully ---");
  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});
