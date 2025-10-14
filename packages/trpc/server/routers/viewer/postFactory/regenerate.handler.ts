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

  // Extract the content for the specific platform
  const outputData = typeof result.output === 'string' ? { drafts: result.output } : result.output;
  const draftsText = (outputData?.drafts as string) || "";

  // Simple parsing to extract platform content
  const platformRegex = new RegExp(
    `(?:${platform}|${platform.toUpperCase()})[:\\s]*([\\s\\S]*?)$`,
    "i"
  );
  const match = draftsText.match(platformRegex);
  const content = match && match[1] ? match[1].trim() : draftsText.trim();

  return {
    content,
    platform,
    usage: result.usage,
  };
}
