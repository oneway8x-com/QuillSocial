import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import type { TGetPostByIdeaSchema } from "./getPost.schema";
import prisma from "@quillsocial/prisma";
import { Prisma } from "@prisma/client";

type GetPostHandlerOptions = {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
  };
  input: TGetPostByIdeaSchema;
};

export const getPostHandler = async ({ ctx, input }: GetPostHandlerOptions) => {
  const { user } = ctx;
  const { ideaId, postId } = input;

  // If postId is provided, fetch by postId
  if (postId) {
    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        userId: user.id,
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (!post) {
      return null;
    }

    // Debug: Log the actual data structure
    console.log("🔍 [getPost by postId] Loading from DB:", {
      postId: post.id,
      multiPlatformOutputs: post.multiPlatformOutputs,
      xIsArray: Array.isArray((post.multiPlatformOutputs as any)?.x),
      xType: typeof (post.multiPlatformOutputs as any)?.x,
    });

    return {
      postId: post.id,
      outline: post.idea,
      tone: post.tone ? (post.tone.toLowerCase() as "friendly" | "authoritative" | "contrarian") : null,
      outputs: post.multiPlatformOutputs as Record<string, string | string[]> | null,
      cta: post.cta,
      utm: post.utm,
      ideaId: post.ideaId,
      status: post.status,
      createdAt: post.createdDate,
    };
  }

  // If ideaId is provided, fetch the most recent post for that idea
  if (ideaId) {
    const post = await prisma.post.findFirst({
      where: {
        ideaId,
        userId: user.id,
        multiPlatformOutputs: {
          not: Prisma.JsonNull, // Only posts created from post factory
        },
      },
      orderBy: {
        createdDate: "desc",
      },
    });

    if (!post) {
      return null;
    }

    // Debug: Log the actual data structure
    console.log("🔍 [getPost by ideaId] Loading from DB:", {
      postId: post.id,
      ideaId: post.ideaId,
      multiPlatformOutputs: post.multiPlatformOutputs,
      xIsArray: Array.isArray((post.multiPlatformOutputs as any)?.x),
      xType: typeof (post.multiPlatformOutputs as any)?.x,
    });

    return {
      postId: post.id,
      outline: post.idea,
      tone: post.tone ? (post.tone.toLowerCase() as "friendly" | "authoritative" | "contrarian") : null,
      outputs: post.multiPlatformOutputs as Record<string, string | string[]> | null,
      cta: post.cta,
      utm: post.utm,
      ideaId: post.ideaId,
      status: post.status,
      createdAt: post.createdDate,
    };
  }

  // If neither is provided, fetch the most recent post from post factory
  const post = await prisma.post.findFirst({
    where: {
      userId: user.id,
      multiPlatformOutputs: {
        not: Prisma.JsonNull, // Only posts created from post factory
      },
    },
      orderBy: {
        createdDate: "desc",
      },
    });

  if (!post) {
    return null;
  }

  // Debug: Log the actual data structure
  console.log("🔍 [getPost latest] Loading from DB:", {
    postId: post.id,
    multiPlatformOutputs: post.multiPlatformOutputs,
    xIsArray: Array.isArray((post.multiPlatformOutputs as any)?.x),
    xType: typeof (post.multiPlatformOutputs as any)?.x,
  });

  return {
    postId: post.id,
    outline: post.idea,
    tone: post.tone ? (post.tone.toLowerCase() as "friendly" | "authoritative" | "contrarian") : null,
    outputs: post.multiPlatformOutputs as Record<string, string | string[]> | null,
    cta: post.cta,
    utm: post.utm,
    ideaId: post.ideaId,
    status: post.status,
    createdAt: post.createdDate,
  };
};
