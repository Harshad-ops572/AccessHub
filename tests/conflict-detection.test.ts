import { connectToDatabase } from "../src/lib/db";
import { Resource } from "../src/models/Resource";
import { Booking } from "../src/models/Booking";
import { User } from "../src/models/User";
import { detectSlotConflict } from "../src/services/conflictDetector";

async function runConflictTests() {
  console.log("=================================================");
  console.log("   PHASE 3 CONFLICT DETECTION TEST               ");
  console.log("=================================================");

  await connectToDatabase();

  let user = await User.findOne({ email: "student.a@campus.test" });
  let resource = await Resource.findOne({ title: /Ultimaker/ });

  if (!user) {
    user = await User.create({
      name: "Test Student",
      email: "student.a@campus.test",
      passwordHash: "dummyhash",
      role: "user",
      department: "Computer Science",
      verificationStatus: "verified",
    });
  }

  if (!resource) {
    resource = await Resource.create({
      title: "Ultimaker S5 3D Printer",
      category: "makerspace",
      description: "Dual extrusion 3D printer",
      location: "Makerspace 101",
      ownerId: user._id,
      maxDurationHours: 4,
      status: "active",
    });
  }

  // Setup: create an approved booking for tomorrow 14:00 - 16:00
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(14, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(16, 0, 0, 0);

  const existingBooking = await Booking.create({
    userId: user._id,
    resourceId: resource._id,
    start: tomorrow,
    end: tomorrowEnd,
    purpose: "Conflict Detection Automated Test Booking",
    status: "approved",
  });

  console.log("✓ Created test approved booking: 14:00 - 16:00");

  // Test 1: Exact overlapping slot (14:00 - 16:00) -> MUST CONFLICT
  const exactConflict = await detectSlotConflict(
    resource._id.toString(),
    tomorrow,
    tomorrowEnd,
    resource
  );
  if (exactConflict.hasConflict) {
    console.log("  ✓ PASS: Exact slot overlap detected correctly");
  } else {
    console.error("  ✗ FAIL: Exact slot overlap was not detected");
    process.exit(1);
  }

  // Test 2: Partial overlapping slot (15:00 - 17:00) -> MUST CONFLICT
  const partialStart = new Date(tomorrow);
  partialStart.setHours(15, 0, 0, 0);
  const partialEnd = new Date(tomorrow);
  partialEnd.setHours(17, 0, 0, 0);

  const partialConflict = await detectSlotConflict(
    resource._id.toString(),
    partialStart,
    partialEnd,
    resource
  );
  if (partialConflict.hasConflict) {
    console.log("  ✓ PASS: Partial slot overlap detected correctly");
  } else {
    console.error("  ✗ FAIL: Partial slot overlap was not detected");
    process.exit(1);
  }

  // Test 3: Alternative suggestions are generated
  if (partialConflict.suggestedSlots && partialConflict.suggestedSlots.length > 0) {
    console.log(`  ✓ PASS: Generated ${partialConflict.suggestedSlots.length} conflict-free alternative suggestions:`);
    partialConflict.suggestedSlots.forEach((s) => console.log(`     - ${s.label}`));
  } else {
    console.error("  ✗ FAIL: No alternative slots suggested");
    process.exit(1);
  }

  // Test 4: Disjoint slot (17:00 - 19:00) -> MUST NOT CONFLICT
  const disjointStart = new Date(tomorrow);
  disjointStart.setHours(17, 0, 0, 0);
  const disjointEnd = new Date(tomorrow);
  disjointEnd.setHours(19, 0, 0, 0);

  const disjointCheck = await detectSlotConflict(
    resource._id.toString(),
    disjointStart,
    disjointEnd,
    resource
  );
  if (!disjointCheck.hasConflict) {
    console.log("  ✓ PASS: Disjoint free slot allowed without conflict");
  } else {
    console.error("  ✗ FAIL: Disjoint free slot flagged as conflict");
    process.exit(1);
  }

  // Cleanup
  await Booking.findByIdAndDelete(existingBooking._id);
  console.log("✓ Cleaned up test booking");

  console.log("\n=================================================");
  console.log("Conflict Detection Suite: All Tests Passed!");
  console.log("=================================================");
  process.exit(0);
}

runConflictTests().catch((e) => {
  console.error("Test failed:", e);
  process.exit(1);
});
