import mongoose, { Schema, Document, Model } from "mongoose";

export type UserRole = "user" | "owner" | "manager" | "admin";
export type VerificationStatus = "unverified" | "verified";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department: string;
  verificationStatus: VerificationStatus;
  strikes: number;
  weeklyHoursUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "owner", "manager", "admin"],
      default: "user",
      required: true,
    },
    department: { type: String, required: true, trim: true },
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified"],
      default: "unverified",
      required: true,
    },
    strikes: { type: Number, default: 0, min: 0 },
    weeklyHoursUsed: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose model overwrite error in Next.js development
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
