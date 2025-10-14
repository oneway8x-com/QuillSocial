import { z } from "zod";

export const ZGenerateAllInputSchema = z.object({
  outline: z.string().min(1, "Outline cannot be empty"),
  tone: z.enum(["friendly", "authoritative", "contrarian"]).default("friendly"),
  platforms: z.array(z.enum(["linkedin", "x", "carousel", "shorts", "blog"])).min(1, "At least one platform required"),
  cta: z.string().optional(),
  utm: z.string().optional(),
});

export type GenerateAllInput = z.infer<typeof ZGenerateAllInputSchema>;
