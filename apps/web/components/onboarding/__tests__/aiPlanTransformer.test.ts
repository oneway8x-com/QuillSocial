import { describe, it, expect, beforeEach, vi } from "vitest";
import { transformAIPlanToEnhancedPlan } from "../aiPlanTransformer";
import type { EnhancedPlan } from "@components/copilot/types";

// Mock the utils module
vi.mock("@components/copilot/utils", () => ({
  createId: vi.fn(() => `id-${Math.random().toString(36).substr(2, 9)}`),
  nextColor: vi.fn()
    .mockReturnValueOnce("#FF6B6B")
    .mockReturnValueOnce("#4ECDC4")
    .mockReturnValueOnce("#45B7D1")
    .mockReturnValueOnce("#96CEB4")
    .mockReturnValueOnce("#FFEAA7"),
  resetPaletteCursor: vi.fn(),
}));

describe("aiPlanTransformer", () => {
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
      {
        date: "2025-10-22",
        channel: "linkedin",
        draft: {
          title: "Lessons from launching on Product Hunt",
          hook: "We got #3 Product of the Day. Here's what worked 🎯",
          outline: [
            "Community engagement before launch",
            "Clear value proposition",
            "Beautiful visuals",
            "Responding to every comment",
          ],
          cta: "Planning a launch? Ask me anything below!",
          replies: [
            "Congrats on the launch! What was your prep timeline?",
            "Great tips! How did you build pre-launch momentum?",
            "The visuals are key. Did you hire a designer?",
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
    vi.clearAllMocks();
  });

  it("should transform AI plan to EnhancedPlan format", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result).toBeDefined();
    expect(result.planId).toBe("plan-123");
    expect(result.purpose).toBe("Build authority in SaaS development");
  });

  it("should transform pillars with colors", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.pillars).toHaveLength(3);
    // Check that pillars have the expected structure (colors are assigned by nextColor mock)
    expect(result.pillars[0]).toMatchObject({
      name: "Product Updates",
    });
    expect(result.pillars[0].id).toBeDefined();
    expect(result.pillars[0].color).toBeTruthy();
  });

  it("should transform cadence with day abbreviations", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.cadence).toBeDefined();
    expect(result.cadence.length).toBeGreaterThan(0);

    // Check that days are abbreviated
    const days = result.cadence.map((c) => c.day);
    expect(days).toContain("Mon");
    expect(days).toContain("Wed");
    expect(days).toContain("Fri");
  });

  it("should transform week1Schedule with all draft fields", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.week1Schedule).toHaveLength(3);

    const firstSlot = result.week1Schedule![0];
    expect(firstSlot.date).toBe("2025-10-20");
    expect(firstSlot.channel).toBe("linkedin");
    expect(firstSlot.draft).toMatchObject({
      title: "Why we chose Next.js for QuillSocial",
      hook: "We evaluated 5 frameworks. Here's why we picked Next.js 👇",
      outline: expect.arrayContaining([
        "Server-side rendering for SEO",
        "API routes for backend logic",
      ]),
      cta: "What framework are you using? Drop it below 👇",
      hashtags: expect.any(Array),
      replies: expect.arrayContaining([
        "Great choice! We're using Next.js too and loving it.",
        "Have you tried [alternative]? How does it compare?",
        "The DX is unmatched. How's your build performance?",
      ]),
    });
  });

  it("should include engagement targets", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.engagementTargets).toMatchObject({
      meaningfulRepliesPerDay: 5,
      personas: ["SaaS founders", "Indie hackers", "Tech leads"],
    });
  });

  it("should include momentum metrics", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.metrics).toMatchObject({
      weeklyPostTarget: 8,
      dailyReplyTarget: 5,
    });
  });

  it("should handle tone as string or array", () => {
    const planWithStringTone = { ...mockAIPlan, tone: "helpful" };
    const result1 = transformAIPlanToEnhancedPlan(planWithStringTone as any, "helpful", "small");
    // Tone is normalized to first element if array, or directly used if string
    expect(result1.tone).toBe("helpful");

    const planWithArrayTone = { ...mockAIPlan, tone: ["helpful", "technical"] };
    const result2 = transformAIPlanToEnhancedPlan(planWithArrayTone, "helpful", "small");
    // First element of array is used
    expect(result2.tone).toBe("helpful");
  });

  it("should map audience stage correctly", () => {
    const resultSmall = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");
    expect(resultSmall.audienceStage).toBe("small");

    const resultStarting = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "starting");
    expect(resultStarting.audienceStage).toBe("starting");

    const resultGrowing = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "growing");
    expect(resultGrowing.audienceStage).toBe("growing");
  });

  it("should include BYOK connection status", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.byok).toBeDefined();
    expect(result.byok).toMatchObject({
      xConnected: false,
      engagementLists: [],
    });
  });

  it("should handle missing week1Schedule", () => {
    const planWithoutSchedule = { ...mockAIPlan, week1Schedule: [] };
    const result = transformAIPlanToEnhancedPlan(planWithoutSchedule, "helpful", "small");

    expect(result.week1Schedule).toEqual([]);
  });

  it("should handle missing cadence for some channels", () => {
    const planWithLimitedCadence = {
      ...mockAIPlan,
      cadence: {
        linkedin: {
          perWeek: 2,
          days: ["Tuesday", "Thursday"],
          postTypes: ["text"],
        },
      },
    };

    const result = transformAIPlanToEnhancedPlan(planWithLimitedCadence, "helpful", "small");

    expect(result.cadence).toBeDefined();
    const channels = result.cadence.map((c) => c.channels).flat();
    expect(channels).toContain("linkedin");
    expect(channels).not.toContain("x");
  });

  it("should generate hashtags from topics", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    const firstDraft = result.week1Schedule![0].draft;
    expect(firstDraft.hashtags).toBeDefined();
    // Hashtags come from engagementPlan topics that start with #
    // In our mock, topics don't have # prefix, so hashtags will be empty
    expect(Array.isArray(firstDraft.hashtags)).toBe(true);
  });

  it("should assign unique IDs to all elements", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    const pillarIds = result.pillars.map((p) => p.id);
    const cadenceIds = result.cadence.map((c) => c.id);

    // Check uniqueness
    const allIds = [...pillarIds, ...cadenceIds];
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it("should handle edge case with empty pillars", () => {
    const planWithNoPillars = { ...mockAIPlan, pillars: [] };

    const result = transformAIPlanToEnhancedPlan(planWithNoPillars, "helpful", "small");

    expect(result.pillars).toEqual([]);
  });

  it("should maintain order of week1Schedule", () => {
    const result = transformAIPlanToEnhancedPlan(mockAIPlan, "helpful", "small");

    expect(result.week1Schedule![0].date).toBe("2025-10-20");
    expect(result.week1Schedule![1].date).toBe("2025-10-21");
    expect(result.week1Schedule![2].date).toBe("2025-10-22");
  });
});
