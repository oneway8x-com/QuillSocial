/**
 * Example usage of @quill/agent package
 *
 * This file demonstrates various ways to use the Agent SDK
 */

import { createQuillAgent, contentTools, engagementTools, scheduleTools } from "@quill/agent";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Example 1: Basic agent with content tools
async function basicExample() {
  const agent = createQuillAgent(
    {
      prisma,
      openaiApiKey: process.env.OPENAI_API_KEY,
      logger: console, // Optional: use console for logging
    },
    contentTools()
  );

  const result = await agent.run({
    task: "Expand this idea into an outline",
    inputs: {
      idea: "Client reduced churn 18% by fixing handoff emails",
      tone: "authoritative"
    },
    meta: {
      userId: 123,
      teamId: 45,
      requestType: "expand_outline",
      apiEndpoint: "/api/agent",
    },
  });

  console.log("Tool invoked:", result.toolInvoked);
  console.log("Output:", result.output);
  console.log("Usage:", result.usage);
}

// Example 2: Generate posts from outline
async function generatePostsExample() {
  const agent = createQuillAgent({ prisma }, contentTools());

  const result = await agent.run({
    task: "Generate posts for LinkedIn and X",
    inputs: {
      outline: `
        1. Introduction to email automation
        2. Key benefits (time savings, consistency)
        3. How we reduced churn by 18%
        4. Implementation tips
      `,
      channels: ["linkedin", "x"],
      cta: "Learn more at example.com",
    },
    meta: {
      userId: 123,
      requestType: "generate_posts",
    },
  });

  console.log("Generated posts:", result.output);
}

// Example 3: Engagement scoring with BYOK
async function engagementExample() {
  const agent = createQuillAgent(
    {
      prisma,
      byok: {
        x: {
          apiKey: process.env.X_API_KEY!,
          apiSecret: process.env.X_API_SECRET!,
          accessToken: process.env.X_ACCESS_TOKEN!,
          accessSecret: process.env.X_ACCESS_SECRET!,
        },
      },
    },
    engagementTools()
  );

  const result = await agent.run({
    task: "Find top engagement opportunities",
    inputs: {
      limit: 10,
      pillars: ["AI", "SaaS", "Content Marketing"],
    },
    meta: {
      userId: 123,
      requestType: "score_feed",
    },
  });

  console.log("Engagement items:", result.output);
}

// Example 4: Schedule a post
async function scheduleExample() {
  const agent = createQuillAgent({ prisma }, scheduleTools());

  const tomorrow = new Date(Date.now() + 86400000).toISOString();

  const result = await agent.run({
    task: "Schedule a LinkedIn post",
    inputs: {
      channel: "linkedin",
      title: "5 Ways to Improve Customer Onboarding",
      whenISO: tomorrow,
    },
    meta: {
      userId: 123,
      requestType: "schedule_post",
    },
  });

  console.log("Scheduled:", result.output);
}

// Example 5: Using all tools together
async function fullExample() {
  const agent = createQuillAgent({ prisma });

  // Register all tool categories
  agent.register(
    ...contentTools(),
    ...engagementTools(),
    ...scheduleTools()
  );

  console.log(`Agent ready with ${agent.tools.length} tools`);

  // Now the agent can intelligently choose from all available tools
  const result = await agent.run({
    task: "Create and schedule a post about our latest feature",
    inputs: {
      feature: "AI-powered content suggestions",
      channel: "linkedin",
      when: new Date(Date.now() + 86400000).toISOString(),
    },
    meta: {
      userId: 123,
      requestType: "create_and_schedule",
    },
  });

  console.log(result);
}

// Example 6: Custom tool
async function customToolExample() {
  const { z } = await import("zod");
  const { Tool } = await import("@quill/agent");

  const customTool = {
    name: "analyzeMetrics",
    description: "Analyzes social media metrics and provides insights",
    schema: z.object({
      platform: z.enum(["linkedin", "x", "instagram"]),
      dateRange: z.string(),
    }),
    run: async (args: any, ctx: any) => {
      // Custom logic here
      return {
        insights: `Analyzed ${args.platform} metrics for ${args.dateRange}`,
        recommendations: ["Post more frequently", "Use more visuals"],
      };
    },
  };

  const agent = createQuillAgent({ prisma });
  agent.register(customTool);

  const result = await agent.run({
    task: "Analyze my LinkedIn performance",
    inputs: {
      platform: "linkedin",
      dateRange: "last-30-days",
    },
    meta: {
      userId: 123,
      requestType: "analyze_metrics",
    },
  });

  console.log(result);
}

// Run examples (comment out as needed)
if (require.main === module) {
  Promise.all([
    // basicExample(),
    // generatePostsExample(),
    // engagementExample(),
    // scheduleExample(),
    // fullExample(),
    // customToolExample(),
  ])
    .then(() => console.log("✅ Examples completed"))
    .catch((err) => console.error("❌ Error:", err))
    .finally(() => prisma.$disconnect());
}
