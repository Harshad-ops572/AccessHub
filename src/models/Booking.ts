import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type BookingStatus =
  | "requested"
  | "eligibility_check"
  | "pending_review"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "checked_in"
  | "returned"
  | "closed"
  | "cancelled"
  | "overdue"
  | "disputed";

export interface IEligibilityCheckResult {
  requirement: string;
  met: boolean;
  reason: string;
}

export interface IEligibilitySnapshot {
  eligible: boolean;
  evaluatedAt: Date;
  checks: IEligibilityCheckResult[];
}

export interface IFairnessSnapshot {
  weeklyHoursBefore: number;
  activeBookingsCount: number;
  strikes: number;
  priorityScore?: number;
}

export interface IBooking extends Document {
  userId: Types.ObjectId;
  resourceId: Types.ObjectId;
  start: Date;
  end: Date;
  purpose: string;
  status: BookingStatus;
  decisionReason?: string;
  eligibilitySnapshot?: IEligibilitySnapshot;
  fairnessSnapshot?: IFairnessSnapshot;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resourceId: { type: Schema.Types.ObjectId, ref: "Resource", required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    purpose: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: [
        "requested",
        "eligibility_check",
        "pending_review",
        "approved",
        "rejected",
        "waitlisted",
        "checked_in",
        "returned",
        "closed",
        "cancelled",
        "overdue",
        "disputed",
      ],
      default: "requested",
      required: true,
    },
    decisionReason: { type: String },
    eligibilitySnapshot: { type: Schema.Types.Mixed },
    fairnessSnapshot: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
  }
);

// Compound index for overlap queries as specified in spec: (resourceId, start, end, status)
BookingSchema.index({ resourceId: 1, start: 1, end: 1, status: 1 });
BookingSchema.index({ userId: 1, status: 1 });

export const Booking: Model<IBooking> =
  mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
