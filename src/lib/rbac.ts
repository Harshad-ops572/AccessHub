import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { UserRole } from "@/models/User";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}

/**
 * Server-side authorization check for Route Handlers.
 * If unauthorized, returns a NextResponse with 401 or 403.
 * If authorized, returns { user }.
 */
export async function requireUserWithRole(allowedRoles: UserRole[]) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Please log in to proceed" },
        { status: 401 }
      ),
      user: null,
    };
  }

  // Admin always has access to all routes
  if (user.role === "admin" || allowedRoles.includes(user.role)) {
    return { errorResponse: null, user };
  }

  return {
    errorResponse: NextResponse.json(
      {
        error: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(
          ", "
        )}]`,
      },
      { status: 403 }
    ),
    user: null,
  };
}

export function canManageResource(
  ownerId: string,
  user: { id: string; role: UserRole }
): boolean {
  if (user.role === "admin") return true;
  if (user.role === "owner" && ownerId === user.id) return true;
  return false;
}
