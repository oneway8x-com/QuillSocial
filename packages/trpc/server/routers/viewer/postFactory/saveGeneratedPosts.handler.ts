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
  const { outline, tone, outputs, cta, utm, ideaId, cloudFileIds, postId } = input;

  // Debug: Log what we're saving
  console.log("💾 [saveGeneratedPosts] Saving to DB:", {
    userId: user.id,
    ideaId,
    tone,
    postId,
    cloudFileIdsCount: cloudFileIds?.length || 0,
    xIsArray: Array.isArray(outputs.x),
    xType: typeof outputs.x,
    xSample: Array.isArray(outputs.x) ? outputs.x[0] : (outputs.x as string)?.substring(0, 50),
  });

  // Get default content (linkedin or first tweet from x thread)
  // We'll compute default content from the merged outputs (see update path below).
  // For now, initialize to empty; we'll set it later after determining the final outputs.
  let defaultContent: string = "";

  let post;

  // If postId is provided, update existing post
  if (postId) {
    // First verify the post belongs to the user
    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!existingPost || existingPost.userId !== user.id) {
      throw new Error("Post not found or unauthorized");
    }

    // Merge existing multiPlatformOutputs with incoming outputs so clients can send
    // partial updates without overwriting other channels.
    const existingOutputs = (existingPost.multiPlatformOutputs || {}) as Record<string, any>;
    const incomingOutputs = (outputs || {}) as Record<string, any>;

    const mergedOutputs = Object.assign({}, existingOutputs, incomingOutputs) as Record<string, any>;

    // Compute default content (prefer linkedin, then first item of x array or x string)
    defaultContent = mergedOutputs.linkedin
      ? (mergedOutputs.linkedin as string)
      : Array.isArray(mergedOutputs.x)
      ? mergedOutputs.x.join('\n\n')
      : (mergedOutputs.x as string) || "";

    post = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        idea: outline,
        content: defaultContent,
        tone: tone ? (tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN") : null,
        multiPlatformOutputs: mergedOutputs as any,
        cta,
        utm,
      },
    });

    console.log("✅ [saveGeneratedPosts] Updated post:", { postId: post.id });
  } else {
    // Create a new Post record
    // For create path, compute defaultContent from provided outputs
    const providedOutputs = outputs || {};
    defaultContent = providedOutputs.linkedin
      ? (providedOutputs.linkedin as string)
      : Array.isArray(providedOutputs.x)
      ? providedOutputs.x.join('\n\n')
      : (providedOutputs.x as string) || "";

    post = await prisma.post.create({
      data: {
        userId: user.id,
        idea: outline,
        content: defaultContent,
        status: "NEW",
        ideaId,
        tone: tone ? (tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN") : null,
        multiPlatformOutputs: providedOutputs as any,
        cta,
        utm,
      },
    });

    console.log("✅ [saveGeneratedPosts] Created new post:", { postId: post.id });
  }

  // If cloudFileIds are provided, create PostCloudFile associations
  if (cloudFileIds && cloudFileIds.length > 0) {
    // First, delete existing associations for this post
    await prisma.postCloudFile.deleteMany({
      where: {
        postId: post.id,
      },
    });

    // Then create new associations
    await prisma.postCloudFile.createMany({
      data: cloudFileIds.map((cloudFileId) => ({
        postId: post.id,
        cloudFileId,
      })),
    });

    console.log("✅ [saveGeneratedPosts] Associated CloudFiles:", {
      postId: post.id,
      cloudFileIds,
    });
  }

  return {
    success: true,
    postId: post.id,
  };
};
