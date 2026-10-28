import {
  calculateWaitlistPriorityScore,
  DEFAULT_SCORE_WEIGHTS,
} from "../src/services/fairnessService";

function runFairnessTests() {
  console.log("=================================================");
  console.log("   PHASE 4 FAIRNESS & WAITLIST SCORING TEST      ");
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

  // Scenario 1: Clean slate student (0 hours used, 1h wait, 0 strikes)
  // usageTerm = 1 / (1 + 0) = 1.0
  // score = 0.5 * 1.0 + 0.3 * 1.0 - 0.2 * 0 = 0.800
  const cleanStudent = calculateWaitlistPriorityScore(0, 1.0, 0);
  assert(
    cleanStudent.score === 0.8,
    `Clean student score is 0.80 (got ${cleanStudent.score})`
  );

  // Scenario 2: Student at quota limit with 1 strike (8 hours used, 1h wait, 1 strike)
  // usageTerm = 1 / (1 + 8) = 1/9 = 0.111
  // score = 0.5 * 0.111 + 0.3 * 1.0 - 0.2 * 1 = 0.056 + 0.3 - 0.2 = 0.156
  const penalizedStudent = calculateWaitlistPriorityScore(8, 1.0, 1);
  assert(
    penalizedStudent.score < cleanStudent.score,
    `High-usage student with strike has strictly lower priority (${penalizedStudent.score} < ${cleanStudent.score})`
  );

  // Scenario 3: Wait time progression boosts priority
  // If penalized student waits 4 hours:
  const patientStudent = calculateWaitlistPriorityScore(8, 4.0, 1);
  assert(
    patientStudent.score > penalizedStudent.score,
    `Waiting longer increases waitlist score (${patientStudent.score} > ${penalizedStudent.score})`
  );

  // Scenario 4: Strike penalty impact
  const strike0 = calculateWaitlistPriorityScore(2, 2.0, 0);
  const strike1 = calculateWaitlistPriorityScore(2, 2.0, 1);
  assert(
    strike0.score > strike1.score,
    `Penalty strike correctly lowers score by w3 (${strike0.score} vs ${strike1.score})`
  );

  // Scenario 5: Non-negative floor
  const heavyPenalized = calculateWaitlistPriorityScore(50, 0, 10);
  assert(heavyPenalized.score === 0, `Priority score cannot go below 0 (floored at 0)`);

  console.log(`\n=================================================`);
  console.log(`Fairness Results: ${passed} Passed, ${failed} Failed`);
  console.log(`=================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runFairnessTests();
