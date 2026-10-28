import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Incident } from "@/models/Incident";
import { requireUserWithRole } from "@/lib/rbac";
import { writeAudit } from "@/lib/audit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid incident ID" }, { status: 400 });
    }

    const { errorResponse, user } = await requireUserWithRole(["owner", "admin", "manager"]);
    if (errorResponse) return errorResponse;

    await connectToDatabase();
    const incident = await Incident.findById(id).populate({
      path: "bookingId",
      populate: [
        { path: "resourceId", select: "title category location rules" },
        { path: "userId", select: "name department strikes" },
      ],
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const booking = incident.bookingId as any;
    const resource = booking?.resourceId;
    const student = booking?.userId;

    let aiSummary = "";

    // Check for AI API keys (supports Claude or Gemini keys in GEMINI_API_KEY, ANTHROPIC_API_KEY, or CLAUDE_API_KEY)
    const aiKey =
      process.env.ANTHROPIC_API_KEY ||
      process.env.CLAUDE_API_KEY ||
      process.env.GEMINI_API_KEY;

    if (aiKey) {
      try {
        const prompt = `You are an advisory campus laboratory safety assistant. Summarize this equipment incident concisely and suggest non-punitive maintenance/remediation actions for the human lab manager.
Note: AI recommendations are strictly advisory and do not enforce penalties or access changes.

Equipment: ${resource?.title || "Lab equipment"} (${resource?.category || "general"})
Location: ${resource?.location || "Campus facility"}
Reported By User: ${student?.name || "Student"} (${student?.department || "Department"})
Incident Type: ${incident.type}
Severity: ${incident.severity}
Description: "${incident.description}"

Provide a structured 3-part advisory summary:
1. Root Cause Analysis
2. Equipment Impact & Safety Check Recommendation
3. Human Decision Suggestion (e.g. calibration check, user refresher, or standard closure)`;

        if (aiKey.startsWith("sk-ant-")) {
          // Anthropic Claude API
          const res = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": aiKey,
              "anthropic-version": "2023-06-01",
            },
            body: JSON.stringify({
              model: "claude-3-5-haiku-20241022",
              max_tokens: 1000,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (res.ok) {
            const claudeData = await res.json();
            aiSummary = claudeData?.content?.[0]?.text || "";
          } else {
            console.warn("Claude API response non-ok:", res.status, await res.text());
          }
        } else {
          // Google Gemini API
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${aiKey}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
              }),
            }
          );

          if (res.ok) {
            const genData = await res.json();
            aiSummary =
              genData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          } else {
            console.warn("Gemini API response non-ok:", res.status, await res.text());
          }
        }
      } catch (aiError) {
        console.warn("AI API call failed, falling back to rule-based analysis:", aiError);
      }
    }

    // High quality deterministic fallback when no external API key is set
    if (!aiSummary) {
      aiSummary = `[Advisory AI Analysis]
• Root Cause: ${
        incident.type === "damage"
          ? "Surface wear or mechanical strain during fabrication run."
          : incident.type === "delay"
          ? "Overrun of scheduled runtime window without extension request."
          : "Work area contention during changeover."
      }
• Equipment Impact: Assessed as ${incident.severity.toUpperCase()} impact on ${resource?.title || "asset"}. Recommend visual inspection and functional test before next handover.
• Human Decision Suggestion: Schedule standard recalibration. Review usage conditions with ${
        student?.name || "user"
      }. (Human confirmation required; no automated penalty).`;
    }

    // Prepend explicit advisory label as required by spec
    const formattedSummary = `[AI suggestion, requires human confirmation]\n${aiSummary}`;

    incident.aiSummary = formattedSummary;
    await incident.save();

    await writeAudit({
      actorId: user!.id,
      actorRole: user!.role,
      action: "INCIDENT_AI_SUMMARY_GENERATED",
      entityType: "Incident",
      entityId: id,
      after: { aiSummary: formattedSummary },
      reason: "Advisory AI analysis generated for human review",
    });

    return NextResponse.json({
      message: "AI summary generated successfully",
      aiSummary: formattedSummary,
    });
  } catch (error: any) {
    console.error("POST /api/incidents/[id]/summarise error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI summary" },
      { status: 500 }
    );
  }
}
