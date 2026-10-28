import { canTransition } from "../src/services/bookingStateMachine";
import { BookingStatus } from "../src/models/Booking";
import { UserRole } from "../src/models/User";

function runTests() {
  console.log("=================================================");
  console.log("   PHASE 3 TEST SUITE: STATE MACHINE & CONFLICTS ");
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

  // --- 1. STATE MACHINE TESTS ---
  console.log("\n[1] Booking State Machine Transitions:");

  // Valid forward paths
  assert(
    canTransition("requested", "eligibility_check", "system").allowed,
    "system can move requested -> eligibility_check"
  );
  assert(
    canTransition("eligibility_check", "pending_review", "system").allowed,
    "system can move eligibility_check -> pending_review"
  );
  assert(
    canTransition("pending_review", "approved", "owner").allowed,
    "owner can move pending_review -> approved"
  );
  assert(
    canTransition("pending_review", "rejected", "owner").allowed,
    "owner can move pending_review -> rejected"
  );
  assert(
    canTransition("pending_review", "waitlisted", "owner").allowed,
    "owner can move pending_review -> waitlisted"
  );
  assert(
    canTransition("approved", "checked_in", "manager").allowed,
    "manager can move approved -> checked_in"
  );
  assert(
    canTransition("checked_in", "returned", "manager").allowed,
    "manager can move checked_in -> returned"
  );
  assert(
    canTransition("returned", "closed", "system").allowed,
    "system can move returned -> closed"
  );

  // Valid cancellations
  assert(
    canTransition("pending_review", "cancelled", "user").allowed,
    "user can cancel pending_review"
  );
  assert(
    canTransition("approved", "cancelled", "user").allowed,
    "user can cancel approved booking"
  );

  // Invalid transitions (Strictly Rejected)
  assert(
    !canTransition("requested", "checked_in", "user").allowed,
    "user cannot jump requested -> checked_in directly (Must reject)"
  );
  assert(
    !canTransition("rejected", "approved", "user").allowed,
    "user cannot self-approve a rejected booking (Must reject)"
  );
  assert(
    !canTransition("pending_review", "approved", "user").allowed,
    "student user cannot approve their own booking (Requires owner/admin)"
  );
  assert(
    !canTransition("returned", "checked_in", "manager").allowed,
    "manager cannot rewind returned -> checked_in (Must reject)"
  );
  assert(
    !canTransition("cancelled", "approved", "owner").allowed,
    "owner cannot resurrect cancelled booking (Must reject)"
  );

  // Overdue side branch
  assert(
    canTransition("checked_in", "overdue", "system").allowed,
    "system cron can mark checked_in -> overdue"
  );

  console.log(`\n=================================================`);
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
