import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type IncidentType = "damage" | "delay" | "conflict" | "other";
export type IncidentSeverity = "low" | "medium" | "high";
export type IncidentStatus = "open" | "under_review" | "resolved" | "dismissed";

export interface IIncident extends Document {
  bookingId: Types.ObjectId;
  type: IncidentType;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  resolution?: string;
  aiSummary?: string; // advisory only
  reportedBy: Types.ObjectId;
  resolvedBy?: Types.ObjectId;
  photos: string[];
  createdAt: Date;
  updatedAt: Date;
}

const IncidentSchema = new Schema<IIncident>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    type: {
      type: String,
      enum: ["damage", "delay", "conflict", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    severity: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "dismissed"],
      default: "open",
      required: true,
    },
    resolution: { type: String },
    aiSummary: { type: String }, // Advisory only
    reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    photos: { type: [String], default: [] },
  },
  {
    timestamps: true,
  }
);

IncidentSchema.index({ bookingId: 1 });
IncidentSchema.index({ status: 1 });

export const Incident: Model<IIncident> =
  mongoose.models.Incident || mongoose.model<IIncident>("Incident", IncidentSchema);

export default Incident;
