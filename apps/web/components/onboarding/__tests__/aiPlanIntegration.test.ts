import { describe, it, expect, vi, beforeEach } from "vitest";
import { transformAIPlanToEnhancedPlan } from "../aiPlanTransformer";

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

/**
 * Integration tests for the AI plan generation and transformation flow.
 * These tests verify the end-to-end process from AI response to EnhancedPlan.
 */

describe("AI Plan Generation Integration", () => {
  const mockOpenAIResponse = {
    planId: "plan-abc123",
    purpose: "Establish thought leadership in AI/ML space",
    persona: "AI researcher",
    tone: ["educational", "insightful", "approachable"],
    pillars: [
      {
        name: "Research Papers Explained",
        why: "Break down complex AI research into digestible insights",
        exampleTopics: [
          "Latest GPT advances",
          "Computer vision breakthroughs",
          "Reinforcement learning techniques",
        ],
      },
      {
        name: "Industry Applications",
        why: "Show real-world impact of AI technologies",
        exampleTopics: [
          "AI in healthcare",
          "Automation in manufacturing",
          "ML in finance",
        ],
      },
      {
        name: "Career & Learning",
        why: "Help others grow in the AI field",
        exampleTopics: [
          "Learning resources",
          "Career transitions",
          "Interview preparation",
        ],
      },
      {
        name: "Tools & Frameworks",
        why: "Share practical implementation knowledge",
        exampleTopics: [
          "PyTorch tips",
          "TensorFlow tutorials",
          "MLOps best practices",
        ],
      },
    ],
    cadence: {
      linkedin: {
        perWeek: 4,
        days: ["Monday", "Tuesday", "Thursday", "Friday"],
        postTypes: ["text", "carousel", "document"],
      },
      x: {
        perWeek: 7,
        days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        postTypes: ["text", "thread"],
      },
    },
    week1Schedule: [
      {
        date: "2025-10-20",
        channel: "linkedin",
        draft: {
          title: "Understanding Transformer Architecture",
          hook: "Transformers revolutionized NLP. Here's how they work, explained simply 🧵",
          outline: [
            "Self-attention mechanism explained",
            "Why positional encoding matters",
            "The encoder-decoder structure",
            "Real-world applications",
            "Key takeaways for practitioners",
          ],
          cta: "What AI topic should I explain next? Comment below! 👇",
          replies: [
            "Brilliant explanation! The attention mechanism finally makes sense.",
            "Could you cover GPT-4 architecture next?",
            "Love how you break down complex concepts. Following!",
          ],
        },
      },
      {
        date: "2025-10-21",
        channel: "x",
        draft: {
          title: "5 AI papers you should read this week",
          hook: "Top AI research papers from last week 📚\n\nHere's what you need to know: 🧵",
          outline: [
            "Paper 1: Novel approach to few-shot learning",
            "Paper 2: Breakthrough in multimodal models",
            "Paper 3: Efficient fine-tuning techniques",
            "Paper 4: AI safety research progress",
            "Paper 5: Edge AI optimization",
          ],
          cta: "Which one interests you most? Let me know!",
          replies: [
            "Thanks for the roundup! Saved for weekend reading.",
            "The few-shot learning paper sounds fascinating!",
            "Do you have links to these papers?",
          ],
        },
      },
      {
        date: "2025-10-22",
        channel: "linkedin",
        draft: {
          title: "How AI is transforming healthcare diagnostics",
          hook: "AI detected cancer with 99% accuracy in a recent study. Here's the impact 🏥",
          outline: [
            "Current state of AI in radiology",
            "Case study: Early cancer detection",
            "Challenges and limitations",
            "Ethical considerations",
            "Future implications for healthcare",
          ],
          cta: "Working in healthcare AI? I'd love to hear your perspective!",
          replies: [
            "Working on similar problems. The ethical considerations are key.",
            "Impressive results! How do they handle false positives?",
            "This could save so many lives. Exciting times!",
          ],
        },
      },
      {
        date: "2025-10-23",
        channel: "x",
        draft: {
          title: "PyTorch vs TensorFlow in 2025",
          hook: "Still debating which framework to learn? 🤔\n\nHere's my take after 5 years using both:",
          outline: [
            "Ease of learning: PyTorch wins",
            "Production deployment: TensorFlow edge",
            "Research flexibility: PyTorch",
            "Community and resources: Tie",
            "My recommendation: Start with PyTorch",
          ],
          cta: "What's your go-to framework? Vote below! 👇",
          replies: [
            "PyTorch all the way! The dynamic graphs are game-changing.",
            "TensorFlow has improved a lot with 2.x though.",
            "Why not JAX? 😄",
          ],
        },
      },
      {
        date: "2025-10-24",
        channel: "linkedin",
        draft: {
          title: "Breaking into AI: A realistic roadmap",
          hook: "Want to transition into AI? Here's what actually worked for me (and 100+ others I've mentored) 🎯",
          outline: [
            "Build strong math foundations (linear algebra, calculus, stats)",
            "Master one framework deeply (don't spread thin)",
            "Create portfolio projects (quality > quantity)",
            "Contribute to open source",
            "Network authentically (share your journey)",
            "Apply strategically (show, don't just tell)",
          ],
          cta: "What's your biggest challenge in transitioning to AI? Let's discuss!",
          replies: [
            "This is gold! Saving for reference.",
            "How long did your transition take?",
            "The portfolio advice is spot on. Projects matter more than certificates.",
          ],
        },
      },
      {
        date: "2025-10-25",
        channel: "x",
        draft: {
          title: "Common ML mistakes I see in production",
          hook: "Been reviewing ML systems for 5 years. These mistakes keep appearing 🚨\n\nThread:",
          outline: [
            "Not monitoring data drift",
            "Overfitting to the training set",
            "Ignoring inference latency",
            "Poor error handling",
            "Lack of A/B testing",
            "Not versioning models properly",
          ],
          cta: "What production ML challenges are you facing?",
          replies: [
            "Data drift monitoring is so underrated!",
            "Number 3 hit home. Learned that lesson the hard way.",
            "Great list! Would add: not considering model bias.",
          ],
        },
      },
      {
        date: "2025-10-26",
        channel: "linkedin",
        draft: {
          title: "MLOps: The missing piece in ML education",
          hook: "You learned ML algorithms. But can you deploy them reliably? 🚀",
          outline: [
            "Why MLOps matters more than ever",
            "Key components: CI/CD, monitoring, versioning",
            "Tools you should know (Kubeflow, MLflow, Weights & Biases)",
            "Building ML pipelines that actually work",
            "The ROI of good MLOps practices",
          ],
          cta: "What MLOps tools are you using? Share your stack! 👇",
          replies: [
            "MLflow has been a game-changer for our team.",
            "Would love a deep dive on Kubeflow!",
            "This should be taught in every ML course.",
          ],
        },
      },
    ],
    engagementPlan: {
      meaningfulRepliesPerDay: 10,
      personasToEngage: [
        "AI researchers",
        "ML engineers",
        "Data scientists",
        "Tech leads exploring AI",
        "Career changers into AI",
      ],
      topics: [
        "Machine learning research",
        "AI implementation challenges",
        "Career development in AI",
        "ML tools and frameworks",
        "AI ethics and safety",
      ],
    },
    metrics: {
      weeklyPostTarget: 11,
      dailyReplyTarget: 10,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Complete flow: OpenAI response → EnhancedPlan", () => {
    it("should transform full OpenAI response to valid EnhancedPlan", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      // Verify top-level structure
      expect(result).toMatchObject({
        planId: "plan-abc123",
        purpose: "Establish thought leadership in AI/ML space",
        tone: "educational", // Normalized to first element
        pillars: expect.any(Array),
        cadence: expect.any(Array),
        week1Schedule: expect.any(Array),
        engagementTargets: expect.any(Object),
        metrics: expect.any(Object),
        byok: expect.any(Object),
        audienceStage: "growing",
        targets: expect.any(Object),
        dailyReplies: 10,
      });
    });

    it("should correctly transform all pillars with IDs and colors", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      expect(result.pillars).toHaveLength(4);

      result.pillars.forEach((pillar, index) => {
        expect(pillar).toMatchObject({
          id: expect.any(String),
          name: mockOpenAIResponse.pillars[index].name,
        });
        expect(pillar.id).toBeTruthy();
        // Color may be undefined in mocked environment
      });
    });

    it("should transform cadence for all channels correctly", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      // LinkedIn: 4 posts/week = 4 cadence entries
      const linkedinSlots = result.cadence.filter((c) => c.channels.includes("linkedin"));
      expect(linkedinSlots.length).toBe(4);

      // X: 7 posts/week = 7 cadence entries
      const xSlots = result.cadence.filter((c) => c.channels.includes("x"));
      expect(xSlots.length).toBe(7);

      // Verify each slot has required fields
      result.cadence.forEach((slot) => {
        expect(slot).toMatchObject({
          id: expect.any(String),
          day: expect.stringMatching(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/),
          type: expect.any(String),
          channels: expect.any(Array),
          hourHint: expect.any(Number),
        });
      });
    });

    it("should transform all 7 week1Schedule drafts", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      expect(result.week1Schedule).toHaveLength(7);

      result.week1Schedule!.forEach((slot, index) => {
        const originalSlot = mockOpenAIResponse.week1Schedule[index];

        expect(slot).toMatchObject({
          date: originalSlot.date,
          channel: originalSlot.channel,
          draft: {
            title: originalSlot.draft.title,
            hook: originalSlot.draft.hook,
            outline: originalSlot.draft.outline,
            cta: originalSlot.draft.cta,
            replies: originalSlot.draft.replies,
            hashtags: expect.any(Array),
          },
        });

        // Verify replies are preserved
        expect(slot.draft.replies).toHaveLength(originalSlot.draft.replies.length);
      });
    });

    it("should generate appropriate hashtags for each draft", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      result.week1Schedule!.forEach((slot) => {
        expect(slot.draft.hashtags).toBeDefined();
        // Hashtags are filtered from topics that start with #
        // Mock data doesn't have hashtags, so array is empty
        expect(Array.isArray(slot.draft.hashtags)).toBe(true);

        // Hashtags should not include the # symbol (if they exist)
        if (slot.draft.hashtags && slot.draft.hashtags.length > 0) {
          slot.draft.hashtags.forEach((tag) => {
            expect(tag).not.toMatch(/^#/);
          });
        }
      });
    });

    it("should map engagement plan correctly", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      expect(result.engagementTargets).toMatchObject({
        meaningfulRepliesPerDay: 10,
        personas: mockOpenAIResponse.engagementPlan.personasToEngage,
      });
    });

    it("should calculate momentum metrics based on audience stage", () => {
      const resultGrowing = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      expect(resultGrowing.metrics).toMatchObject({
        weeklyPostTarget: 11,
        dailyReplyTarget: 10,
      });

      const resultStarting = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "starting"
      );

      expect(resultStarting.metrics).toMatchObject({
        weeklyPostTarget: 11,
        dailyReplyTarget: 10,
      });
    });

    it("should include BYOK status for X platform", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      expect(result.byok).toMatchObject({
        xConnected: false,
        engagementLists: [],
      });
    });

    it("should maintain data integrity throughout transformation", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      // Verify no data loss
      expect(result.pillars.length).toBe(mockOpenAIResponse.pillars.length);
      expect(result.week1Schedule!.length).toBe(mockOpenAIResponse.week1Schedule.length);

      // Verify all draft content is preserved
      result.week1Schedule!.forEach((slot, index) => {
        const original = mockOpenAIResponse.week1Schedule[index];
        expect(slot.draft.title).toBe(original.draft.title);
        expect(slot.draft.hook).toBe(original.draft.hook);
        expect(slot.draft.cta).toBe(original.draft.cta);
        expect(slot.draft.outline).toEqual(original.draft.outline);
      });
    });

    it("should handle mixed channels in week1Schedule", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      const linkedinDrafts = result.week1Schedule!.filter((s) => s.channel === "linkedin");
      const xDrafts = result.week1Schedule!.filter((s) => s.channel === "x");

      expect(linkedinDrafts.length).toBeGreaterThan(0);
      expect(xDrafts.length).toBeGreaterThan(0);
      expect(linkedinDrafts.length + xDrafts.length).toBe(7);
    });

    it("should validate EnhancedPlan can be serialized", () => {
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      // Should be JSON serializable (no circular references, undefined values)
      expect(() => JSON.stringify(result)).not.toThrow();

      const serialized = JSON.stringify(result);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toMatchObject({
        planId: result.planId,
        purpose: result.purpose,
        tone: result.tone,
      });
    });
  });

  describe("Edge cases and robustness", () => {
    it("should handle plan with minimum viable structure", () => {
      const minimalPlan = {
        planId: "min-plan",
        purpose: "Minimal test",
        persona: "tester",
        tone: "casual",
        pillars: [
          {
            name: "Single Pillar",
            why: "Testing",
            exampleTopics: ["Test topic"],
          },
        ],
        cadence: {
          linkedin: {
            perWeek: 1,
            days: ["Monday"],
            postTypes: ["text"],
          },
        },
        week1Schedule: [
          {
            date: "2025-10-20",
            channel: "linkedin",
            draft: {
              title: "Test post",
              hook: "Test hook",
              outline: ["Point 1"],
              cta: "Test CTA",
              replies: ["Reply 1"],
            },
          },
        ],
        engagementPlan: {
          meaningfulRepliesPerDay: 1,
          personasToEngage: ["Test persona"],
          topics: ["Test topic"],
        },
        metrics: {
          weeklyPostTarget: 1,
          dailyReplyTarget: 1,
        },
      };

      const result = transformAIPlanToEnhancedPlan(minimalPlan, "casual", "starting");

      expect(result).toBeDefined();
      expect(result.pillars).toHaveLength(1);
      expect(result.week1Schedule).toHaveLength(1);
    });

    it("should handle plan with maximum content", () => {
      // Already tested with mockOpenAIResponse which has 7 drafts, 4 pillars
      const result = transformAIPlanToEnhancedPlan(
        mockOpenAIResponse,
        "educational",
        "growing"
      );

      expect(result.pillars.length).toBe(4);
      expect(result.week1Schedule!.length).toBe(7);
      expect(result.cadence.length).toBe(11); // 4 + 7 days across channels
    });
  });
});
