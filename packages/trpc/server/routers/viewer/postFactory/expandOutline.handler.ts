import type { ExpandOutlineInput } from "./expandOutline.schema";
import type { TrpcSessionUser } from "@quillsocial/trpc/server/trpc";
import { createQuillAgent, contentTools } from "@quill/agent";
import type { PrismaClient } from "@quillsocial/prisma/client";

interface ExpandOutlineHandlerOptions {
  ctx: {
    user: NonNullable<TrpcSessionUser>;
    prisma: PrismaClient;
  };
  input: ExpandOutlineInput;
}

export async function expandOutlineHandler({ ctx, input }: ExpandOutlineHandlerOptions) {
  const { idea, tone } = input;
  const { prisma, user } = ctx;

  // Create agent with content tools
  const agent = createQuillAgent({ prisma }, contentTools());

  // Use the expandOutline tool
  const result = await agent.run({
    task: `Expand this idea into a detailed outline: ${idea}`,
    inputs: {
      idea,
      tone,
    },
    meta: {
      userId: user.id,
      requestType: "expand_outline",
    },
  });

  const outputData = typeof result.output === 'string' ? { outline: result.output, tone } : result.output;

  return {
    outline: (outputData?.outline as string) || "",
    tone: (outputData?.tone as string) || tone,
    usage: result.usage,
  };
}
