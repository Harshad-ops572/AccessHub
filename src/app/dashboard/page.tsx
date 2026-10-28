"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Navbar } from "@/components/Navbar";

export default function DashboardRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user) {
      router.replace("/login");
      return;
    }

    const role = session.user.role;
    switch (role) {
      case "owner":
        router.replace("/owner/queue");
        break;
      case "manager":
        router.replace("/manager/checkin");
        break;
      case "admin":
        router.replace("/admin/audit");
        break;
      default:
        router.replace("/bookings");
        break;
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-400">Directing to role workspace...</p>
        </div>
      </div>
    </div>
  );
}
