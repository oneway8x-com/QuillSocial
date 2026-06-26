import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQuillAgent } from "../agent";
import type { AgentContext, Tool } from "../types";
import { z } from "zod";

// Mock the OpenAI module
vi.mock("../openai", () => ({
  withUsageLogging: vi.fn().mockImplementation((ctx, meta) => {
    return vi.fn().mockResolvedValue({
      text: JSON.stringify({
        tool: "testTool",
        args: { input: "test" },
      }),
      usage: {
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      },
      raw: {},
    });
  }),
}));

describe("createQuillAgent", () => {
  let mockPrisma: any;
  let mockContext: AgentContext;
  let testTool: Tool<{ input: string }, { output: string }>;

  beforeEach(() => {
    mockPrisma = {
      openAIUsage: {
        create: vi.fn(),
      },
    };

    mockContext = {
      prisma: mockPrisma,
      openaiApiKey: "test-key",
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };

    testTool = {
      name: "testTool",
      description: "A test tool",
      schema: z.object({
        input: z.string(),
      }),
      run: vi.fn().mockResolvedValue({ output: "test result" }),
    };
  });

  it("should create an agent with base tools", () => {
    const agent = createQuillAgent(mockContext, [testTool]);

    expect(agent).toHaveProperty("run");
    expect(agent).toHaveProperty("tools");
    expect(agent).toHaveProperty("register");
    expect(agent.tools).toHaveLength(1);
    expect(agent.tools[0].name).toBe("testTool");
  });

  it("should register additional tools", () => {
    const agent = createQuillAgent(mockContext);

    expect(agent.tools).toHaveLength(0);

    agent.register(testTool);

    expect(agent.tools).toHaveLength(1);
    expect(mockContext.logger?.debug).toHaveBeenCalled();
  });

  it("should execute tool when run is called", async () => {
    const agent = createQuillAgent(mockContext, [testTool]);

    const result = await agent.run({
      task: "Test task",
      inputs: { data: "test" },
      meta: {
        userId: 123,
        requestType: "test",
      },
    });

    expect(testTool.run).toHaveBeenCalled();
    expect(result).toHaveProperty("output");
    expect(result).toHaveProperty("toolInvoked");
    expect(result).toHaveProperty("usage");
    expect(result.toolInvoked).toBe("testTool");
  });

  it("should prioritize input tools over registered tools", async () => {
    const registeredTool: Tool = {
      name: "registeredTool",
      description: "Registered tool",
      schema: z.object({}),
      run: vi.fn().mockResolvedValue({ data: "registered" }),
    };

    const inputTool: Tool = {
      name: "inputTool",
      description: "Input tool",
      schema: z.object({}),
      run: vi.fn().mockResolvedValue({ data: "input" }),
    };

    const agent = createQuillAgent(mockContext, [registeredTool]);

    // Mock withUsageLogging to return inputTool selection
    const { withUsageLogging } = await import("../openai");
    vi.mocked(withUsageLogging).mockImplementation((ctx, meta) => {
      return vi.fn().mockResolvedValue({
        text: JSON.stringify({
          tool: "inputTool",
          args: {},
        }),
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        raw: {},
      });
    });

    await agent.run({
      task: "Test task",
      inputs: {},
      meta: {
        userId: 123,
        requestType: "test",
      },
      tools: [inputTool],
    });

    expect(inputTool.run).toHaveBeenCalled();
    expect(registeredTool.run).not.toHaveBeenCalled();
  });

  it("should handle direct answer when no tools available", async () => {
    const { withUsageLogging } = await import("../openai");
    vi.mocked(withUsageLogging).mockImplementation((ctx, meta) => {
      return vi.fn().mockResolvedValue({
        text: "Direct answer without tools",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        raw: {},
      });
    });

    const agent = createQuillAgent(mockContext);

    const result = await agent.run({
      task: "Simple question",
      inputs: {},
      meta: {
        userId: 123,
        requestType: "test",
      },
    });

    expect(result.output).toBe("Direct answer without tools");
    expect(result.toolInvoked).toBeUndefined();
    expect(mockContext.logger?.warn).toHaveBeenCalledWith(
      expect.stringContaining("No tools available")
    );
  });

  it("should validate tool arguments with schema", async () => {
    const strictTool: Tool<{ required: string }, { result: string }> = {
      name: "strictTool",
      description: "Tool with strict schema",
      schema: z.object({
        required: z.string().min(1),
      }),
      run: vi.fn().mockResolvedValue({ result: "success" }),
    };

    const agent = createQuillAgent(mockContext, [strictTool]);

    const { withUsageLogging } = await import("../openai");
    vi.mocked(withUsageLogging).mockImplementation((ctx, meta) => {
      return vi.fn().mockResolvedValue({
        text: JSON.stringify({
          tool: "strictTool",
          args: { required: "" }, // Invalid: empty string
        }),
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        raw: {},
      });
    });

    await expect(
      agent.run({
        task: "Test",
        inputs: {},
        meta: { userId: 123, requestType: "test" },
      })
    ).rejects.toThrow();
  });

  it("should throw error when selected tool not found", async () => {
    const agent = createQuillAgent(mockContext, [testTool]);

    const { withUsageLogging } = await import("../openai");
    vi.mocked(withUsageLogging).mockImplementation((ctx, meta) => {
      return vi.fn().mockResolvedValue({
        text: JSON.stringify({
          tool: "nonExistentTool",
          args: {},
        }),
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        raw: {},
      });
    });

    await expect(
      agent.run({
        task: "Test",
        inputs: {},
        meta: { userId: 123, requestType: "test" },
      })
    ).rejects.toThrow('Selected tool "nonExistentTool" not found');
  });
});
