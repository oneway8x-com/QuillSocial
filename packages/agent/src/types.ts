import type { PrismaClient } from "@prisma/client";
import type { ZodType } from "zod";

/**
 * Bring Your Own Key (BYOK) credentials for platform-specific operations.
 */
export type BYOK = {
  x?: {
    apiKey: string;
    apiSecret: string;
    accessToken: string;
    accessSecret: string;
  };
  // Additional platforms can be added here (e.g., linkedin, facebook)
};

/**
 * Metadata for usage tracking in OpenAIUsage table.
 */
export type UsageMeta = {
  userId: number;
  teamId?: number | null;
  requestType: string; // 'chat_completion' | 'rewrite' | 'ai_write' | etc.
  apiEndpoint?: string; // e.g. '/api/agent'
  model?: string; // default 'gpt-4o-mini'
};

/**
 * Context passed to all agent operations and tools.
 */
export type AgentContext = {
  prisma: PrismaClient;
  openaiApiKey?: string; // default to process.env.OPENAI_API_KEY if omitted
  byok?: BYOK;
  logger?: Logger; // Optional logger interface
  meta?: UsageMeta; // Usage metadata for tracking
};

/**
 * Optional logger interface for debugging and monitoring.
 */
export type Logger = {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
};

/**
 * Generic tool definition with typed input/output.
 */
export type Tool<Input = unknown, Output = unknown> = {
  name: string;
  description: string;
  schema: ZodType<Input, any, any>;
  run: (args: Input, ctx: AgentContext) => Promise<Output>;
};

/**
 * Generic tool result (can be structured or plain).
 */
export type ToolResult = Record<string, unknown>;

/**
 * Input for a single agent run.
 */
export type AgentRunInput = {
  task: string;
  inputs: Record<string, unknown>;
  meta: UsageMeta;
  tools?: Tool[];
};

/**
 * Usage statistics from OpenAI API.
 */
export type UsageStats = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
};

/**
 * Response from OpenAI wrapper.
 */
export type OpenAIResponse = {
  text: string;
  usage: UsageStats;
  raw: unknown; // OpenAI.ChatCompletion
};

/**
 * Result from agent execution.
 */
export type AgentRunResult = {
  output: ToolResult | string;
  toolInvoked?: string;
  usage?: UsageStats;
};
