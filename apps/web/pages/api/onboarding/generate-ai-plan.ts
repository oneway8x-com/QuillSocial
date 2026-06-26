import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";
import { withUsageLogging, type ChatMessage } from "@quill/agent";
import prisma from "@quillsocial/prisma";
import fs from "fs";
import path from "path";

interface GenerateGrowthPlanRequest {
  goal: string;
  persona?: string;
  tone: string;
  channels: string[];
  audienceStage: string;
}

interface AIGeneratedPlan {
  planId: string;
  purpose: string;
  persona: string;
  tone: string[];
  pillars: Array<{
    name: string;
    why: string;
    exampleTopics: string[];
  }>;
  cadence: Record<string, {
    perWeek: number;
    days: string[];
    postTypes: string[];
  }>;
  week1Schedule: Array<{
    date: string;
    channel: string;
    draft: {
      title: string;
      hook: string;
      outline: string[];
      cta: string;
      replies: string[];
    };
  }>;
  engagementPlan: {
    meaningfulRepliesPerDay: number;
    personasToEngage: string[];
    topics: string[];
  };
  metrics: {
    weeklyPostTarget: number;
    dailyReplyTarget: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { goal, persona, tone, channels, audienceStage } = req.body as GenerateGrowthPlanRequest;

  if (!goal || !tone || !channels || channels.length === 0) {
    return res.status(400).json({ error: "Missing required fields: goal, tone, channels" });
  }

  try {
    // Load the prompt template
    const promptPath = path.join(process.cwd(), "prompts", "generate_growth_plan.prompt.txt");
    const promptTemplate = fs.readFileSync(promptPath, "utf8");

    // Map audience stage to user-friendly description
    const audienceSizeMap: Record<string, string> = {
      starting: "just starting <100 followers",
      small: "small <1k followers",
      growing: "growing 1k-10k followers",
    };

    const audienceDescription = audienceSizeMap[audienceStage] || "small <1k followers";

    // Replace placeholders in prompt
    const systemPrompt = promptTemplate
      .replace("{{goal}}", goal)
      .replace("{{persona}}", persona || "indie creator")
      .replace("{{tone}}", tone)
      .replace("{{channels}}", JSON.stringify(channels))
      .replace("{{audience_size}}", audienceDescription);

    // Call OpenAI with usage logging
    await captureServer(userId, "ai_plan_generation_started", {
      goal,
      tone,
      channels,
      audienceStage,
    });

    // Create OpenAI wrapper with usage logging
    const callOpenAI = withUsageLogging(
      {
        prisma,
        openaiApiKey: process.env.OPENAI_API_KEY,
        logger: {
          debug: (msg: string, ...args: unknown[]) => console.debug(`[generate-ai-plan] ${msg}`, ...args),
          info: (msg: string, ...args: unknown[]) => console.info(`[generate-ai-plan] ${msg}`, ...args),
          warn: (msg: string, ...args: unknown[]) => console.warn(`[generate-ai-plan] ${msg}`, ...args),
          error: (msg: string, ...args: unknown[]) => console.error(`[generate-ai-plan] ${msg}`, ...args),
        },
      },
      {
        userId,
        requestType: "onboarding_plan_generation",
        apiEndpoint: "/api/onboarding/generate-ai-plan",
        model: "gpt-4o-mini",
      }
    );

    const messages: ChatMessage[] = [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: JSON.stringify({
          goal,
          persona: persona || "indie creator",
          tone,
          channels,
          audience_size: audienceDescription,
        }),
      },
    ];

    const response = await callOpenAI(messages, {
      temperature: 0.3,
      responseFormat: "json_object",
    });

    if (!response.text) {
      throw new Error("No response from OpenAI");
    }

    // Parse the AI response
    const aiPlan: AIGeneratedPlan = JSON.parse(response.text);

    await captureServer(userId, "ai_plan_generation_success", {
      pillars_count: aiPlan.pillars?.length || 0,
      drafts_count: aiPlan.week1Schedule?.length || 0,
      channels: channels.join(","),
    });

    res.status(200).json({
      success: true,
      plan: aiPlan,
    });
  } catch (error: any) {
    console.error("Error generating AI plan:", error);

    await captureServer(userId, "ai_plan_generation_error", {
      error: error?.message || "unknown",
    });

    res.status(500).json({
      error: "Failed to generate plan",
      details: error?.message,
    });
  }
}
