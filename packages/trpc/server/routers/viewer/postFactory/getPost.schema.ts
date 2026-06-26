import { z } from "zod";

export const ZGetPostByIdeaSchema = z.object({
  ideaId: z.string().optional(),
  postId: z.number().optional(),
});

export type TGetPostByIdeaSchema = z.infer<typeof ZGetPostByIdeaSchema>;
