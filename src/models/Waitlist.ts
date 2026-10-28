import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type WaitlistStatus = "active" | "offered" | "accepted" | "expired" | "cancelled";

export interface IScoreBreakdown {
  recentUsage: number;
  strikes: number;
  waitTime: number;
}

export interface IWaitlist extends Document {
  resourceId: Types.ObjectId;
  userId: Types.ObjectId;
  slotStart: Date;
  slotEnd: Date;
  priorityScore: number;
  scoreBreakdown: IScoreBreakdown;
  status: WaitlistStatus;
  offeredAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaitlistSchema = new Schema<IWaitlist>(
  {
    resourceId: { type: Schema.Types.ObjectId, ref: "Resource", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slotStart: { type: Date, required: true },
    slotEnd: { type: Date, required: true },
    priorityScore: { type: Number, required: true, default: 0 },
    scoreBreakdown: {
      recentUsage: { type: Number, default: 0 },
      strikes: { type: Number, default: 0 },
      waitTime: { type: Number, default: 0 },
    },
    status: {
      type: String,
      enum: ["active", "offered", "accepted", "expired", "cancelled"],
      default: "active",
      required: true,
    },
    offeredAt: { type: Date },
    expiresAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

// Compound index for waitlist ranking
WaitlistSchema.index({ resourceId: 1, status: 1, priorityScore: -1 });

export const Waitlist: Model<IWaitlist> =
  mongoose.models.Waitlist || mongoose.model<IWaitlist>("Waitlist", WaitlistSchema);

export default Waitlist;
