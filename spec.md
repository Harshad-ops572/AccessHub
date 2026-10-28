# CampusShare: Product & Technical Specification

> Hackathon problem statement: **Unlock Underused Equipment and Spaces**
> Build window: 48 hours. Stack: Next.js, MongoDB Atlas, Vercel.

---

## 1. Overview

**CampusShare** is a trusted resource-sharing platform for a single college campus. Departments (owners) list underused labs, makerspace tools, cameras and meeting rooms. Students and early-stage teams discover them, prove eligibility, request access, and use them under clear rules. Every important action is recorded in an auditable history.

### 1.1 Goals

- Let a judge complete one full journey, from listing to return, with no manual explanation.
- Handle trust, safety and accountability (eligibility, condition records, incidents).
- Allocate limited resources fairly and explainably.
- Keep humans in control of access, safety and penalty decisions.

### 1.2 Non-goals (documented as future work)

- Payments, deposits and credits processing
- Multi-institution federation
- Real-time chat, native mobile apps
- Hardware access control (door locks, IoT)

### 1.3 Scope decision

One institution, multiple departments as owners. This keeps eligibility rules realistic while avoiding cross-organisation trust complexity.

---

## 2. Users and Roles

| Role | Description | Key permissions |
|---|---|---|
| `user` | Student, researcher or early-stage team member | Browse resources, upload credentials, request/cancel bookings, view own history, report incidents |
| `owner` | Department or lab head who owns resources | Create/edit own resources, review requests, approve/reject/waitlist, resolve incidents on own resources |
| `manager` | Lab technician or staff | Verify credentials, perform check-in and return, record condition, log incidents |
| `admin` | Platform administrator | All permissions, user management, global audit log, override with a recorded reason |

**Rule:** RBAC is enforced server-side on every route and server action. UI hiding is cosmetic only.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| Database | MongoDB Atlas (M0) + Mongoose |
| Auth | Auth.js (NextAuth), credentials provider, role in session |
| Validation | Zod (shared client and server schemas) |
| Storage | Vercel Blob (condition photos, credential documents) |
| Email | Resend |
| Scheduling | Vercel Cron |
| Data fetching | SWR (polling/revalidation, no WebSockets) |
| Calendar | FullCalendar or react-big-calendar |
| AI (optional) | Claude or Gemini API, advisory only |
| Deployment | Vercel |

### 3.1 Platform constraints

- Cache the Mongoose connection on `globalThis` to avoid exhausting connections in serverless.
- Atlas network access must allow `0.0.0.0/0` because Vercel IPs are dynamic.
- Booking creation uses a MongoDB transaction (Atlas M0 is a replica set).
- Vercel functions are stateless and time-limited; keep cron jobs idempotent.

---

## 4. Architecture

```
Browser (Next.js UI, SWR)
        |
Next.js App Router (Route Handlers / Server Actions)
        |-- Auth.js session + RBAC middleware
        |-- Domain services:
        |     eligibility, booking, fairness, waitlist,
        |     inspection, incident, notification, audit
        |-- Zod validation layer
        |
MongoDB Atlas (Mongoose)     Vercel Blob     Resend     AI API
        ^
Vercel Cron (reminders, overdue detection, waitlist promotion)
```

### 4.1 Suggested folder structure

```
/src
  /app
    /(auth)/login, /register
    /(app)/resources, /resources/[id], /bookings, /bookings/[id]
    /(app)/owner/queue, /owner/resources
    /(app)/manager/credentials, /manager/checkin
    /(app)/admin/users, /admin/audit, /admin/incidents
    /api/...  (route handlers)
  /components
  /lib
    db.ts, auth.ts, rbac.ts, audit.ts, blob.ts, mail.ts
  /models        (Mongoose schemas)
  /services      (eligibility, booking, fairness, waitlist, ...)
  /validators    (Zod schemas)
/scripts/seed.ts
/tests
```

---

## 5. Data Model

All collections include `createdAt` and `updatedAt`.

### 5.1 users
| Field | Type | Notes |
|---|---|---|
| name, email | string | email unique |
| passwordHash | string | bcrypt |
| role | enum | `user, owner, manager, admin` |
| department | string | |
| verificationStatus | enum | `unverified, verified` |
| strikes | number | default 0, decays over time |

### 5.2 resources
| Field | Type | Notes |
|---|---|---|
| title, description | string | |
| category | enum | lab, makerspace, camera, room, computer, testing, other |
| location | string | building and room |
| photos | string[] | Blob URLs |
| ownerId | ObjectId | |
| rules | string | usage conditions |
| availability | array | weekly windows (day, startTime, endTime) |
| maxDurationHours | number | per booking |
| requiredCredentials | string[] | credential type keys |
| requiresApproval | boolean | |
| status | enum | `active, maintenance, retired` |

### 5.3 credentials
| Field | Type | Notes |
|---|---|---|
| userId | ObjectId | |
| type | string | e.g. `3d-printer-safety` |
| documentUrl | string | private Blob URL |
| status | enum | `pending, verified, rejected, expired` |
| verifiedBy | ObjectId | |
| expiresAt | date | |

### 5.4 bookings
| Field | Type | Notes |
|---|---|---|
| userId, resourceId | ObjectId | |
| start, end | date | |
| purpose | string | |
| status | enum | see state machine |
| decisionReason | string | shown to user |
| eligibilitySnapshot | object | result at time of request |
| fairnessSnapshot | object | quota usage and score at time of request |

### 5.5 waitlist
`resourceId, userId, slotStart, slotEnd, priorityScore, scoreBreakdown{recentUsage, strikes, waitTime}, status`

### 5.6 inspections
`bookingId, type (checkin|return), conditionRating (1-5), checklist[], notes, photos[], recordedBy`

### 5.7 incidents
`bookingId, type (damage|delay|conflict|other), description, severity (low|medium|high), status (open|under_review|resolved|dismissed), resolution, aiSummary (advisory), resolvedBy`

### 5.8 notifications
`userId, type, message, link, read`

### 5.9 auditLogs (append-only)
`actorId, actorRole, action, entityType, entityId, before, after, reason, timestamp`

**Append-only rule:** no update or delete endpoints exist for `auditLogs`. All writes go through a single `writeAudit()` helper.

### 5.10 Indexes
- `bookings`: compound index on `(resourceId, start, end, status)` for overlap queries
- `users.email`: unique
- `waitlist`: `(resourceId, status, priorityScore)`
- `auditLogs`: `(entityType, entityId, timestamp)`

---

## 6. Booking State Machine

```
requested -> eligibility_check -> pending_review -> approved
                                                 -> rejected
                                                 -> waitlisted -> (promoted) approved
approved -> checked_in -> returned -> closed

Side branches: cancelled (from requested..approved), overdue (from checked_in), disputed (from returned)
```

| From | To | Actor | Condition |
|---|---|---|---|
| requested | eligibility_check | system | automatic |
| eligibility_check | pending_review | system | all requirements met |
| eligibility_check | rejected | system | hard requirement failed (reason shown, user can fix and resubmit) |
| pending_review | approved | owner/admin | no conflict, quota OK |
| pending_review | rejected | owner/admin | reason required |
| pending_review | waitlisted | owner/admin or system | demand exceeds availability |
| waitlisted | approved | system/owner | slot freed, top-ranked entry promoted |
| approved | checked_in | manager/owner | within check-in window |
| checked_in | returned | manager/owner | return inspection recorded |
| returned | closed | system/owner | no open incidents |
| returned | disputed | owner/user | incident raised |
| checked_in | overdue | system (cron) | past end time, no return |
| any pre-checkin | cancelled | user/owner/admin | reason recorded |

**Rule:** invalid transitions are rejected by a single `transition()` function. Every transition writes an audit entry and a notification.

---

## 7. Functional Requirements

### FR-1 Authentication and profiles
- Register and log in with email and password. Seed script provides demo accounts.
- Profile shows department, role, verification status, credentials and quota usage.
- Owners are verified by an admin before they can list resources.

### FR-2 Resource listing (owner)
- Form with title, category, description, location, photos, rules, availability windows, max duration, required credentials, approval requirement.
- Owners can edit or pause only their own resources.
- Listing creation and edits are audited.

### FR-3 Discovery
- Search by keyword. Filter by category, location, availability date and "I'm eligible".
- Resource detail page shows rules, requirements, availability calendar and the user's personal eligibility status.
- Each requirement is marked met or missing with a link to fix it.

### FR-4 Eligibility engine
- Compares `resource.requiredCredentials` to the user's `verified` and non-expired credentials.
- Returns a structured result: `{ eligible, checks: [{ requirement, met, reason }] }`.
- The result is snapshotted onto the booking.

### FR-5 Booking request
- User selects a slot within availability, within `maxDurationHours`, and gives a purpose.
- Server validates input with Zod, runs eligibility, fairness and conflict checks inside a transaction.
- Conflicts are shown with suggested nearby free slots.

### FR-6 Owner review
- Queue lists pending requests with eligibility summary, fairness summary and requester history.
- Owner approves, rejects or waitlists. A reason is mandatory for rejection and waitlisting.

### FR-7 Fair allocation
- Weekly hours quota per user (default 8h) and a cap of 2 active bookings.
- Strikes from no-shows and late returns reduce priority and decay after 30 days.
- Waitlist score (explainable):
  `score = w1 * (1 / (1 + hoursUsedLast30Days)) + w2 * waitHours - w3 * strikes`
  Weights are configurable and displayed in the UI.
- When a booking is cancelled, the top waitlist entry is offered the slot and notified.
- Repeated back-to-back reservations of the same resource by the same user are limited (cooldown rule).

### FR-8 Explain this decision
- Every booking detail page shows a plain-language panel with the decision, the rule that triggered it and the numbers involved.
- Example: "Waitlisted: you have used 8 of 8 hours this week. Your queue position is 2 of 4 (score 0.62)."

### FR-9 Check-in and return
- Manager or owner performs check-in: verifies the user, records the condition rating, checklist, notes and photos.
- Return flow repeats this. The UI shows check-in versus return side by side and flags a rating drop.
- Late returns create a delay incident for human review.

### FR-10 Incidents
- Anyone involved can report damage, delay or conflict with description and photos.
- Owner or admin reviews, resolves or dismisses, and records the outcome.
- Optional AI summary is labelled "AI suggestion, requires human confirmation".
- Strikes or penalties are applied only after human confirmation.

### FR-11 Notifications
- In-app notification centre (polling) plus email via Resend.
- Events: request received, approved, rejected, waitlisted, waitlist promotion, reminder (1 hour before), cancellation, overdue, incident updates.

### FR-12 Scheduled jobs (Vercel Cron)
- Reminder job, overdue detection job, waitlist promotion and credential expiry job.
- Jobs are idempotent and protected by a secret header.

### FR-13 Audit history
- Booking timeline visible to both user and owner.
- Admin audit view with filters by actor, entity, action and date.
- Required audited actions: listing changes, credential verification, approvals, rejections, waitlisting, cancellations, extensions, check-ins, returns, incident reports and resolutions, strikes, admin overrides.

### FR-14 Dashboards
- User: upcoming bookings, quota meter, credentials, notifications.
- Owner: approval queue, resource utilisation, open incidents.
- Manager: today's check-ins and returns, credentials to verify.
- Admin: user list, incident list, audit log.

---

## 8. API Surface (Route Handlers)

| Method | Route | Roles | Purpose |
|---|---|---|---|
| POST | `/api/auth/register` | public | Register |
| GET | `/api/resources` | any | Search and filter |
| POST | `/api/resources` | owner, admin | Create resource |
| GET/PATCH | `/api/resources/:id` | any / owner | Read / update |
| GET | `/api/resources/:id/eligibility` | user | Eligibility check |
| GET | `/api/resources/:id/availability` | any | Free and busy slots |
| POST | `/api/credentials` | user | Upload credential |
| PATCH | `/api/credentials/:id` | manager, admin | Verify or reject |
| POST | `/api/bookings` | user | Create request |
| GET | `/api/bookings` | any | Own or role-scoped list |
| GET | `/api/bookings/:id` | participants, admin | Detail and timeline |
| POST | `/api/bookings/:id/decision` | owner, admin | Approve, reject, waitlist |
| POST | `/api/bookings/:id/cancel` | participants, admin | Cancel |
| POST | `/api/bookings/:id/extend` | user, owner | Request and approve extension |
| POST | `/api/bookings/:id/checkin` | manager, owner | Check-in inspection |
| POST | `/api/bookings/:id/return` | manager, owner | Return inspection |
| POST | `/api/incidents` | participants | Report incident |
| PATCH | `/api/incidents/:id` | owner, admin | Resolve |
| POST | `/api/incidents/:id/summarise` | owner, admin | AI summary (advisory) |
| GET | `/api/notifications` | any | List, mark read |
| GET | `/api/audit` | admin, owner (scoped) | Audit entries |
| GET | `/api/cron/*` | cron secret | Scheduled jobs |
| POST | `/api/uploads` | authenticated | Blob upload |

All handlers: authenticate, authorise by role and ownership, validate with Zod, call a service, return typed errors.

---

## 9. Trust, Safety and Fairness Controls

| Concern | Control |
|---|---|
| Unauthorised access | Server-side RBAC and ownership checks on every endpoint |
| Unverified users | Eligibility engine blocks requests; credentials verified by a human manager |
| Misuse or damage | Before and after condition records, incident workflow, owner review |
| Double booking | Transaction plus overlap query; tested with simultaneous requests |
| Monopolisation | Weekly quota, active booking cap, cooldown, strike-weighted waitlist |
| Opaque decisions | Mandatory reasons, "Explain this decision" panel, visible score breakdown |
| Tampering | Append-only audit log through one helper, no edit or delete endpoints |
| Unsupervised automation | AI is advisory only; penalties and access decisions require a human |

---

## 10. Privacy and Security

- Collect only what is needed: name, email, department, credentials.
- Credential documents are stored privately and visible only to the owner of the document, verifiers and admins.
- Passwords hashed with bcrypt. Secrets only in environment variables.
- Rate-limit login and registration. Sanitise and validate all input.
- Cron endpoints require a secret header.
- Never log passwords, tokens or document contents.
- All demo data is fictional.

---

## 11. Accessibility and UX

- Labelled form fields, visible focus states, keyboard-navigable flows.
- Sufficient colour contrast, status shown with text and icon, not colour alone.
- Responsive layout that works on mobile.
- Clear empty states, loading states and plain-language error messages.

---

## 12. Seed Data (`npm run seed`)

| Account | Role | Notes |
|---|---|---|
| admin@campus.test | admin | |
| owner.eng@campus.test | owner | Engineering lab |
| owner.media@campus.test | owner | Media studio |
| manager@campus.test | manager | Lab technician |
| student.a@campus.test | user | Fully eligible |
| student.b@campus.test | user | Missing required credential |
| student.c@campus.test | user | At weekly quota limit |

- 8 to 10 resources across categories (3D printer, oscilloscope, DSLR camera, meeting room, GPU workstation, etc.).
- One high-demand resource with an existing booking and a populated waitlist to demonstrate fairness.
- Print credentials at the end of the script. Passwords documented in the README.

---

## 13. Judge Walkthrough (target: under 5 minutes)

1. Log in as `owner.eng` and list a new resource with a required credential.
2. Log in as `student.b`, find the resource, see the missing credential and upload it.
3. Log in as `manager`, verify the credential.
4. As `student.b`, request a slot. Observe the eligibility result.
5. As `owner.eng`, open the queue, review and approve. Note the recorded reason.
6. As `manager`, check the user in with a condition rating and photo.
7. Return the resource with a final condition, noting a minor damage.
8. Report the incident, review the AI summary and resolve it as the owner.
9. As `student.c`, request the high-demand resource and see the waitlist and explanation.
10. Open the booking timeline as both user and owner, then the admin audit log.

---

## 14. Testing Plan

**Automated (minimum):**
- State machine: valid and invalid transitions
- Eligibility engine: met, missing, expired credentials
- Conflict detection: overlapping slots, adjacent slots, simultaneous requests
- Fairness: quota enforcement, waitlist ordering, strike decay

**Manual (before freeze):**
- Complete the full journey on the deployed site with fresh accounts.
- Check each role cannot access another role's routes (direct URL and API).
- Check mobile layout and keyboard-only navigation.

---

## 15. Milestones (48 hours)

| Hours | Deliverable |
|---|---|
| 0 to 4 | Scope, schemas, API contract, repo, skeleton deployed to Vercel |
| 4 to 12 | Auth and RBAC, resource CRUD, booking request with conflict detection, seed data |
| 12 to 24 | Eligibility, owner queue, waitlist, check-in and return. **Full journey working** |
| 24 to 34 | Fairness rules, incidents, notifications, audit UI, cron jobs |
| 34 to 40 | AI summary, polish, accessibility, mobile |
| 40 to 45 | End-to-end testing, bug fixes only, **feature freeze** |
| 45 to 48 | Project document, demo video, README, final submission |

---

## 16. Submission Checklist

- [ ] Live product URL, accessible to judges
- [ ] Source repository with judge access
- [ ] Project document covering use case, users, problem evidence, solution, workflow, features built, stack and architecture, AI and external services, privacy/security/fairness, limitations, future work
- [ ] Testing instructions and credentials
- [ ] Team and participant details
- [ ] Role and contribution of each member
- [ ] Disclosure of templates, libraries, pre-existing code and AI tools used

---

## 17. Known Limitations (to be stated honestly)

- Single-institution scope; no cross-organisation trust model
- Credential verification is manual (a human reviews uploaded documents)
- No payments or deposits; fairness relies on quotas and priority rules
- Polling instead of real-time push notifications
- No physical access control integration

## 18. Future Work

- Multi-institution federation with trust tiers
- Credit or sponsored-booking systems and deposits
- IoT and smart-lock integration for automated access
- Calendar sync (Google, Outlook) and QR-based check-in
- Usage analytics to help institutions identify underused assets
