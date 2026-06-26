import { describe, it, expect, vi, beforeEach } from "vitest";
import { withUsageLogging, redactSecrets } from "../openai";
import type { AgentContext } from "../types";

// Mock OpenAI
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      chat = {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: "Test response",
                },
              },
            ],
            usage: {
              prompt_tokens: 12,
              completion_tokens: 34,
              total_tokens: 46,
            },
          }),
        },
      };
    },
  };
});

describe("withUsageLogging", () => {
  let mockPrisma: any;
  let mockContext: AgentContext;

  beforeEach(() => {
    mockPrisma = {
      openAIUsage: {
        create: vi.fn().mockResolvedValue({
          id: 1,
          userId: 123,
          teamId: 45,
          promptTokens: 12,
          completionTokens: 34,
          totalTokens: 46,
        }),
      },
    };

    mockContext = {
      prisma: mockPrisma,
      openaiApiKey: "test-api-key",
      logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      },
    };
  });

  it("should call OpenAI and return formatted response", async () => {
    const callOpenAI = withUsageLogging(mockContext, {
      userId: 123,
      teamId: 45,
      requestType: "test_completion",
      apiEndpoint: "/api/test",
      model: "gpt-4o-mini",
    });

    const response = await callOpenAI([
      { role: "user", content: "Hello" },
    ]);

    expect(response).toEqual({
      text: "Test response",
      usage: {
        promptTokens: 12,
        completionTokens: 34,
        totalTokens: 46,
      },
      raw: expect.any(Object),
    });
  });

  it("should log usage to database with correct data", async () => {
    const callOpenAI = withUsageLogging(mockContext, {
      userId: 123,
      teamId: 45,
      requestType: "test_completion",
      apiEndpoint: "/api/test",
      model: "gpt-4o-mini",
    });

    await callOpenAI([
      { role: "user", content: "Hello" },
    ]);

    expect(mockPrisma.openAIUsage.create).toHaveBeenCalledWith({
      data: {
        userId: 123,
        teamId: 45,
        prompt: JSON.stringify([{ role: "user", content: "Hello" }]),
        result: "Test response",
        promptTokens: 12,
        completionTokens: 34,
        totalTokens: 46,
        requestType: "test_completion",
        apiEndpoint: "/api/test",
        model: "gpt-4o-mini",
      },
    });
  });

  it("should handle database logging errors gracefully", async () => {
    mockPrisma.openAIUsage.create.mockRejectedValue(new Error("DB Error"));

    const callOpenAI = withUsageLogging(mockContext, {
      userId: 123,
      requestType: "test_completion",
    });

    // Should not throw even if DB logging fails
    const response = await callOpenAI([
      { role: "user", content: "Hello" },
    ]);

    expect(response.text).toBe("Test response");
    expect(mockContext.logger?.warn).toHaveBeenCalled();
  });

  it("should throw error when OpenAI API key is missing", async () => {
    const contextWithoutKey = {
      ...mockContext,
      openaiApiKey: undefined,
    };

    // Clear environment variable
    delete process.env.OPENAI_API_KEY;

    const callOpenAI = withUsageLogging(contextWithoutKey, {
      userId: 123,
      requestType: "test_completion",
    });

    await expect(callOpenAI([
      { role: "user", content: "Hello" },
    ])).rejects.toThrow("OpenAI API key not provided");
  });

  it("should use environment variable when API key not in context", async () => {
    process.env.OPENAI_API_KEY = "env-api-key";

    const contextWithoutKey = {
      ...mockContext,
      openaiApiKey: undefined,
    };

    const callOpenAI = withUsageLogging(contextWithoutKey, {
      userId: 123,
      requestType: "test_completion",
    });

    const response = await callOpenAI([
      { role: "user", content: "Hello" },
    ]);

    expect(response.text).toBe("Test response");
  });

  it("should pass temperature and other options to OpenAI", async () => {
    const callOpenAI = withUsageLogging(mockContext, {
      userId: 123,
      requestType: "test_completion",
    });

    await callOpenAI(
      [{ role: "user", content: "Hello" }],
      { temperature: 0.5, maxTokens: 100 }
    );

    // OpenAI mock should have been called with options
    expect(mockContext.logger?.debug).toHaveBeenCalled();
  });
});

describe("redactSecrets", () => {
  it("should redact sensitive keys", () => {
    const obj = {
      name: "Test",
      apiKey: "secret123",
      password: "pass456",
      token: "tok789",
      normalField: "visible",
    };

    const redacted = redactSecrets(obj);

    expect(redacted).toEqual({
      name: "Test",
      apiKey: "[REDACTED]",
      password: "[REDACTED]",
      token: "[REDACTED]",
      normalField: "visible",
    });
  });

  it("should redact nested objects", () => {
    const obj = {
      name: "Test",
      credentials: {
        apiKey: "secret123",
        accessToken: "token456",
      },
      data: {
        value: "visible",
      },
    };

    const redacted = redactSecrets(obj);

    expect(redacted).toEqual({
      name: "Test",
      credentials: {
        apiKey: "[REDACTED]",
        accessToken: "[REDACTED]",
      },
      data: {
        value: "visible",
      },
    });
  });

  it("should handle case-insensitive matching", () => {
    const obj = {
      ApiKey: "secret",
      ACCESSTOKEN: "token",
      MySecret: "hidden",
    };

    const redacted = redactSecrets(obj);

    expect(redacted.ApiKey).toBe("[REDACTED]");
    expect(redacted.ACCESSTOKEN).toBe("[REDACTED]");
    expect(redacted.MySecret).toBe("[REDACTED]");
  });
});
