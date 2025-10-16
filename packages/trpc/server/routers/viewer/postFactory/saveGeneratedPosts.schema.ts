import { z } from "zod";

export const ZSaveGeneratedPostsSchema = z.object({
  outline: z.string(),
  tone: z.enum(["friendly", "authoritative", "contrarian"]),
  outputs: z.record(z.union([z.string(), z.array(z.string())])),
  cta: z.string().optional(),
  utm: z.string().optional(),
  ideaId: z.string().optional(),
  cloudFileIds: z.array(z.number()).optional(), // Array of CloudFile IDs to associate
  postId: z.number().optional(), // If provided, update existing post
});

export type TSaveGeneratedPostsSchema = z.infer<typeof ZSaveGeneratedPostsSchema>;

