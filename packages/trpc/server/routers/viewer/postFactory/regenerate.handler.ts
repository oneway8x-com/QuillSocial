import type { RegenerateInput } from "./regenerate.schema";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import { createQuillAgent, contentTools } from "@quill/agent";
import type { PrismaClient } from "@quillsocial/prisma/client";

interface RegenerateHandlerOptions {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
    prisma: PrismaClient;
  };
  input: RegenerateInput;
}

export async function regenerateHandler({ ctx, input }: RegenerateHandlerOptions) {
  const { outline, platform, cta, utm } = input;
  const { prisma, user } = ctx;

  // Create agent with content tools
  const agent = createQuillAgent({ prisma }, contentTools());

  // Generate post for specific platform
  const result = await agent.run({
    task: `Regenerate post for ${platform}`,
    inputs: {
      outline,
      channels: [platform],
      cta: cta ? `${cta}${utm || ""}` : undefined,
    },
    meta: {
      userId: user.id,
      requestType: "regenerate_post",
    },
  });

  // Extract the content for the specific platform from the JSON response
  const outputData = typeof result.output === 'string' ? { posts: {} } : result.output;
  const posts = (outputData?.posts as Record<string, string | string[]>) || {};

  // Get the content for the specific platform
  // X and carousel return arrays, others return strings
  const content = posts[platform] || (
    (platform === 'x' || platform === 'carousel')
      ? [`Content for ${platform} - generation in progress...`]
      : `Content for ${platform} - generation in progress...`
  );

  return {
    content,
    platform,
    usage: result.usage,
  };
}
