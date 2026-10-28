import { DefaultSession } from "next-auth";
import { UserRole, VerificationStatus } from "@/models/User";

declare module "next-auth" {
  interface User {
    id: string;
    role: UserRole;
    department: string;
    verificationStatus: VerificationStatus;
    strikes: number;
    weeklyHoursUsed: number;
  }

  interface Session {
    user: {
      id: string;
      role: UserRole;
      department: string;
      verificationStatus: VerificationStatus;
      strikes: number;
      weeklyHoursUsed: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    department: string;
    verificationStatus: VerificationStatus;
    strikes: number;
    weeklyHoursUsed: number;
  }
}
