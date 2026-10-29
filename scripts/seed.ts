import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "../src/lib/db";
import { User } from "../src/models/User";
import { Resource } from "../src/models/Resource";
import { Credential } from "../src/models/Credential";
import { Booking } from "../src/models/Booking";
import { Waitlist } from "../src/models/Waitlist";
import { Inspection } from "../src/models/Inspection";
import { Incident } from "../src/models/Incident";
import { Notification } from "../src/models/Notification";
import { AuditLog } from "../src/models/AuditLog";
import { writeAudit } from "../src/lib/audit";

async function seed() {
  console.log("=================================================");
  console.log("   CAMPUSSHARE SEED SCRIPT (DEMO MVP DATA)       ");
  console.log("=================================================");

  await connectToDatabase();
  const dbHost = mongoose.connection.host || "unknown";
  console.log(`✓ Connected to MongoDB host: ${dbHost}`);

  // Clear existing collections for a pristine evaluation state
  await Promise.all([
    User.deleteMany({}),
    Resource.deleteMany({}),
    Credential.deleteMany({}),
    Booking.deleteMany({}),
    Waitlist.deleteMany({}),
    Inspection.deleteMany({}),
    Incident.deleteMany({}),
    Notification.deleteMany({}),
    AuditLog.deleteMany({}),
  ]);
  console.log("✓ Cleared existing collections");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const admin = await User.create({
    name: "Admin",
    email: "admin@campus.test",
    passwordHash,
    role: "admin",
    department: "Campus Academic Affairs",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 0,
  });

  const ownerEng = await User.create({
    name: "Owner (Engineering)",
    email: "owner.eng@campus.test",
    passwordHash,
    role: "owner",
    department: "Mechanical & Robotics Eng",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 0,
  });

  const ownerMedia = await User.create({
    name: "Owner (Media)",
    email: "owner.media@campus.test",
    passwordHash,
    role: "owner",
    department: "Media & Digital Arts",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 0,
  });

  const manager = await User.create({
    name: "Manager",
    email: "manager@campus.test",
    passwordHash,
    role: "manager",
    department: "Central Makerspace Operations",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 0,
  });

  const studentA = await User.create({
    name: "Student A",
    email: "student.a@campus.test",
    passwordHash,
    role: "user",
    department: "Computer Science",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 2,
  });

  const studentB = await User.create({
    name: "Student B",
    email: "student.b@campus.test",
    passwordHash,
    role: "user",
    department: "Biomedical Engineering",
    verificationStatus: "verified",
    strikes: 0,
    weeklyHoursUsed: 0,
  });

  const studentC = await User.create({
    name: "Student C",
    email: "student.c@campus.test",
    passwordHash,
    role: "user",
    department: "Electrical Engineering",
    verificationStatus: "verified",
    strikes: 1, // Has 1 penalty strike
    weeklyHoursUsed: 8, // Already at default 8h weekly quota limit
  });

  console.log("✓ Seeded 7 Users across 4 RBAC roles");

  // 2. Seed Credentials
  // Liam (student.a): fully eligible
  await Credential.create([
    {
      userId: studentA._id,
      type: "3D Printer Safety Certification",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      status: "verified",
      verifiedBy: manager._id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    {
      userId: studentA._id,
      type: "Media Lab Gear Certification",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      status: "verified",
      verifiedBy: manager._id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    {
      userId: studentA._id,
      type: "Electronics & High-Voltage Protocol",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      status: "verified",
      verifiedBy: manager._id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    {
      userId: studentA._id,
      type: "Cleanroom Level 1 Access",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      status: "verified",
      verifiedBy: manager._id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
  ]);

  // Maya (student.b): Only has Media Lab gear, missing 3D Printer Safety
  await Credential.create({
    userId: studentB._id,
    type: "Media Lab Gear Certification",
    documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
    status: "verified",
    verifiedBy: manager._id,
    expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  });

  // Jordan (student.c): Has 3D Printer and Cleanroom, but hits quota limit
  await Credential.create([
    {
      userId: studentC._id,
      type: "3D Printer Safety Certification",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      status: "verified",
      verifiedBy: manager._id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
    {
      userId: studentC._id,
      type: "Cleanroom Level 1 Access",
      documentUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80",
      status: "verified",
      verifiedBy: manager._id,
      expiresAt: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    },
  ]);

  console.log("✓ Seeded Student Credentials (verified & deliberate missing conditions)");

  // 3. Seed 9 Diverse Resources
  const standardAvailability = [
    { dayOfWeek: 1, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "19:00" },
    { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
  ];

  const resourcesData = [
    {
      title: "Ultimaker S5 Industrial Dual-Extrusion 3D Printer",
      category: "makerspace",
      description: "Dual extrusion 3D printer with composite material handling, heated glass bed, and air manager filter for engineering prototypes and rapid casting models.",
      location: "Makerspace Central, Room 102",
      photos: [
        "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerEng._id,
      rules: "Always calibrate build plate before starting. Only approved PLA, Tough PLA, and PVA filaments allowed. Clean nozzle after job completion.",
      availability: standardAvailability,
      maxDurationHours: 4,
      requiredCredentials: ["3D Printer Safety Certification"],
      requiresApproval: true,
      status: "active",
    },
    {
      title: "Tektronix 4-Channel 1GHz Digital Mixed-Signal Oscilloscope",
      category: "testing",
      description: "High bandwidth digital storage oscilloscope with 5 GS/s sampling rate, 16 digital logic channels, and protocol decoding for embedded hardware diagnostics.",
      location: "Electronics & Robotics Lab, Room 215",
      photos: [
        "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerEng._id,
      rules: "Never exceed 300V CAT II input voltage. ESD grounding wrist straps are mandatory at this bench.",
      availability: standardAvailability,
      maxDurationHours: 3,
      requiredCredentials: ["Electronics & High-Voltage Protocol"],
      requiresApproval: true,
      status: "active",
    },
    {
      title: "Sony Alpha A7 IV 4K Production Cinema Camera Kit",
      category: "camera",
      description: "33MP Full-Frame mirrorless camera with 4K 60p 10-bit 4:2:2 video capture, 24-70mm f/2.8 G-Master lens, carbon fiber tripod, and dual wireless lavalier kit.",
      location: "Media Arts Production Studio B, Room 304",
      photos: [
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerMedia._id,
      rules: "Equipment must be returned with both batteries fully charged and memory cards formatted. Report any lens dust or scratch immediately.",
      availability: standardAvailability,
      maxDurationHours: 6,
      requiredCredentials: ["Media Lab Gear Certification"],
      requiresApproval: true,
      status: "active",
    },
    {
      title: "Acoustic Podcast & Voiceover Isolation Sound Booth",
      category: "room",
      description: "Treated isolation booth with dual Shure SM7B microphones, Cloudlifter preamps, Focusrite Scarlett 18i8 audio interface, and Pro Tools recording suite.",
      location: "Media Arts Complex, Room 108",
      photos: [
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerMedia._id,
      rules: "No liquids or food permitted inside the booth under any circumstance. Ensure all microphone boom arms are unlocked when adjusting.",
      availability: standardAvailability,
      maxDurationHours: 2,
      requiredCredentials: [], // Open to all verified campus members
      requiresApproval: false,
      status: "active",
    },
    {
      title: "NVIDIA H100 80GB SXM5 Deep Learning Workstation",
      category: "computer",
      description: "Liquid-cooled compute node with 80GB HBM3 VRAM, 128-core AMD EPYC processor, 512GB DDR5 RAM, and pre-configured PyTorch/CUDA environments.",
      location: "AI Innovation Cluster, Room 410",
      photos: [
        "https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerEng._id,
      rules: "Batch jobs must be scheduled via SLURM. Heavy jobs exceeding memory quota will be suspended automatically.",
      availability: standardAvailability,
      maxDurationHours: 8,
      requiredCredentials: ["Cleanroom Level 1 Access"],
      requiresApproval: true,
      status: "active",
    },
    {
      title: "Epilog Fusion Pro 48 CO2 Precision Laser Cutter",
      category: "makerspace",
      description: "120-Watt CO2 laser with 48 x 36 inch engraving table, IRIS camera positioning system, and high-flow HEPA fume extraction.",
      location: "Advanced Fabrication Lab, Room 105",
      photos: [
        "/laser-cutter.jpg",
      ],
      ownerId: ownerEng._id,
      rules: "NEVER leave the laser unattended while firing. Only acrylic, wood, cardboard, and anodized aluminum allowed. PVC and vinyl are strictly forbidden.",
      availability: standardAvailability,
      maxDurationHours: 2,
      requiredCredentials: ["3D Printer Safety Certification"],
      requiresApproval: true,
      status: "active",
    },
    {
      title: "Olympus IX83 Inverted Fluorescence Microscope",
      category: "lab",
      description: "Motorized inverted research microscope with live cell incubation chamber, DAPI/FITC/TRITC filter cubes, and sCMOS monochromatic camera.",
      location: "Bio-Imaging Core Facility, Room 220",
      photos: [
        "https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerEng._id,
      rules: "Clean 60x and 100x immersion oil lenses with lens paper and ether-alcohol solution after every run. Turn off mercury burner lamp when finished.",
      availability: standardAvailability,
      maxDurationHours: 3,
      requiredCredentials: ["Cleanroom Level 1 Access"],
      requiresApproval: true,
      status: "active",
    },
    {
      title: "Design Sprint Collaboration Studio with SmartGlass",
      category: "room",
      description: "Interactive team brainstorming space equipped with a 75-inch Microsoft Surface Hub, modular whiteboards, and video-conference acoustics.",
      location: "Entrepreneurship & Venture Hub, Room 501",
      photos: [
        "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerMedia._id,
      rules: "Reset mobile furniture to layout schematic before leaving. Wipe all glass boards completely.",
      availability: standardAvailability,
      maxDurationHours: 4,
      requiredCredentials: [],
      requiresApproval: false,
      status: "active",
    },
    {
      title: "High-Demand Zeiss Crossbeam Nano-Scanning Electron Microscope (SEM)",
      category: "lab",
      description: "Field-emission SEM with focused ion beam (FIB) for sub-nanometer resolution imaging, elemental EDS mapping, and 3D micro-tomography.",
      location: "Nanotechnology Complex, Sub-Basement B12",
      photos: [
        "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
      ],
      ownerId: ownerEng._id,
      rules: "High vacuum chamber operations only. Samples must be thoroughly desiccated and sputter-coated with gold-palladium before loading.",
      availability: standardAvailability,
      maxDurationHours: 4,
      requiredCredentials: ["Cleanroom Level 1 Access"],
      requiresApproval: true,
      status: "active",
    },
  ];

  const createdResources = await Resource.insertMany(resourcesData);
  console.log(`✓ Seeded ${createdResources.length} diverse Campus Resources`);

  // 4. Create High-Demand Resource Congestion & Waitlist Scenario
  // We use the Zeiss Nano-SEM (resource index 8)
  const highDemandResource = createdResources[8];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const tomorrowEnd = new Date(tomorrow);
  tomorrowEnd.setHours(14, 0, 0, 0);

  // Active Approved Booking for student.a
  const approvedBooking = await Booking.create({
    userId: studentA._id,
    resourceId: highDemandResource._id,
    start: tomorrow,
    end: tomorrowEnd,
    purpose: "Scanning electron microscopy characterization of graphene oxide aerogels for thesis.",
    status: "approved",
    decisionReason: "Approved by Owner (Engineering): verified thesis milestone and safety clearance.",
    eligibilitySnapshot: {
      eligible: true,
      evaluatedAt: new Date(),
      checks: [
        { requirement: "Cleanroom Level 1 Access", met: true, reason: "Verified credential active" },
      ],
    },
    fairnessSnapshot: {
      weeklyHoursBefore: 2,
      activeBookingsCount: 1,
      strikes: 0,
    },
  });

  // Seed Check-in Inspection on an existing earlier booking to demo condition tracking
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(14, 0, 0, 0);
  const yesterdayEnd = new Date(yesterday);
  yesterdayEnd.setHours(17, 0, 0, 0);

  const completedBooking = await Booking.create({
    userId: studentA._id,
    resourceId: createdResources[0]._id, // 3D Printer
    start: yesterday,
    end: yesterdayEnd,
    purpose: "Robotics end-effector mounting bracket printing",
    status: "returned",
    decisionReason: "Standard lab booking",
    eligibilitySnapshot: {
      eligible: true,
      evaluatedAt: yesterday,
      checks: [
        { requirement: "3D Printer Safety Certification", met: true, reason: "Verified active" },
      ],
    },
  });

  // Check-in condition record
  await Inspection.create({
    bookingId: completedBooking._id,
    type: "checkin",
    conditionRating: 5,
    checklist: [
      { item: "Nozzle clear of debris", passed: true },
      { item: "Glass plate clean and level", passed: true },
      { item: "Emergency stop functioning", passed: true },
    ],
    notes: "Equipment in pristine condition upon handover.",
    photos: ["https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80"],
    recordedBy: manager._id,
  });

  // Return condition record with minor rating drop (rating: 4)
  await Inspection.create({
    bookingId: completedBooking._id,
    type: "return",
    conditionRating: 4,
    checklist: [
      { item: "Nozzle clear of debris", passed: true },
      { item: "Glass plate clean and level", passed: true },
      { item: "Emergency stop functioning", passed: true },
      { item: "Filament spool properly secured", passed: false },
    ],
    notes: "Minor adhesive residue on left glass corner. Filament spool was not recoiled.",
    photos: ["https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?auto=format&fit=crop&w=400&q=80"],
    recordedBy: manager._id,
  });

  // Seed Waitlist entries on tomorrow's slot for the Zeiss SEM:
  // student.b (Score: 0.82) is ranked ahead of student.c (Score: 0.35 because student.c has 8h used and 1 strike)
  await Waitlist.create([
    {
      resourceId: highDemandResource._id,
      userId: studentB._id,
      slotStart: tomorrow,
      slotEnd: tomorrowEnd,
      priorityScore: 0.82,
      scoreBreakdown: {
        recentUsage: 0,
        strikes: 0,
        waitTime: 4.5,
      },
      status: "active",
    },
    {
      resourceId: highDemandResource._id,
      userId: studentC._id,
      slotStart: tomorrow,
      slotEnd: tomorrowEnd,
      priorityScore: 0.35,
      scoreBreakdown: {
        recentUsage: 8, // Penalized by 8 weekly hours
        strikes: 1,     // Penalized by 1 strike
        waitTime: 2.0,
      },
      status: "active",
    },
  ]);

  console.log("✓ Seeded High-Demand Slot Booking & Waitlist entries (Fairness Demo)");

  // 5. Seed Initial Audit Logs
  await writeAudit({
    actorId: ownerEng._id.toString(),
    actorRole: "owner",
    action: "RESOURCE_CREATED",
    entityType: "Resource",
    entityId: highDemandResource._id.toString(),
    after: { title: highDemandResource.title, location: highDemandResource.location },
    reason: "Initial departmental equipment provisioning",
  });

  await writeAudit({
    actorId: manager._id.toString(),
    actorRole: "manager",
    action: "CREDENTIAL_VERIFIED",
    entityType: "Credential",
    entityId: studentA._id.toString(),
    after: { user: studentA.email, credential: "3D Printer Safety Certification" },
    reason: "Practical safety exam completed in person",
  });

  await writeAudit({
    actorId: ownerEng._id.toString(),
    actorRole: "owner",
    action: "BOOKING_APPROVED",
    entityType: "Booking",
    entityId: approvedBooking._id.toString(),
    after: { status: "approved", slot: `${tomorrow.toISOString()} - ${tomorrowEnd.toISOString()}` },
    reason: "Approved by Owner (Engineering): verified thesis milestone and safety clearance.",
  });

  console.log("✓ Seeded Initial Audit Trail entries");

  // Print Demo Credentials
  console.log("\n=================================================");
  console.log("            DEMO CREDENTIALS SUMMARY             ");
  console.log("=================================================");
  console.log("All accounts share password: password123\n");
  console.log("| Role     | Email                   | Name                | Status / Notes                    |");
  console.log("|----------|-------------------------|---------------------|-----------------------------------|");
  console.log("| admin    | admin@campus.test       | Admin               | Global controls & full audit log  |");
  console.log("| owner    | owner.eng@campus.test   | Owner (Engineering) | Engineering Lab / 3D printer owner|");
  console.log("| owner    | owner.media@campus.test | Owner (Media)       | Media Lab / Camera studio owner   |");
  console.log("| manager  | manager@campus.test     | Manager             | Check-in/return, verify documents |");
  console.log("| user     | student.a@campus.test   | Student A           | Fully verified & eligible         |");
  console.log("| user     | student.b@campus.test   | Student B           | MISSING 3D printer safety cert    |");
  console.log("| user     | student.c@campus.test   | Student C           | AT 8h QUOTA LIMIT (1 strike)      |");
  const userCount = await User.countDocuments();
  const resourceCount = await Resource.countDocuments();
  const bookingCount = await Booking.countDocuments();

  console.log("=================================================");
  console.log(`Database Host: ${dbHost}`);
  console.log(`Summary: Created ${userCount} users, ${resourceCount} resources, and ${bookingCount} bookings.`);
  console.log("=================================================\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
