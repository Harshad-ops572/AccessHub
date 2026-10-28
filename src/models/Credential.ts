import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CredentialStatus = "pending" | "verified" | "rejected" | "expired";

export interface ICredential extends Document {
  userId: Types.ObjectId;
  type: string; // e.g., "3D Printer Safety Training"
  documentUrl: string;
  status: CredentialStatus;
  verifiedBy?: Types.ObjectId;
  expiresAt?: Date;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CredentialSchema = new Schema<ICredential>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true, trim: true },
    documentUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "expired"],
      default: "pending",
      required: true,
    },
    verifiedBy: { type: Schema.Types.ObjectId, ref: "User" },
    expiresAt: { type: Date },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

CredentialSchema.index({ userId: 1, type: 1 });
CredentialSchema.index({ status: 1 });

export const Credential: Model<ICredential> =
  mongoose.models.Credential || mongoose.model<ICredential>("Credential", CredentialSchema);

export default Credential;
