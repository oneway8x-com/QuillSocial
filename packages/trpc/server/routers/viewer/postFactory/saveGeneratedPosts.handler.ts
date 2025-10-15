import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import type { TSaveGeneratedPostsSchema } from "./saveGeneratedPosts.schema";
import prisma from "@quillsocial/prisma";

type SaveGeneratedPostsHandlerOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TSaveGeneratedPostsSchema;
};

export const saveGeneratedPostsHandler = async ({ ctx, input }: SaveGeneratedPostsHandlerOptions) => {
  const { user } = ctx;
  const { outline, tone, outputs, cta, utm, ideaId } = input;

  // Debug: Log what we're saving
  console.log("💾 [saveGeneratedPosts] Saving to DB:", {
    userId: user.id,
    ideaId,
    tone,
    xIsArray: Array.isArray(outputs.x),
    xType: typeof outputs.x,
    xSample: Array.isArray(outputs.x) ? outputs.x[0] : (outputs.x as string)?.substring(0, 50),
  });

  // Create a Post record with multiPlatformOutputs
  // Get default content (linkedin or first tweet from x thread)
  const defaultContent: string = outputs.linkedin
    ? (outputs.linkedin as string)
    : Array.isArray(outputs.x)
      ? outputs.x.join('\n\n')
      : (outputs.x as string) || "";

  const post = await prisma.post.create({
    data: {
      userId: user.id,
      idea: outline, // Store outline in the idea field for backward compatibility
      content: defaultContent, // Default content to first available platform
      status: "NEW",
      ideaId,
      tone: tone ? (tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN") : null,
      multiPlatformOutputs: outputs as any, // JSON field: {linkedin, x, carousel, shorts, blog}
      cta,
      utm,
    },
  });

  console.log("✅ [saveGeneratedPosts] Saved successfully:", {
    postId: post.id,
    ideaId: post.ideaId,
  });

  return {
    success: true,
    postId: post.id,
  };
};
