import { z } from "zod";

export const ZMarkAsReadInputSchema = z.object({
  notificationIds: z.array(z.string()).optional(),
  all: z.boolean().optional().default(false),
});

export type TMarkAsReadInputSchema = z.infer<typeof ZMarkAsReadInputSchema>;
