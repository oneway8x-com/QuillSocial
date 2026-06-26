import { z } from "zod";
import type { AgentContext, AgentRunInput, AgentRunResult, Tool, ToolResult, UsageMeta, UsageStats } from "./types";
import { withUsageLogging } from "./openai";

/**
 * QuillAgent interface with tool registration and execution.
 */
export type QuillAgent = {
  run: (input: AgentRunInput) => Promise<AgentRunResult>;
  tools: Tool<any, any>[];
  register: (...tools: Tool<any, any>[]) => void;
};

/**
 * Schema for tool selection response from OpenAI.
 */
const ToolSelectionSchema = z.object({
  tool: z.string(),
  args: z.record(z.unknown()),
});

/**
 * Schema for direct answer response from OpenAI.
 */
const DirectAnswerSchema = z.object({
  answer: z.string(),
});

/**
 * Creates a QuillAgent instance with tool orchestration capabilities.
 *
 * @param ctx - Agent context with Prisma client and configuration
 * @param baseTools - Optional initial set of tools to register
 * @returns QuillAgent instance
 */
export function createQuillAgent(
  ctx: AgentContext,
  baseTools: Tool<any, any>[] = []
): QuillAgent {
  const registeredTools: Tool<any, any>[] = [...baseTools];

  /**
   * Registers additional tools to the agent.
   */
  const register = (...tools: Tool<any, any>[]): void => {
    registeredTools.push(...tools);
    ctx.logger?.debug(`Registered ${tools.length} tool(s)`, {
      toolNames: tools.map((t) => t.name),
    });
  };

  /**
   * Executes an agent run: plans which tool to use and executes it.
   */
  const run = async (input: AgentRunInput): Promise<AgentRunResult> => {
    const { task, inputs, meta, tools: inputTools } = input;

    // Determine available tools (prioritize input tools)
    const availableTools = inputTools && inputTools.length > 0
      ? inputTools
      : registeredTools;

    if (availableTools.length === 0) {
      ctx.logger?.warn("No tools available, using direct answer mode");
      return await handleDirectAnswer(ctx, task, inputs, meta);
    }

    ctx.logger?.info(`Running agent with ${availableTools.length} available tool(s)`, {
      task,
      toolNames: availableTools.map((t) => t.name),
    });

    // Step 1: Use OpenAI to select the appropriate tool
    const toolSelection = await selectTool(ctx, task, inputs, availableTools, meta);

    if (toolSelection.type === "direct") {
      return {
        output: toolSelection.answer,
        usage: toolSelection.usage,
      };
    }

    // Step 2: Execute the selected tool
    const selectedTool = availableTools.find((t) => t.name === toolSelection.toolName);

    if (!selectedTool) {
      throw new Error(`Selected tool "${toolSelection.toolName}" not found in available tools`);
    }

    ctx.logger?.info(`Executing tool: ${selectedTool.name}`, {
      args: toolSelection.args,
    });

    try {
      // Validate tool arguments with schema
      const validatedArgs = selectedTool.schema.parse(toolSelection.args);

      // Create context with meta for tool execution
      const toolCtx = { ...ctx, meta };

      // Execute the tool
      const output = await selectedTool.run(validatedArgs, toolCtx);

      ctx.logger?.info(`Tool execution successful: ${selectedTool.name}`);

      return {
        output: output as ToolResult,
        toolInvoked: selectedTool.name,
        usage: toolSelection.usage,
      };
    } catch (error) {
      ctx.logger?.error(`Tool execution failed: ${selectedTool.name}`, error);

      const errorMessage = error instanceof Error
        ? error.message
        : "Unknown tool execution error";

      throw new Error(`Tool "${selectedTool.name}" execution failed: ${errorMessage}`);
    }
  };

  return {
    run,
    tools: registeredTools,
    register,
  };
}

/**
 * Uses OpenAI to select the appropriate tool based on task and inputs.
 */
async function selectTool(
  ctx: AgentContext,
  task: string,
  inputs: Record<string, unknown>,
  availableTools: Tool<any, any>[],
  meta: UsageMeta
): Promise<
  | { type: "tool"; toolName: string; args: Record<string, unknown>; usage: UsageStats }
  | { type: "direct"; answer: string; usage: UsageStats }
> {
  const toolDescriptions = availableTools
    .map((tool) => `- ${tool.name}: ${tool.description}`)
    .join("\n");

  const systemPrompt = `You are an AI agent planner. Your job is to select the most appropriate tool to complete the user's task.

Available tools:
${toolDescriptions}

If the task can be answered directly without tools (e.g., simple rewrite or direct answer), respond with:
{
  "answer": "your direct answer here"
}

Otherwise, respond with ONLY a JSON object in this format:
{
  "tool": "tool_name",
  "args": { "key": "value" }
}

The tool name MUST match one of the available tools exactly. The args must match the tool's expected input schema.`;

  const userPrompt = `Task: ${task}

Input data:
${JSON.stringify(inputs, null, 2)}

Select the appropriate tool and provide the arguments, or answer directly if no tool is needed.`;

  const callOpenAI = withUsageLogging(ctx, {
    ...meta,
    requestType: "tool_selection",
  });

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ], {
    temperature: 0.3, // Lower temperature for more deterministic tool selection
  });

  ctx.logger?.debug("Tool selection response", { response: response.text });

  // Try to parse as tool selection first
  try {
    const parsed = JSON.parse(response.text);

    // Check if it's a direct answer
    if ("answer" in parsed && typeof parsed.answer === "string") {
      const validated = DirectAnswerSchema.parse(parsed);
      return {
        type: "direct",
        answer: validated.answer,
        usage: response.usage,
      };
    }

    // Otherwise, validate as tool selection
    const validated = ToolSelectionSchema.parse(parsed);
    return {
      type: "tool",
      toolName: validated.tool,
      args: validated.args,
      usage: response.usage,
    };
  } catch (parseError) {
    ctx.logger?.error("Failed to parse tool selection response", parseError);
    throw new Error(`Invalid tool selection response from OpenAI: ${response.text}`);
  }
}

/**
 * Handles direct answer mode when no tools are available or appropriate.
 */
async function handleDirectAnswer(
  ctx: AgentContext,
  task: string,
  inputs: Record<string, unknown>,
  meta: UsageMeta
): Promise<AgentRunResult> {
  const callOpenAI = withUsageLogging(ctx, {
    ...meta,
    requestType: "direct_answer",
  });

  const systemPrompt = "You are a helpful AI assistant. Provide a clear and concise answer to the user's task.";
  const userPrompt = `Task: ${task}

Input data:
${JSON.stringify(inputs, null, 2)}

Provide your answer:`;

  const response = await callOpenAI([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);

  return {
    output: response.text,
    usage: response.usage,
  };
}
