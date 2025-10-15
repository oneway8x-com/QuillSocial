import { z } from "zod";
import type { Tool, AgentContext } from "./types";
import { withUsageLogging } from "./openai";

/**
 * Input schema for expandOutlineTool
 */
const ExpandOutlineInputSchema = z.object({
  idea: z.string().min(1, "Idea cannot be empty"),
  tone: z.enum(["friendly", "authoritative", "contrarian"]).default("friendly"),
});

type ExpandOutlineInput = z.infer<typeof ExpandOutlineInputSchema>;

/**
 * Output type for expandOutlineTool
 */
type ExpandOutlineOutput = {
  outline: string;
  tone: string;
};

/**
 * Tool that expands a brief idea into a detailed outline.
 */
export const expandOutlineTool: Tool<ExpandOutlineInput, ExpandOutlineOutput> = {
  name: "expandOutline",
  description: "Expands a brief content idea into a detailed outline with the specified tone (friendly, authoritative, or contrarian).",
  schema: ExpandOutlineInputSchema,
  run: async (args, ctx: AgentContext): Promise<ExpandOutlineOutput> => {
    const { idea, tone } = args;

    ctx.logger?.info("Expanding outline", { idea, tone });

    const systemPrompt = `You are a content strategist helping to expand ideas into detailed outlines.
Create a structured outline that:
- Has 3-5 main sections
- Each section has 2-4 key points
- Uses a ${tone} tone throughout
- Is suitable for social media content or blog posts
- Focuses on actionable insights and clear takeaways`;

    const userPrompt = `Expand this idea into a detailed outline:

"${idea}"

Tone: ${tone}

Provide a clear, numbered outline with sections and subsections.`;

    const callOpenAI = withUsageLogging(ctx, {
      userId: ctx.meta?.userId ?? -1,
      teamId: ctx.meta?.teamId,
      requestType: ctx.meta?.requestType ?? "expand_outline",
      model: ctx.meta?.model ?? "gpt-4o-mini",
    });

    const response = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.7,
    });

    ctx.logger?.info("Outline expanded successfully");

    return {
      outline: response.text,
      tone,
    };
  },
};

/**
 * Input schema for generatePostsTool
 */
const GeneratePostsInputSchema = z.object({
  outline: z.string().min(1, "Outline cannot be empty"),
  channels: z.array(z.enum(["linkedin", "x", "carousel", "shorts", "blog"])).min(1, "At least one channel required"),
  cta: z.string().optional(),
});

type GeneratePostsInput = z.infer<typeof GeneratePostsInputSchema>;

/**
 * Output type for generatePostsTool
 */
type GeneratePostsOutput = {
  posts: Record<string, string | string[]>;
};

/**
 * Tool that generates platform-specific posts from an outline.
 */
export const generatePostsTool: Tool<GeneratePostsInput, GeneratePostsOutput> = {
  name: "generatePosts",
  description: "Generates platform-specific post drafts from an outline for specified channels (linkedin, x, carousel, shorts, blog). Optionally includes a call-to-action. Returns a JSON object with each platform as a key.",
  schema: GeneratePostsInputSchema,
  run: async (args, ctx: AgentContext): Promise<GeneratePostsOutput> => {
    const { outline, channels, cta } = args;

    ctx.logger?.info("Generating posts", { channels, hasCTA: !!cta });

    const channelGuidelines: Record<string, string> = {
      linkedin: "LinkedIn: Professional tone, 1300-2000 characters, use line breaks for readability, include relevant hashtags (3-5), engage with questions or insights.",
      x: "X/Twitter: Concise and punchy, 280 characters max per tweet, use relevant hashtags (1-3). If content requires multiple tweets, create a thread (array of tweets). Each tweet should be numbered and stand alone while contributing to the overall narrative.",
      carousel: "Carousel: 5-10 slides, each slide with a clear headline and 2-3 bullet points, visual-first approach, end with a summary slide.",
      shorts: "Shorts/Reels: Script format with hook, main points (3-5 quick tips), and strong CTA. 30-60 seconds when spoken. Include visual cues.",
      blog: "Blog: Long-form content, 800-1500 words, clear introduction, 3-5 main sections with subheadings, conclusion with key takeaways. SEO-friendly.",
    };

    const selectedGuidelines = channels
      .map((ch) => channelGuidelines[ch])
      .join("\n");

    const systemPrompt = `You are a content creator specializing in multi-platform content adaptation.
Generate platform-specific posts based on the outline provided, following these guidelines:

${selectedGuidelines}

Each post should:
- Be optimized for its specific platform
- Maintain the core message from the outline
- Be engaging and actionable
- Follow best practices for that platform

FORMATTING RULES:
- LinkedIn: NO markdown, plain text with line breaks (\\n), emojis and symbols (✓ • →) allowed
- X/Twitter: NO markdown, plain text with line breaks (\\n), emojis allowed
- Carousel: NO markdown, plain text for each slide
- Shorts/Reels: NO markdown, script format with scene descriptions
- Blog: USE markdown (##, ###, **, *, -, etc.) for proper formatting

CRITICAL: You must respond with ONLY valid JSON. Follow this example format:

Example Input: "Client reduced churn 18% by fixing handoff emails"
Example Output:
{
  "linkedin": "🎯 Client Success Story\\n\\nOur client achieved an 18% reduction in customer churn by implementing a simple yet powerful solution: fixing their handoff emails.\\n\\nThe breakthrough came from:\\n✓ Personalizing transition communications\\n✓ Setting clear expectations\\n✓ Maintaining consistent touchpoints\\n\\nResult: Stronger customer relationships and improved retention.\\n\\nWhat's one communication bottleneck you've solved recently?\\n\\n#CustomerSuccess #ChurnReduction #SaaS",
  "x": [
    "1/3 🎯 Our client reduced customer churn by 18% with one simple fix: better handoff emails.\\n\\nHere's what they did differently 👇",
    "2/3 The winning formula:\\n• Personalized transition messages\\n• Clear next-step expectations\\n• Consistent follow-up touchpoints\\n\\nSmall changes, massive impact.",
    "3/3 The lesson: Customer churn often starts with poor communication during transitions.\\n\\nFix your handoffs, fix your retention. 📊\\n\\n#CustomerSuccess #SaaS"
  ],
  "carousel": [
    "Slide 1: Client Success Story\\n\\n🎯 18% Churn Reduction\\n\\nOne simple fix: Better handoff emails",
    "Slide 2: The Problem\\n\\n• Poor transition communication\\n• Unclear expectations\\n• Lost customer confidence",
    "Slide 3: The Solution\\n\\n✓ Personalized messages\\n✓ Clear next steps\\n✓ Consistent touchpoints",
    "Slide 4: The Results\\n\\n18% reduction in churn\\nStronger relationships\\nImproved retention",
    "Slide 5: Key Takeaway\\n\\nCustomer retention starts with communication.\\n\\nFix your handoffs, fix your retention. 📊"
  ],
  "shorts": "[HOOK - 0:00-0:05]\\n(Text on screen: 18% Churn Reduction)\\nOur client cut customer churn by 18% with ONE simple change.\\n\\n[PROBLEM - 0:05-0:15]\\n(Show frustrated customer icon)\\nTheir handoff emails were losing customers during transitions.\\n\\n[SOLUTION - 0:15-0:35]\\n(Show checklist animation)\\nThey fixed three things:\\n1. Personalized every message\\n2. Set clear expectations\\n3. Added consistent follow-ups\\n\\n[RESULT - 0:35-0:50]\\n(Show upward graph)\\n18% fewer customers leaving.\\nStronger relationships.\\nBetter retention.\\n\\n[CTA - 0:50-0:60]\\n(Text: Fix Your Handoffs)\\nYour retention problem might just be a communication problem.\\nComment HANDOFF to learn more! 👇",
  "blog": "## Client Success Story: How Better Handoff Emails Reduced Churn by 18%\\n\\n### The Challenge\\n\\nOne of our clients was experiencing a **significant customer churn problem**. Despite having a great product, they were losing 18% more customers than industry average during the critical transition period after onboarding.\\n\\nThe culprit? Their handoff emails.\\n\\n### The Root Cause\\n\\nAfter analyzing their customer journey, we identified three key issues:\\n\\n- **Lack of personalization** - Generic templates that felt impersonal\\n- **Unclear expectations** - Customers didn't know what to expect next\\n- **Inconsistent communication** - Gaps in touchpoints created uncertainty\\n\\n### The Solution\\n\\nWe implemented a three-pronged approach:\\n\\n#### 1. Personalized Transition Communications\\n\\nEvery handoff email was customized based on:\\n- Customer's specific use case\\n- Their onboarding progress\\n- Their stated goals and objectives\\n\\n#### 2. Clear Expectations Setting\\n\\nEach message included:\\n- Specific next steps\\n- Timeline for follow-up\\n- Direct contact information\\n\\n#### 3. Consistent Touchpoint Maintenance\\n\\nWe established a systematic follow-up schedule:\\n- Day 1: Welcome and orientation\\n- Day 3: Check-in and support\\n- Day 7: Progress review\\n- Day 14: Success planning\\n\\n### The Results\\n\\nThe impact was immediate and measurable:\\n\\n- **18% reduction in customer churn**\\n- **Stronger customer relationships**\\n- **Improved retention metrics**\\n- **Higher customer satisfaction scores**\\n\\n### Key Takeaways\\n\\nThis case study reveals an important truth: customer churn often starts with poor communication during critical transitions. By fixing handoff emails, our client didn't just reduce churn—they built stronger, more sustainable customer relationships.\\n\\n**The lesson?** Your retention problem might just be a communication problem.\\n\\n---\\n\\n*Want to improve your customer retention? Start by auditing your handoff communications. Small changes in how you transition customers can lead to massive improvements in retention.*"
}

IMPORTANT:
- X/Twitter: ALWAYS return an array of strings (thread format), even if it's just one tweet. Each tweet ≤280 characters
- Carousel: ALWAYS return an array of strings (5-10 slides), each slide with headline and 2-3 bullet points
- Shorts/Reels: Single string with timestamped script format including visual cues
- LinkedIn: Single string, plain text with emojis and symbols, NO markdown
- Blog: Single string, proper markdown formatting with ##, ###, **, lists, etc.
- Number tweets (1/3, 2/3) and carousel slides (Slide 1:, Slide 2:)
- Only include the platforms requested in your response
- Do not include any text outside the JSON object`;

    const ctaSection = cta ? `\n\nCall-to-action to include: "${cta}"` : "";

    const userPrompt = `Create posts for the following platforms: ${channels.join(", ")}

Outline:
${outline}${ctaSection}

Return a JSON object with each platform as a key and the post content as the value.`;

    const callOpenAI = withUsageLogging(ctx, {
      userId: ctx.meta?.userId ?? -1,
      teamId: ctx.meta?.teamId,
      requestType: ctx.meta?.requestType ?? "generate_posts",
      model: ctx.meta?.model ?? "gpt-4o-mini",
    });

    const response = await callOpenAI([
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.8, // Higher temperature for more creative variations
      responseFormat: "json_object", // Force JSON mode
    });

    ctx.logger?.info("Posts generated successfully", {
      channels,
      responseLength: response.text.length
    });

    // Parse the JSON response
    let posts: Record<string, string>;
    try {
      posts = JSON.parse(response.text);
    } catch (error) {
      ctx.logger?.error("Failed to parse JSON response", { error, response: response.text });
      throw new Error("Failed to parse AI response as JSON");
    }

    return {
      posts,
    };
  },
};
