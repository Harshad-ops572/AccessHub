import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type InspectionType = "checkin" | "return";

export interface IChecklistItem {
  item: string;
  passed: boolean;
}

export interface IInspection extends Document {
  bookingId: Types.ObjectId;
  type: InspectionType;
  conditionRating: number; // 1 to 5
  checklist: IChecklistItem[];
  notes: string;
  photos: string[];
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    item: { type: String, required: true },
    passed: { type: Boolean, required: true, default: true },
  },
  { _id: false }
);

const InspectionSchema = new Schema<IInspection>(
  {
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", required: true },
    type: { type: String, enum: ["checkin", "return"], required: true },
    conditionRating: { type: Number, required: true, min: 1, max: 5 },
    checklist: { type: [ChecklistItemSchema], default: [] },
    notes: { type: String, default: "" },
    photos: { type: [String], default: [] },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

InspectionSchema.index({ bookingId: 1, type: 1 });

export const Inspection: Model<IInspection> =
  mongoose.models.Inspection || mongoose.model<IInspection>("Inspection", InspectionSchema);

export default Inspection;
