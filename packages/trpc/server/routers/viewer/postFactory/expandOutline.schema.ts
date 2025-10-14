import { z } from "zod";

export const ZExpandOutlineInputSchema = z.object({
  idea: z.string().min(1, "Idea cannot be empty"),
  tone: z.enum(["friendly", "authoritative", "contrarian"]).default("friendly"),
});

export type ExpandOutlineInput = z.infer<typeof ZExpandOutlineInputSchema>;
