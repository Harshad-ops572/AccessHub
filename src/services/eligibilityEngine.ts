import { Credential } from "@/models/Credential";
import { IResource } from "@/models/Resource";
import { Types } from "mongoose";

export interface EligibilityCheckItem {
  requirement: string;
  met: boolean;
  reason: string;
  missingDoc?: boolean;
}

export interface EligibilityEvaluationResult {
  eligible: boolean;
  checks: EligibilityCheckItem[];
  missingCount: number;
}

/**
 * Evaluates whether a user meets all credential prerequisites for a given resource.
 * Checks status == 'verified' and verifies expiration date.
 */
export async function evaluateUserEligibility(
  userId: string | Types.ObjectId,
  resource: IResource
): Promise<EligibilityEvaluationResult> {
  const requiredCredentials = resource.requiredCredentials || [];

  if (requiredCredentials.length === 0) {
    return {
      eligible: true,
      checks: [
        {
          requirement: "General Access",
          met: true,
          reason: "No specialized safety credentials required for this resource.",
        },
      ],
      missingCount: 0,
    };
  }

  // Fetch all user credentials
  const userCredentials = await Credential.find({
    userId: new Types.ObjectId(userId.toString()),
  }).lean();

  const now = new Date();
  const checks: EligibilityCheckItem[] = [];
  let missingCount = 0;

  for (const requirement of requiredCredentials) {
    const matching = userCredentials.find(
      (c) => c.type.toLowerCase().trim() === requirement.toLowerCase().trim()
    );

    if (!matching) {
      checks.push({
        requirement,
        met: false,
        reason: `Missing safety certification. You have not submitted documentation for "${requirement}".`,
        missingDoc: true,
      });
      missingCount++;
      continue;
    }

    if (matching.status === "pending") {
      checks.push({
        requirement,
        met: false,
        reason: `Verification pending. Your submitted "${requirement}" is currently awaiting review by a lab manager.`,
        missingDoc: false,
      });
      missingCount++;
      continue;
    }

    if (matching.status === "rejected") {
      checks.push({
        requirement,
        met: false,
        reason: `Document rejected: ${matching.rejectionReason || "Please upload a valid replacement."}`,
        missingDoc: true,
      });
      missingCount++;
      continue;
    }

    if (matching.expiresAt && new Date(matching.expiresAt) < now) {
      checks.push({
        requirement,
        met: false,
        reason: `Credential expired on ${new Date(matching.expiresAt).toLocaleDateString()}. Re-certification required.`,
        missingDoc: true,
      });
      missingCount++;
      continue;
    }

    // Status is verified and not expired!
    checks.push({
      requirement,
      met: true,
      reason: `Verified active certificate on file (valid through ${
        matching.expiresAt ? new Date(matching.expiresAt).toLocaleDateString() : "Indefinite"
      }).`,
      missingDoc: false,
    });
  }

  const eligible = missingCount === 0;

  return {
    eligible,
    checks,
    missingCount,
  };
}
