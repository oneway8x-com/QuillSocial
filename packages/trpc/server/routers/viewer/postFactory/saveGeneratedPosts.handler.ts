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
  const defaultContent: string = outputs.linkedin
    ? (outputs.linkedin as string)
    : Array.isArray(outputs.x)
      ? outputs.x.join('\n\n')
      : (outputs.x as string) || "";

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

    post = await prisma.post.update({
      where: {
        id: postId,
      },
      data: {
        idea: outline,
        content: defaultContent,
        tone: tone ? (tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN") : null,
        multiPlatformOutputs: outputs as any,
        cta,
        utm,
      },
    });

    console.log("✅ [saveGeneratedPosts] Updated post:", { postId: post.id });
  } else {
    // Create a new Post record
    post = await prisma.post.create({
      data: {
        userId: user.id,
        idea: outline,
        content: defaultContent,
        status: "NEW",
        ideaId,
        tone: tone ? (tone.toUpperCase() as "FRIENDLY" | "AUTHORITATIVE" | "CONTRARIAN") : null,
        multiPlatformOutputs: outputs as any,
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
