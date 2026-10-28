import { execSync } from "child_process";

const testFiles = [
  "tests/phase3-verification.test.ts",
  "tests/conflict-detection.test.ts",
  "tests/fairness-waitlist.test.ts",
  "tests/phase5-verification.test.ts",
  "tests/phase6-verification.test.ts",
];

console.log("================================================================================");
console.log("             ACCESSHUB E2E AUTOMATED VERIFICATION SUITE                         ");
console.log("================================================================================");

let totalPassed = 0;
let totalFailed = 0;

for (const testFile of testFiles) {
  console.log(`\n>>> Executing Test Suite: ${testFile}`);
  try {
    const output = execSync(`npx tsx ${testFile}`, { stdio: "inherit" });
    totalPassed++;
  } catch (error) {
    console.error(`FAILED: ${testFile}`);
    totalFailed++;
  }
}

console.log("\n================================================================================");
console.log(`OVERALL TEST RESULTS: ${totalPassed} Test Suites Passed, ${totalFailed} Failed`);
console.log("================================================================================");

if (totalFailed > 0) {
  process.exit(1);
} else {
  console.log("All E2E validation tests passed successfully! Ready for Hackathon Evaluation.");
  process.exit(0);
}
