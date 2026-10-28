import { z } from "zod";

export const CreateBookingSchema = z.object({
  resourceId: z.string().min(1, "Resource ID is required"),
  start: z.string().datetime("Start must be an ISO date string"),
  end: z.string().datetime("End must be an ISO date string"),
  purpose: z.string().min(5, "Purpose must be at least 5 characters").max(500),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const DecisionSchema = z.object({
  decision: z.enum(["approve", "reject", "waitlist"]),
  reason: z.string().min(3, "Reason is required and must be at least 3 characters"),
});

export type DecisionInput = z.infer<typeof DecisionSchema>;
