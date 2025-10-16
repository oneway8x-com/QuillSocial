import { z } from "zod";

// Slide schema matching packages/docs-render types
const ZSlideSchema = z.object({
  heading: z.string().optional(),
  subheading: z.string().optional(),
  bullets: z.array(z.string()).optional(),
});

export const ZGenerateCarouselInputSchema = z.object({
  slides: z.array(ZSlideSchema).min(1, "At least one slide required"),
  format: z.enum(["images", "pdf"]).default("images"),
  brandName: z.string().optional(),
});

export type GenerateCarouselInput = z.infer<typeof ZGenerateCarouselInputSchema>;
