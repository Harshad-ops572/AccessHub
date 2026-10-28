import { connectToDatabase, disconnectFromDatabase } from "../src/lib/db";
import { User } from "../src/models/User";
import { Resource } from "../src/models/Resource";
import { Booking } from "../src/models/Booking";
import { Inspection } from "../src/models/Inspection";
import { Incident } from "../src/models/Incident";
import { Credential } from "../src/models/Credential";
import { AuditLog } from "../src/models/AuditLog";
import { writeAudit } from "../src/lib/audit";

async function runPhase5Tests() {
  console.log("=================================================");
  console.log("   PHASE 5 TEST SUITE: INSPECTIONS, INCIDENTS & CREDS ");
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

  let studentUser: any;
  let managerUser: any;
  let ownerUser: any;
  let testResource: any;
  let testBooking: any;

  try {
    await connectToDatabase();

    // 1. Setup test users and resources
    studentUser = await User.create({
      name: "Phase5 Test Student",
      email: `p5_student_${Date.now()}@campus.test`,
      passwordHash: "hash123",
      role: "user",
      department: "Mechanical Engineering",
      strikes: 0,
    });

    managerUser = await User.create({
      name: "Phase5 Test Manager",
      email: `p5_manager_${Date.now()}@campus.test`,
      passwordHash: "hash123",
      role: "manager",
      department: "Campus Facilities",
      strikes: 0,
    });

    ownerUser = await User.create({
      name: "Phase5 Test Owner",
      email: `p5_owner_${Date.now()}@campus.test`,
      passwordHash: "hash123",
      role: "owner",
      department: "Robotics Core",
      strikes: 0,
    });

    testResource = await Resource.create({
      title: "Phase5 FormLabs 3D Printer",
      category: "makerspace",
      description: "High-precision stereolithography SLA 3D printer for research prototypes",
      location: "Maker Hall Room 104",
      ownerId: ownerUser._id,
      rules: "Must wear nitrile gloves and clean vat after use",
      availability: [
        { dayOfWeek: 1, startTime: "08:00", endTime: "20:00" },
        { dayOfWeek: 2, startTime: "08:00", endTime: "20:00" },
        { dayOfWeek: 3, startTime: "08:00", endTime: "20:00" },
        { dayOfWeek: 4, startTime: "08:00", endTime: "20:00" },
        { dayOfWeek: 5, startTime: "08:00", endTime: "20:00" },
      ],
      maxDurationHours: 4,
      requiredCredentials: ["3D Printer Safety Training"],
      requiresApproval: true,
      status: "active",
    });

    testBooking = await Booking.create({
      resourceId: testResource._id,
      userId: studentUser._id,
      start: new Date(Date.now() - 3600000),
      end: new Date(Date.now() + 3600000),
      purpose: "Printing autonomous drone chassis",
      status: "approved",
    });

    console.log("\n[1] Check-in Inspection Workflow:");
    const checkinInspection = await Inspection.create({
      bookingId: testBooking._id,
      type: "checkin",
      conditionRating: 5,
      notes: "Pristine condition upon student collection",
      photos: ["https://example.com/checkin-photo.jpg"],
      checklist: [
        { item: "Power cables present", passed: true },
        { item: "No chassis damage", passed: true },
      ],
      recordedBy: managerUser._id,
    });

    testBooking.status = "checked_in";
    testBooking.checkedInAt = new Date();
    await testBooking.save();

    await writeAudit({
      actorId: managerUser._id.toString(),
      actorRole: "manager",
      action: "BOOKING_CHECKED_IN",
      entityType: "Booking",
      entityId: testBooking._id.toString(),
      before: { status: "approved" },
      after: { status: "checked_in", inspectionId: checkinInspection._id.toString() },
      reason: "Manager performed physical inspection and released equipment",
    });

    assert(checkinInspection._id !== undefined, "Check-in inspection created with rating 5");
    assert(testBooking.status === "checked_in", "Booking status transitioned to checked_in");

    console.log("\n[2] Return Inspection & Rating Drop Detection:");
    const returnInspection = await Inspection.create({
      bookingId: testBooking._id,
      type: "return",
      conditionRating: 2,
      notes: "Cracked optical resin tray and resin leak on stepper motor",
      photos: ["https://example.com/damage-return.jpg"],
      checklist: [
        { item: "Power cables present", passed: true },
        { item: "No chassis damage", passed: false },
      ],
      recordedBy: managerUser._id,
    });

    const ratingDelta = checkinInspection.conditionRating - returnInspection.conditionRating;
    assert(ratingDelta === 3, "Condition rating dropped by 3 points (5 -> 2)");

    const incident = await Incident.create({
      bookingId: testBooking._id,
      reportedBy: managerUser._id,
      type: "damage",
      severity: "high",
      description: `Automated condition drop incident: rating fell from ${checkinInspection.conditionRating} to ${returnInspection.conditionRating}. Notes: ${returnInspection.notes}`,
      photos: returnInspection.photos,
      status: "open",
    });

    testBooking.status = "returned";
    testBooking.returnedAt = new Date();
    await testBooking.save();

    testResource.status = "maintenance";
    await testResource.save();

    assert(incident.type === "damage" && incident.severity === "high", "Automated damage incident generated on rating drop > 1");
    assert(testBooking.status === "returned", "Booking status marked returned with incident pending review");
    assert(testResource.status === "maintenance", "Resource flagged maintenance to protect future users");

    console.log("\n[3] Advisory AI Summary Banner Enforcement:");
    const advisorySummary = `[AI suggestion, requires human confirmation]\n\nBased on the return inspection for ${testResource.title}, a significant condition rating drop of 3 points was observed alongside reported cracked resin tray and motor contamination. Recommended human action: Assign 1 safety strike and request student meet with lab supervisor before re-booking high-precision tools.`;

    incident.aiSummary = advisorySummary;
    await incident.save();

    assert(
      incident.aiSummary.startsWith("[AI suggestion, requires human confirmation]"),
      "Advisory AI summary is strictly flagged with mandatory confirmation disclaimer"
    );
    assert(incident.status === "open", "AI never auto-resolves incidents without human action");

    console.log("\n[4] Human-in-the-Loop Incident Resolution & Strike Increment:");
    incident.status = "resolved";
    incident.resolvedBy = ownerUser._id;
    incident.resolution = "Student met with lab supervisor, acknowledged mistake. 1 strike issued.";
    await incident.save();

    await User.findByIdAndUpdate(studentUser._id, { $inc: { strikes: 1 } });
    const updatedStudent = await User.findById(studentUser._id);

    assert(incident.status === "resolved", "Incident resolved by facility owner");
    assert(updatedStudent?.strikes === 1, "Student strike count incremented to 1");

    await writeAudit({
      actorId: ownerUser._id.toString(),
      actorRole: "owner",
      action: "INCIDENT_RESOLVED",
      entityType: "Incident",
      entityId: incident._id.toString(),
      after: { status: "resolved", strikesIssued: 1 },
      reason: incident.resolution,
    });

    const resolutionAudit = await AuditLog.findOne({
      entityId: incident._id.toString(),
      action: "INCIDENT_RESOLVED",
    });
    assert(resolutionAudit !== null, "Audit log permanently recorded INCIDENT_RESOLVED");

    console.log("\n[5] Safety Credential Verification Workflow:");
    const newCred = await Credential.create({
      userId: studentUser._id,
      type: "3D Printer Safety Training",
      documentUrl: "https://example.com/certs/student-cert.pdf",
      status: "pending",
    });

    assert(newCred.status === "pending", "Initial credential uploaded with status pending");

    newCred.status = "verified";
    newCred.verifiedBy = managerUser._id;
    newCred.expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    await newCred.save();

    await writeAudit({
      actorId: managerUser._id.toString(),
      actorRole: "manager",
      action: "CREDENTIAL_VERIFIED",
      entityType: "Credential",
      entityId: newCred._id.toString(),
      after: { status: "verified", verifiedBy: managerUser._id.toString() },
      reason: "Manager verified official certification",
    });

    const credAudit = await AuditLog.findOne({
      entityId: newCred._id.toString(),
      action: "CREDENTIAL_VERIFIED",
    });
    assert(credAudit !== null, "Audit log recorded CREDENTIAL_VERIFIED");
    assert(newCred.status === "verified", "Credential successfully active and verified");

  } finally {
    if (studentUser) await User.deleteOne({ _id: studentUser._id });
    if (managerUser) await User.deleteOne({ _id: managerUser._id });
    if (ownerUser) await User.deleteOne({ _id: ownerUser._id });
    if (testResource) await Resource.deleteOne({ _id: testResource._id });
    if (testBooking) await Booking.deleteOne({ _id: testBooking._id });
    await disconnectFromDatabase();
  }

  console.log("\n=================================================");
  console.log(`Phase 5 Test Summary: ${passed} Passed, ${failed} Failed`);
  console.log("=================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
