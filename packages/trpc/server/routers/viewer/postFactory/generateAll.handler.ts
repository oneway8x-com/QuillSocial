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

  // Parse the generated drafts into platform-specific outputs
  const outputData = typeof result.output === 'string' ? { drafts: result.output } : result.output;
  const draftsText = (outputData?.drafts as string) || "";

  // Simple parsing: split by platform names (more sophisticated parsing could be added)
  const outputs: Record<string, string> = {};

  // Split the drafts by platform headers
  platforms.forEach((platform) => {
    const platformRegex = new RegExp(
      `(?:${platform}|${platform.toUpperCase()})[:\\s]*([\\s\\S]*?)(?=(?:linkedin|x|carousel|shorts|blog|$))`,
      "i"
    );
    const match = draftsText.match(platformRegex);
    if (match && match[1]) {
      outputs[platform] = match[1].trim();
    } else {
      outputs[platform] = `Content for ${platform} - generation in progress...`;
    }
  });

  return {
    outputs,
    usage: result.usage,
  };
}
