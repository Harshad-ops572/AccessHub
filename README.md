# 🎓 AccessHub — Trusted Campus Resource Sharing Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS%204-38bdf8?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2B%20Mongoose-47a248?style=flat&logo=mongodb)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/E2E%20Tests-100%25%20Passing-brightgreen?style=flat)](https://github.com/)

**AccessHub** is an end-to-end trusted resource-sharing platform engineered for a single university campus. It connects multiple departmental equipment owners (cleanrooms, robotics labs, makerspaces, high-speed camera gear) with students and early-stage research teams.

It enforces **hard safety eligibility**, **transactional conflict prevention**, **plain-language explainable fair allocation**, **before-and-after condition inspections**, **human-in-the-loop incident governance**, and an **immutable append-only audit trail**.

---

## ⚡ Quick Start (Ready for Hackathon Judging)

### 1. Installation
```bash
git clone https://github.com/<your-username>/accesshub.git
cd accesshub
npm install
```

### 2. Configure Environment (.env.local)
A pre-configured development environment is ready. If running with custom MongoDB Atlas credentials, copy `.env.example` to `.env.local` or provide your own:
```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/accesshub?retryWrites=true&w=majority
NEXTAUTH_SECRET=accesshub_super_secret_jwt_key_2026_hackathon_ready
NEXTAUTH_URL=http://localhost:3000
CRON_SECRET=accesshub_cron_secret_token_123
```
> **Offline Support**: If no Atlas URI is provided, AccessHub automatically spins up an in-memory MongoDB replica set with real transactional session support (`mongodb-memory-server`).

### 3. Seed Demo Data
Populate 7 pre-configured user personas, 9 diverse cross-department resources, active bookings, waitlists, and historical audit entries:
```bash
npm run seed
```

### 4. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser. Use the 1-click quick login switcher on `/login` to log into any role instantly.

### 5. Run Verification Test Suite
```bash
npm test
```
Runs all 5 end-to-end verification suites (State Machine, Conflict Detection, Waitlist Scoring, Condition Records, Cron & Governance) with 100% pass rate.

---

## 🧭 5-Minute Judge Walkthrough

All test accounts share the password: `password123`. The `/login` page provides **1-click instant login buttons** for every account.

| Step | Action & Persona | Route | What to Observe |
|:---|:---|:---|:---|
| **1** | **Owner Equipment Listing**<br>`owner.eng@campus.test` | `/owner/resources/new` | Owner lists a new high-demand tool (e.g. *Industrial Metal 3D Printer*), sets operating windows, and marks *"3D Printer Safety Training"* as mandatory. |
| **2** | **Student Eligibility Gate**<br>`student.b@campus.test` | `/resources` | Student B attempts to book the printer. The **Eligibility Engine** detects missing credentials and prevents booking, explaining the exact reason with an upload prompt. |
| **3** | **Credential Upload & Verification**<br>`student.b` $\to$ `manager@campus.test` | `/credentials`<br>$\to$ `/manager/credentials` | Student B uploads training certificate. Facility Manager opens the **Verification Queue**, inspects document, and clicks **Approve**. Audit trail records `CREDENTIAL_VERIFIED`. |
| **4** | **Booking Request & Approval**<br>`student.b` $\to$ `owner.eng` | `/resources/[id]/book`<br>$\to$ `/owner/queue` | Student B now passes eligibility. Submits booking request. Owner opens Queue and approves with recorded justification. |
| **5** | **Check-in Condition Inspection**<br>`manager@campus.test` | `/manager/checkin` | Manager performs physical inspection at desk, passes 4-point checklist, rates equipment **5/5 Stars**, records photo URL, and issues equipment. Booking status becomes `checked_in`. |
| **6** | **Return & Condition Drop Detection**<br>`manager@campus.test` | `/manager/checkin` | Student returns equipment. Manager records condition rating **2/5 Stars** with notes of a cracked resin tray. System flags **-3 Star Rating Drop** and auto-logs a High-Severity Damage Incident. |
| **7** | **Advisory AI & Human Resolution**<br>`owner.eng@campus.test` | `/owner/incidents` | Owner views incident. **Advisory AI Summary** analyzes damage with mandatory banner `[AI suggestion, requires human confirmation]`. Owner reviews and resolves incident, applying 1 safety strike. |
| **8** | **Fair Allocation & Waitlist Priority**<br>`student.c@campus.test` | `/resources/[id]/book` | Student C (at 8h quota limit) attempts booking. System displays **Plain-Language Explain Decision Panel** with exact waitlist priority formula breakdown ($w_1, w_2, w_3$). |
| **9** | **Immutable Audit Trail**<br>`admin@campus.test` | `/admin/audit` | Admin inspects tamper-proof audit log showing full chronological lifecycle: `BOOKING_CREATED` $\to$ `BOOKING_APPROVED` $\to$ `BOOKING_CHECKED_IN` $\to$ `BOOKING_RETURNED` $\to$ `INCIDENT_RESOLVED`. |

---

## 🏛️ Architectural Highlights

### 1. Centralized Booking State Machine
Every booking transition is validated server-side by `src/services/bookingStateMachine.ts`:
```
requested ──> eligibility_check ──> pending_review ──> approved ──> checked_in ──> returned ──> closed
     │                  │                 │                │            │             │
     └──> rejected      └──> waitlisted   └──> cancelled   └──> overdue └──> disputed
```
- Unauthorized transitions (e.g. bypassing check-in, self-approvals, resurrecting cancelled bookings) are strictly rejected.

### 2. Transactional Overlap Prevention (`conflictDetector.ts`)
- Uses MongoDB replica set transactions (`session.withTransaction`) to eliminate race conditions.
- If a time conflict occurs, the system automatically computes adjacent free intervals (e.g. earlier slot, later slot, tomorrow) and suggests them to the user.

### 3. Transparent, Explainable Fair Allocation (`fairnessService.ts`)
Waitlist queue positions are computed deterministically using client-safe mathematical weights:
$$\text{Priority Score} = w_1 \cdot \left(\frac{1}{1 + \text{hoursUsedLast30Days}}\right) + w_2 \cdot \text{waitHours} - w_3 \cdot \text{strikes}$$
- Default weights: $w_1 = 0.5$ (Low-usage priority), $w_2 = 0.3$ (Wait time seniority), $w_3 = 0.2$ (Penalty strike deduction).
- Every waitlisted student can inspect the **Explain Decision Panel** to understand their position in line.

### 4. Human-in-the-Loop Incident Governance
- AI synthesis is strictly **advisory** and always labeled:
  `[AI suggestion, requires human confirmation]`
- AI never applies penalties or suspends accounts autonomously. All disciplinary actions and strike increments require affirmative human review.

### 5. Append-Only Audit Trail (`src/lib/audit.ts`)
- Immutably logs every state mutation across all 9 database entities.
- Zero update or delete operations are exposed on the audit collection.

---

## 🧪 Automated Verification Suite

Run all verification tests with:
```bash
npm test
```
The suite runs 5 comprehensive integration tests covering all critical paths:
1. `tests/phase3-verification.test.ts`: 16 state machine transitions and RBAC restrictions.
2. `tests/conflict-detection.test.ts`: Transactional overlap prevention and slot suggestions.
3. `tests/fairness-waitlist.test.ts`: Quota meter math, priority score formula, and penalty strikes.
4. `tests/phase5-verification.test.ts`: Physical condition inspections, rating delta calculation, incident logging, and credential verification.
5. `tests/phase6-verification.test.ts`: Cron reminder triggers, overdue transitions, and administrative governance.

---

## 👥 Personas & Credentials Summary

| Email | Password | Role | Campus Department |
|:---|:---|:---|:---|
| `admin@campus.test` | `password123` | **Admin** | Campus Operations |
| `owner.eng@campus.test` | `password123` | **Owner** | Mechanical & Robotics Lab |
| `owner.media@campus.test` | `password123` | **Owner** | Media Arts & Production |
| `manager@campus.test` | `password123` | **Manager** | Central Facility Check-in Desk |
| `student.a@campus.test` | `password123` | **User** | Bioengineering (Clean Record) |
| `student.b@campus.test` | `password123` | **User** | Robotics (Missing Credentials) |
| `student.c@campus.test` | `password123` | **User** | Computer Science (High Quota User) |

---

## 🛠️ Tech Stack & Dependencies

- **Frontend & Routing**: Next.js 16 (App Router), React 19, Tailwind CSS 4, Lucide Icons.
- **Backend & Database**: Next.js Route Handlers, MongoDB Atlas + Mongoose 9 (cached global connection), In-Memory MongoDB Replica Set for offline testing.
- **Authentication**: Auth.js / NextAuth (Credentials provider with role stored in session JWT).
- **Validation**: Zod (shared schemas for client & server).
- **State & Caching**: SWR for real-time polling and instant updates.
- **Testing**: `tsx`, Node child processes, Vitest-compatible test runner.
