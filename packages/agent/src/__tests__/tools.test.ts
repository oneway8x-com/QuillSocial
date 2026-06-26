import { describe, it, expect, vi } from "vitest";
import { expandOutlineTool, generatePostsTool } from "../tools.content";
import { listTargetsTool, scoreFeedTool } from "../tools.engage";
import { schedulePostTool } from "../tools.schedule";
import type { AgentContext } from "../types";

// Mock OpenAI
vi.mock("../openai");

describe("Content Tools", () => {
  const mockContext: AgentContext = {
    prisma: {} as any,
    openaiApiKey: "test-key",
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };

  describe("expandOutlineTool", () => {
    it("should have correct metadata", () => {
      expect(expandOutlineTool.name).toBe("expandOutline");
      expect(expandOutlineTool.description).toContain("outline");
      expect(expandOutlineTool.schema).toBeDefined();
    });

    it("should validate input with schema", () => {
      const validInput = {
        idea: "Test idea",
        tone: "friendly" as const,
      };

      const result = expandOutlineTool.schema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should reject empty idea", () => {
      const invalidInput = {
        idea: "",
        tone: "friendly" as const,
      };

      const result = expandOutlineTool.schema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("should default tone to friendly", () => {
      const input = {
        idea: "Test idea",
      };

      const result = expandOutlineTool.schema.parse(input);
      expect(result.tone).toBe("friendly");
    });
  });

  describe("generatePostsTool", () => {
    it("should have correct metadata", () => {
      expect(generatePostsTool.name).toBe("generatePosts");
      expect(generatePostsTool.description).toContain("platform-specific");
      expect(generatePostsTool.schema).toBeDefined();
    });

    it("should validate input with schema", () => {
      const validInput = {
        outline: "Test outline",
        channels: ["linkedin", "x"] as const,
        cta: "Learn more",
      };

      const result = generatePostsTool.schema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("should require at least one channel", () => {
      const invalidInput = {
        outline: "Test outline",
        channels: [],
      };

      const result = generatePostsTool.schema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});

describe("Engagement Tools", () => {
  const mockContext: AgentContext = {
    prisma: {} as any,
    openaiApiKey: "test-key",
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };

  describe("listTargetsTool", () => {
    it("should have correct metadata", () => {
      expect(listTargetsTool.name).toBe("listTargets");
      expect(listTargetsTool.description).toContain("engagement");
    });

    it("should return targets", async () => {
      const result = await listTargetsTool.run({}, mockContext);

      expect(result).toHaveProperty("targets");
      expect(Array.isArray(result.targets)).toBe(true);
      expect(result.targets.length).toBeGreaterThan(0);
    });

    it("should return properly structured targets", async () => {
      const result = await listTargetsTool.run({}, mockContext);

      const target = result.targets[0];
      expect(target).toHaveProperty("handle");
      expect(target).toHaveProperty("platform");
      expect(target).toHaveProperty("list");
    });
  });

  describe("scoreFeedTool", () => {
    it("should have correct metadata", () => {
      expect(scoreFeedTool.name).toBe("scoreFeed");
      expect(scoreFeedTool.description).toContain("scores");
    });

    it("should accept limit parameter", async () => {
      const result = await scoreFeedTool.run({ limit: 5 }, mockContext);

      expect(result).toHaveProperty("items");
      expect(result.items.length).toBeLessThanOrEqual(5);
    });

    it("should return properly structured items", async () => {
      const result = await scoreFeedTool.run({ limit: 10 }, mockContext);

      const item = result.items[0];
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("platform");
      expect(item).toHaveProperty("author");
      expect(item).toHaveProperty("handle");
      expect(item).toHaveProperty("stats");
      expect(item.stats).toHaveProperty("likes");
      expect(item.stats).toHaveProperty("comments");
    });

    it("should indicate BYOK usage", async () => {
      const contextWithBYOK: AgentContext = {
        ...mockContext,
        byok: {
          x: {
            apiKey: "key",
            apiSecret: "secret",
            accessToken: "token",
            accessSecret: "secret",
          },
        },
      };

      const result = await scoreFeedTool.run({ limit: 10 }, contextWithBYOK);

      expect(result.usedBYOK).toBe(true);
    });
  });
});

describe("Schedule Tools", () => {
  const mockContext: AgentContext = {
    prisma: {} as any,
    openaiApiKey: "test-key",
    logger: {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    },
  };

  describe("schedulePostTool", () => {
    it("should have correct metadata", () => {
      expect(schedulePostTool.name).toBe("schedulePost");
      expect(schedulePostTool.description).toContain("schedule");
    });

    it("should validate future date", async () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString(); // Tomorrow

      const result = await schedulePostTool.run(
        {
          channel: "linkedin",
          title: "Test post",
          whenISO: futureDate,
        },
        mockContext
      );

      expect(result).toHaveProperty("id");
      expect(result.status).toBe("scheduled");
    });

    it("should reject past dates", async () => {
      const pastDate = new Date(Date.now() - 86400000).toISOString(); // Yesterday

      await expect(
        schedulePostTool.run(
          {
            channel: "linkedin",
            title: "Test post",
            whenISO: pastDate,
          },
          mockContext
        )
      ).rejects.toThrow("Scheduled date must be in the future");
    });

    it("should validate ISO date string", () => {
      const invalidInput = {
        channel: "linkedin",
        title: "Test",
        whenISO: "not-a-date",
      };

      const result = schedulePostTool.schema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });
  });
});
