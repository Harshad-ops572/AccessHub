import { z } from "zod";

export const AvailabilityWindowSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Format must be HH:mm"),
});

export const ResourceSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  category: z.enum([
    "lab",
    "makerspace",
    "camera",
    "room",
    "computer",
    "testing",
    "other",
  ]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  location: z.string().min(2, "Location is required (e.g., Engineering Hall Rm 204)"),
  photos: z.array(z.string().url("Must be valid URL")).default([]),
  rules: z.string().default("Handle with care. Return in original clean condition."),
  availability: z.array(AvailabilityWindowSchema).default([
    { dayOfWeek: 1, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 2, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 3, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 4, startTime: "09:00", endTime: "18:00" },
    { dayOfWeek: 5, startTime: "09:00", endTime: "18:00" },
  ]),
  maxDurationHours: z.number().min(1).max(24).default(4),
  requiredCredentials: z.array(z.string()).default([]),
  requiresApproval: z.boolean().default(true),
  status: z.enum(["active", "maintenance", "retired"]).default("active"),
});

export type ResourceInput = z.infer<typeof ResourceSchema>;

export const ResourceUpdateSchema = ResourceSchema.partial();
export type ResourceUpdateInput = z.infer<typeof ResourceUpdateSchema>;
