import { Types } from "mongoose";
import { connectToDatabase } from "./db";
import { AuditLog } from "../models/AuditLog";

export interface WriteAuditParams {
  actorId?: string | Types.ObjectId;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  reason?: string;
}

/**
 * Single, append-only audit writer helper.
 * Enforces that no updates or deletes can occur on audit logs.
 */
export async function writeAudit(params: WriteAuditParams) {
  try {
    await connectToDatabase();
    const entry = new AuditLog({
      actorId: params.actorId ? new Types.ObjectId(params.actorId.toString()) : undefined,
      actorRole: params.actorRole,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      before: params.before,
      after: params.after,
      reason: params.reason,
      timestamp: new Date(),
    });
    await entry.save();
    return entry;
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // Don't crash caller on logging failure in non-critical scenarios, but log loudly
  }
}
