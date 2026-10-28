import { z } from "zod";

export const ChecklistItemSchema = z.object({
  item: z.string().min(1, "Checklist item name is required"),
  passed: z.boolean(),
});

export const InspectionSchema = z.object({
  conditionRating: z.number().min(1).max(5),
  checklist: z.array(ChecklistItemSchema).default([]),
  notes: z.string().default(""),
  photos: z.array(z.string()).default([]),
});

export type InspectionInput = z.infer<typeof InspectionSchema>;

export const IncidentSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  type: z.enum(["damage", "delay", "conflict", "other"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["low", "medium", "high"]).default("low"),
  photos: z.array(z.string()).default([]),
});

export type IncidentInput = z.infer<typeof IncidentSchema>;

export const ResolveIncidentSchema = z.object({
  status: z.enum(["resolved", "dismissed"]),
  resolution: z.string().min(5, "Resolution description is required"),
  applyStrike: z.boolean().default(false),
});

export type ResolveIncidentInput = z.infer<typeof ResolveIncidentSchema>;
