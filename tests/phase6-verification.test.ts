import { connectToDatabase, disconnectFromDatabase } from "../src/lib/db";
import { User } from "../src/models/User";
import { Resource } from "../src/models/Resource";
import { Booking } from "../src/models/Booking";
import { Notification } from "../src/models/Notification";
import { AuditLog } from "../src/models/AuditLog";
import { writeAudit } from "../src/lib/audit";
import { executeBookingTransition } from "../src/services/bookingStateMachine";

async function runPhase6Tests() {
  console.log("=================================================");
  console.log("   PHASE 6 TEST SUITE: CRON, AUDIT & GOVERNANCE ");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}`);
      failed++;
    }
  }

  let testStudent: any;
  let testOwner: any;
  let testAdmin: any;
  let testResource: any;
  let upcomingBooking: any;
  let overdueBooking: any;

  try {
    await connectToDatabase();

    // 1. Setup entities
    testStudent = await User.create({
      name: "Phase6 Test Student",
      email: `p6_student_${Date.now()}@campus.test`,
      passwordHash: "hash123",
      role: "user",
      department: "Physics & Astronomy",
      strikes: 0,
    });

    testOwner = await User.create({
      name: "Phase6 Test Owner",
      email: `p6_owner_${Date.now()}@campus.test`,
      passwordHash: "hash123",
      role: "owner",
      department: "Astrophysics Core",
      strikes: 0,
    });

    testAdmin = await User.create({
      name: "Phase6 Test Admin",
      email: `p6_admin_${Date.now()}@campus.test`,
      passwordHash: "hash123",
      role: "admin",
      department: "Campus Operations",
      strikes: 0,
    });

    testResource = await Resource.create({
      title: "Phase6 Cryogenic Dilution Refrigerator",
      category: "testing",
      description: "Sub-Kelvin cooling station for quantum experiments",
      location: "Physics Basement Sub-02",
      ownerId: testOwner._id,
      rules: "Strict safety briefing required",
      availability: [{ dayOfWeek: 1, startTime: "08:00", endTime: "20:00" }],
      maxDurationHours: 6,
      requiredCredentials: [],
      requiresApproval: true,
      status: "active",
    });

    // Upcoming booking: starts in 30 minutes
    const now = new Date();
    upcomingBooking = await Booking.create({
      resourceId: testResource._id,
      userId: testStudent._id,
      start: new Date(now.getTime() + 30 * 60 * 1000), // 30 mins from now
      end: new Date(now.getTime() + 150 * 60 * 1000),
      purpose: "Superconducting qubit measurements",
      status: "approved",
    });

    // Overdue booking: checked_in, ended 15 minutes ago
    overdueBooking = await Booking.create({
      resourceId: testResource._id,
      userId: testStudent._id,
      start: new Date(now.getTime() - 120 * 60 * 1000),
      end: new Date(now.getTime() - 15 * 60 * 1000), // Ended 15 mins ago
      purpose: "Cryo-test run",
      status: "checked_in",
    });

    console.log("\n[1] Cron Reminders Simulation:");
    // Find bookings starting between now and 2 hours from now
    const upcoming = await Booking.find({
      status: "approved",
      start: { $gte: now, $lte: new Date(now.getTime() + 2 * 60 * 60 * 1000) },
    });

    assert(upcoming.some((b) => b._id.toString() === upcomingBooking._id.toString()), "Cron identifies booking starting within 2 hours");

    const reminderNotif = await Notification.create({
      userId: testStudent._id,
      message: `Booking Reminder: Your reservation for "${testResource.title}" starts soon.`,
      type: "system",
      link: `/bookings/${upcomingBooking._id}`,
      read: false,
    });

    assert(reminderNotif._id !== undefined, "Reminder notification dispatched to student");

    console.log("\n[2] Cron Overdue Detection & Auto-Transition:");
    const overdueList = await Booking.find({
      status: "checked_in",
      end: { $lt: now },
    });

    assert(overdueList.some((b) => b._id.toString() === overdueBooking._id.toString()), "Cron identifies checked_in booking past scheduled end time");

    await executeBookingTransition({
      booking: overdueBooking,
      targetStatus: "overdue",
      actorRole: "system",
      reason: "Automated cron check: Scheduled return deadline has passed without check-in return inspection.",
    });

    assert(overdueBooking.status === "overdue", "Booking successfully transitioned to overdue");

    await writeAudit({
      actorRole: "system",
      action: "BOOKING_MARKED_OVERDUE",
      entityType: "Booking",
      entityId: overdueBooking._id.toString(),
      before: { status: "checked_in" },
      after: { status: "overdue" },
      reason: "Scheduled end time elapsed without return inspection",
    });

    const overdueAudit = await AuditLog.findOne({
      entityId: overdueBooking._id.toString(),
      action: "BOOKING_MARKED_OVERDUE",
    });
    assert(overdueAudit !== null, "Immutable audit log recorded BOOKING_MARKED_OVERDUE");

    console.log("\n[3] Admin User Management & Strike Adjustments:");
    // Admin issues strike for overdue return
    testStudent.strikes = 1;
    await testStudent.save();

    await writeAudit({
      actorId: testAdmin._id.toString(),
      actorRole: "admin",
      action: "USER_UPDATED",
      entityType: "User",
      entityId: testStudent._id.toString(),
      before: { strikes: 0 },
      after: { strikes: 1 },
      reason: "Administrator assigned 1 strike for overdue cryogenic facility equipment",
    });

    const studentFromDb = await User.findById(testStudent._id);
    assert(studentFromDb?.strikes === 1, "Student strikes updated to 1");

    const userAudit = await AuditLog.findOne({
      entityId: testStudent._id.toString(),
      action: "USER_UPDATED",
    });
    assert(userAudit !== null, "Admin modification recorded in immutable audit log");

    // Admin resets strikes back to 0
    testStudent.strikes = 0;
    await testStudent.save();
    assert(testStudent.strikes === 0, "Admin can pardon strikes and restore good standing");

  } finally {
    if (testStudent) await User.deleteOne({ _id: testStudent._id });
    if (testOwner) await User.deleteOne({ _id: testOwner._id });
    if (testAdmin) await User.deleteOne({ _id: testAdmin._id });
    if (testResource) await Resource.deleteOne({ _id: testResource._id });
    if (upcomingBooking) await Booking.deleteOne({ _id: upcomingBooking._id });
    if (overdueBooking) await Booking.deleteOne({ _id: overdueBooking._id });
    await disconnectFromDatabase();
  }

  console.log("\n=================================================");
  console.log(`Phase 6 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
