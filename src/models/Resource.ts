import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type ResourceCategory =
  | "lab"
  | "makerspace"
  | "camera"
  | "room"
  | "computer"
  | "testing"
  | "other";

export type ResourceStatus = "active" | "maintenance" | "retired";

export interface IAvailabilityWindow {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // "09:00"
  endTime: string;   // "17:00"
}

export interface IResource extends Document {
  title: string;
  category: ResourceCategory;
  description: string;
  location: string;
  photos: string[];
  ownerId: Types.ObjectId;
  rules: string;
  availability: IAvailabilityWindow[];
  maxDurationHours: number;
  requiredCredentials: string[];
  requiresApproval: boolean;
  status: ResourceStatus;
  createdAt: Date;
  updatedAt: Date;
}

const AvailabilityWindowSchema = new Schema<IAvailabilityWindow>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
  },
  { _id: false }
);

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ["lab", "makerspace", "camera", "room", "computer", "testing", "other"],
      required: true,
    },
    description: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    photos: { type: [String], default: [] },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rules: { type: String, default: "" },
    availability: { type: [AvailabilityWindowSchema], default: [] },
    maxDurationHours: { type: Number, required: true, default: 4, min: 1 },
    requiredCredentials: { type: [String], default: [] },
    requiresApproval: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["active", "maintenance", "retired"],
      default: "active",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

ResourceSchema.index({ category: 1, status: 1 });
ResourceSchema.index({ ownerId: 1 });

export const Resource: Model<IResource> =
  mongoose.models.Resource || mongoose.model<IResource>("Resource", ResourceSchema);

export default Resource;
