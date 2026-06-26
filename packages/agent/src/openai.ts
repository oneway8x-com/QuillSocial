import OpenAI from "openai";
import type { AgentContext, UsageMeta, OpenAIResponse, UsageStats } from "./types";

/**
 * Options for OpenAI chat completion.
 */
export type OpenAIOptions = {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  responseFormat?: "text" | "json_object";
};

/**
 * Message format for OpenAI chat completions.
 */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Creates an OpenAI wrapper that logs usage to the database.
 *
 * @param ctx - Agent context with Prisma client and OpenAI API key
 * @param meta - Metadata for usage tracking
 * @returns Function that calls OpenAI and logs usage
 */
export function withUsageLogging(
  ctx: AgentContext,
  meta: UsageMeta
): (messages: ChatMessage[], opts?: OpenAIOptions) => Promise<OpenAIResponse> {
  return async (messages: ChatMessage[], opts?: OpenAIOptions): Promise<OpenAIResponse> => {
    const apiKey = ctx.openaiApiKey ?? process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error("OpenAI API key not provided in context or environment");
    }

    const openai = new OpenAI({ apiKey });
    const model = meta.model ?? "gpt-4o-mini";

    ctx.logger?.debug(`Calling OpenAI with model: ${model}`, { meta });

    let completion: OpenAI.ChatCompletion;
    try {
      completion = await openai.chat.completions.create({
        model,
        messages,
        temperature: opts?.temperature ?? 0.7,
        max_tokens: opts?.maxTokens,
        top_p: opts?.topP,
        response_format: opts?.responseFormat === "json_object" ? { type: "json_object" } : undefined,
      });
    } catch (error) {
      ctx.logger?.error("OpenAI API call failed", error);

      // Sanitize error message
      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown OpenAI API error";

      throw new Error(`OpenAI API call failed: ${errorMessage}`);
    }

    const assistantMessage = completion.choices[0]?.message?.content ?? "";
    const usage = completion.usage;

    const usageStats: UsageStats = {
      promptTokens: usage?.prompt_tokens ?? 0,
      completionTokens: usage?.completion_tokens ?? 0,
      totalTokens: usage?.total_tokens ?? 0,
    };

    ctx.logger?.info("OpenAI call successful", {
      model,
      usage: usageStats,
      requestType: meta.requestType
    });

    // Log usage to database (non-blocking on failure)
    try {
      await ctx.prisma.openAIUsage.create({
        data: {
          userId: meta.userId,
          teamId: meta.teamId ?? null,
          prompt: JSON.stringify(messages),
          result: assistantMessage,
          promptTokens: usageStats.promptTokens,
          completionTokens: usageStats.completionTokens,
          totalTokens: usageStats.totalTokens,
          requestType: meta.requestType,
          apiEndpoint: meta.apiEndpoint ?? null,
          model,
        },
      });

      ctx.logger?.debug("Usage logged to database", {
        userId: meta.userId,
        tokens: usageStats.totalTokens
      });
    } catch (dbError) {
      // Don't throw - just warn and continue
      ctx.logger?.warn("Failed to log usage to database", dbError);
      console.warn("[withUsageLogging] Failed to log usage:", dbError);
    }

    return {
      text: assistantMessage,
      usage: usageStats,
      raw: completion,
    };
  };
}

/**
 * Redacts sensitive information from objects before logging.
 *
 * @param obj - Object to redact
 * @returns Redacted copy of object
 */
export function redactSecrets<T extends Record<string, unknown>>(obj: T): T {
  const redacted = { ...obj };
  const sensitiveKeys = [
    "apiKey",
    "apiSecret",
    "accessToken",
    "accessSecret",
    "password",
    "secret",
    "token",
  ];

  for (const key in redacted) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
      redacted[key] = "[REDACTED]" as T[Extract<keyof T, string>];
    } else if (typeof redacted[key] === "object" && redacted[key] !== null) {
      redacted[key] = redactSecrets(redacted[key] as Record<string, unknown>) as T[Extract<keyof T, string>];
    }
  }

  return redacted;
}
