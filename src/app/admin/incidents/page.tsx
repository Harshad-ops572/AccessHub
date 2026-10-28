"use client";

import React from "react";
import OwnerIncidentsPage from "@/app/owner/incidents/page";

// Admin incidents view re-uses the full resolution interface with global role privileges
export default function AdminIncidentsPage() {
  return <OwnerIncidentsPage />;
}
