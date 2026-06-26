import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";
import handler from "../../../pages/api/onboarding/generate-ai-plan";

// Mock dependencies
vi.mock("@quillsocial/features/auth/lib/getServerSession");
vi.mock("@quillsocial/lib/posthog");
vi.mock("@quill/agent");
vi.mock("@quillsocial/prisma");
vi.mock("fs");
vi.mock("path");

import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";
import { withUsageLogging } from "@quill/agent";
import prisma from "@quillsocial/prisma";
import fs from "fs";
import path from "path";

describe("generate-ai-plan API endpoint", () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;
  let jsonMock: ReturnType<typeof vi.fn>;
  let statusMock: ReturnType<typeof vi.fn>;

  const mockAIPlan = {
    planId: "plan-123",
    purpose: "Build authority in SaaS development",
    persona: "indie creator",
    tone: ["helpful", "technical"],
    pillars: [
      {
        name: "Product Updates",
        why: "Show progress and build in public",
        exampleTopics: ["Feature launches", "Behind the scenes", "User feedback"],
      },
      {
        name: "Technical Insights",
        why: "Demonstrate expertise",
        exampleTopics: ["Architecture decisions", "Performance tips", "Best practices"],
      },
      {
        name: "Founder Journey",
        why: "Build personal connection",
        exampleTopics: ["Lessons learned", "Challenges faced", "Milestone celebrations"],
      },
    ],
    cadence: {
      linkedin: {
        perWeek: 3,
        days: ["Monday", "Wednesday", "Friday"],
        postTypes: ["text", "carousel"],
      },
      x: {
        perWeek: 5,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        postTypes: ["text", "thread"],
      },
    },
    week1Schedule: [
      {
        date: "2025-10-20",
        channel: "linkedin",
        draft: {
          title: "Why we chose Next.js for QuillSocial",
          hook: "We evaluated 5 frameworks. Here's why we picked Next.js 👇",
          outline: [
            "Server-side rendering for SEO",
            "API routes for backend logic",
            "Easy deployment on Vercel",
            "Great developer experience",
          ],
          cta: "What framework are you using? Drop it below 👇",
          replies: [
            "Great choice! We're using Next.js too and loving it.",
            "Have you tried [alternative]? How does it compare?",
            "The DX is unmatched. How's your build performance?",
          ],
        },
      },
      {
        date: "2025-10-21",
        channel: "x",
        draft: {
          title: "Day 1 of building in public",
          hook: "Just shipped our first feature. Here's what I learned 🧵",
          outline: ["User feedback is gold", "Ship fast, iterate faster", "Build what users want"],
          cta: "Follow along for more updates 🚀",
          replies: [
            "Love the transparency! Following your journey.",
            "What's the feature? I want to try it!",
            "Building in public is the way. Keep going!",
          ],
        },
      },
    ],
    engagementPlan: {
      meaningfulRepliesPerDay: 5,
      personasToEngage: ["SaaS founders", "Indie hackers", "Tech leads"],
      topics: ["Product development", "Building in public", "SaaS growth"],
    },
    metrics: {
      weeklyPostTarget: 8,
      dailyReplyTarget: 5,
    },
  };

  beforeEach(() => {
    jsonMock = vi.fn();
    statusMock = vi.fn(() => ({ json: jsonMock }));

    mockReq = {
      method: "POST",
      body: {
        goal: "Build authority in SaaS development",
        persona: "indie creator",
        tone: "helpful",
        channels: ["linkedin", "x"],
        audienceStage: "small",
      },
    };

    mockRes = {
      status: statusMock as any,
      json: jsonMock,
    };

    // Mock getServerSession
    vi.mocked(getServerSession).mockResolvedValue({
      user: { id: 123, email: "test@example.com" },
    } as any);

    // Mock captureServer
    vi.mocked(captureServer).mockResolvedValue(undefined as any);

    // Mock fs.readFileSync
    vi.mocked(fs.readFileSync).mockReturnValue(`You are Quill Social's Growth Copilot.
Goal: {{goal}}
Persona: {{persona}}
Tone: {{tone}}
Channels: {{channels}}
Audience Size: {{audience_size}}`);

    // Mock path.join
    vi.mocked(path.join).mockReturnValue("/mock/path/to/prompt.txt");

    // Mock withUsageLogging
    const mockCallOpenAI = vi.fn().mockResolvedValue({
      text: JSON.stringify(mockAIPlan),
      usage: {
        promptTokens: 500,
        completionTokens: 1000,
        totalTokens: 1500,
      },
    });
    vi.mocked(withUsageLogging).mockReturnValue(mockCallOpenAI);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Request validation", () => {
    it("should return 405 for non-POST requests", async () => {
      mockReq.method = "GET";

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(405);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Method not allowed" });
    });

    it("should return 401 if user is not authenticated", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: "Unauthorized" });
    });

    it("should return 400 if goal is missing", async () => {
      mockReq.body = {
        ...mockReq.body,
        goal: "",
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing required fields: goal, tone, channels",
      });
    });

    it("should return 400 if tone is missing", async () => {
      mockReq.body = {
        ...mockReq.body,
        tone: "",
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing required fields: goal, tone, channels",
      });
    });

    it("should return 400 if channels is empty", async () => {
      mockReq.body = {
        ...mockReq.body,
        channels: [],
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Missing required fields: goal, tone, channels",
      });
    });
  });

  describe("AI plan generation", () => {
    it("should successfully generate an AI plan", async () => {
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        plan: mockAIPlan,
      });
    });

    it("should call withUsageLogging with correct parameters", async () => {
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(withUsageLogging).toHaveBeenCalledWith(
        expect.objectContaining({
          prisma,
          openaiApiKey: process.env.OPENAI_API_KEY,
          logger: expect.objectContaining({
            debug: expect.any(Function),
            info: expect.any(Function),
            warn: expect.any(Function),
            error: expect.any(Function),
          }),
        }),
        expect.objectContaining({
          userId: 123,
          requestType: "onboarding_plan_generation",
          apiEndpoint: "/api/onboarding/generate-ai-plan",
          model: "gpt-4o-mini",
        })
      );
    });

    it("should call OpenAI with correct messages", async () => {
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      const mockCallOpenAI = vi.mocked(withUsageLogging).mock.results[0].value;

      expect(mockCallOpenAI).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            role: "system",
            content: expect.stringContaining("Build authority in SaaS development"),
          }),
          expect.objectContaining({
            role: "user",
            content: expect.stringContaining("indie creator"),
          }),
        ]),
        expect.objectContaining({
          temperature: 0.3,
          responseFormat: "json_object",
        })
      );
    });

    it("should capture telemetry events", async () => {
      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(captureServer).toHaveBeenCalledWith(123, "ai_plan_generation_started", {
        goal: "Build authority in SaaS development",
        tone: "helpful",
        channels: ["linkedin", "x"],
        audienceStage: "small",
      });

      expect(captureServer).toHaveBeenCalledWith(123, "ai_plan_generation_success", {
        pillars_count: 3,
        drafts_count: 2,
        channels: "linkedin,x",
      });
    });

    it("should map audience stage correctly", async () => {
      mockReq.body = {
        ...mockReq.body,
        audienceStage: "growing",
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      const mockCallOpenAI = vi.mocked(withUsageLogging).mock.results[0].value;
      const userMessage = mockCallOpenAI.mock.calls[0][0][1].content;

      expect(userMessage).toContain("growing 1k-10k followers");
    });

    it("should use default persona if not provided", async () => {
      mockReq.body = {
        ...mockReq.body,
        persona: undefined,
      };

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      const mockCallOpenAI = vi.mocked(withUsageLogging).mock.results[0].value;
      const userMessage = mockCallOpenAI.mock.calls[0][0][1].content;

      expect(userMessage).toContain("indie creator");
    });
  });

  describe("Error handling", () => {
    it("should handle OpenAI API errors", async () => {
      const mockError = new Error("OpenAI API error");
      const mockCallOpenAI = vi.fn().mockRejectedValue(mockError);
      vi.mocked(withUsageLogging).mockReturnValue(mockCallOpenAI);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to generate plan",
        details: "OpenAI API error",
      });

      expect(captureServer).toHaveBeenCalledWith(123, "ai_plan_generation_error", {
        error: "OpenAI API error",
      });
    });

    it("should handle empty OpenAI response", async () => {
      const mockCallOpenAI = vi.fn().mockResolvedValue({
        text: "",
        usage: { promptTokens: 10, completionTokens: 0, totalTokens: 10 },
      });
      vi.mocked(withUsageLogging).mockReturnValue(mockCallOpenAI);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to generate plan",
        details: "No response from OpenAI",
      });
    });

    it("should handle JSON parse errors", async () => {
      const mockCallOpenAI = vi.fn().mockResolvedValue({
        text: "invalid json",
        usage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
      });
      vi.mocked(withUsageLogging).mockReturnValue(mockCallOpenAI);

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to generate plan",
        details: expect.stringContaining("Unexpected token"),
      });
    });

    it("should handle file system errors", async () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error("File not found");
      });

      await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        error: "Failed to generate plan",
        details: "File not found",
      });
    });
  });
});
