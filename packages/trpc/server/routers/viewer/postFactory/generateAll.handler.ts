import type { GenerateAllInput } from "./generateAll.schema";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import { createQuillAgent, contentTools } from "@quill/agent";
import type { PrismaClient } from "@quillsocial/prisma/client";

interface GenerateAllHandlerOptions {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
    prisma: PrismaClient;
  };
  input: GenerateAllInput;
}

export async function generateAllHandler({ ctx, input }: GenerateAllHandlerOptions) {
  const { outline, tone, platforms, cta, utm } = input;
  const { prisma, user } = ctx;

  // Create agent with content tools
  const agent = createQuillAgent({ prisma }, contentTools());

  // Generate posts for all selected platforms
  const result = await agent.run({
    task: `Generate posts for ${platforms.join(", ")} with ${tone} tone`,
    inputs: {
      outline,
      channels: platforms,
      cta: cta ? `${cta}${utm || ""}` : undefined,
    },
    meta: {
      userId: user.id,
      requestType: "generate_all_posts",
    },
  });

  // Parse the generated posts from the agent output
  const outputData = typeof result.output === 'string' ? { posts: {} } : result.output;
  const posts = (outputData?.posts as Record<string, string | string[]>) || {};

  // Map the posts to the output format
  const outputs: Record<string, string | string[]> = {};

  platforms.forEach((platform) => {
    // Get the post from the structured JSON response
    if (posts[platform]) {
      outputs[platform] = posts[platform];
    } else {
      // Fallback if platform not found
      // X and carousel return arrays, others return strings
      outputs[platform] = (platform === 'x' || platform === 'carousel')
        ? [`Content for ${platform} - generation in progress...`]
        : `Content for ${platform} - generation in progress...`;
    }
  });

  return {
    outputs,
    usage: result.usage,
  };
}
