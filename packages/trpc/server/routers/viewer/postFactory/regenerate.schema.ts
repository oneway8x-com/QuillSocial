import { z } from "zod";

export const ZRegenerateInputSchema = z.object({
  outline: z.string().min(1, "Outline cannot be empty"),
  platform: z.enum(["linkedin", "x", "carousel", "shorts", "blog"]),
  cta: z.string().optional(),
  utm: z.string().optional(),
});

export type RegenerateInput = z.infer<typeof ZRegenerateInputSchema>;
