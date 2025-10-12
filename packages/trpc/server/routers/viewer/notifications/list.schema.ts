import { z } from "zod";

export const ZListNotificationsInputSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(20),
  offset: z.number().min(0).optional().default(0),
  unreadOnly: z.boolean().optional().default(false),
});

export type TListNotificationsInputSchema = z.infer<typeof ZListNotificationsInputSchema>;
