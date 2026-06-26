import type {
  Plan,
  EnhancedPlan,
  Week1Slot,
  DraftIdea,
  CadenceChannel,
  PlanPillar,
} from "@components/copilot/types";
import { createId } from "@components/copilot/utils";

/**
 * Generate a week-1 calendar with 5-7 dated slots based on the plan's cadence
 */
export function generateWeek1Calendar(plan: Plan): Week1Slot[] {
  const slots: Week1Slot[] = [];
  const startDate = getNextMonday();

  // Map days to indices
  const dayMap: Record<string, number> = {
    Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6
  };

  // Generate slots for each cadence item in the first week
  plan.cadence.forEach((slot) => {
    const dayIndex = dayMap[slot.day];
    const slotDate = new Date(startDate);
    slotDate.setDate(slotDate.getDate() + dayIndex);
    slotDate.setHours(slot.hourHint || 9, 0, 0, 0);

    // Pick a random pillar for this slot
    const randomPillar = plan.pillars[Math.floor(Math.random() * plan.pillars.length)];

    // For each channel in the slot, create a draft
    slot.channels.forEach((channel) => {
      slots.push({
        date: slotDate.toISOString(),
        channel,
        draft: generateDraftIdea(plan, randomPillar, slot.type, channel),
      });
    });
  });

  // Limit to 7 slots max for week 1
  return slots.slice(0, 7);
}

/**
 * Generate a draft idea with title, hook, outline, CTA, and reply suggestions
 */
function generateDraftIdea(
  plan: Plan,
  pillar: PlanPillar,
  type: string,
  channel: CadenceChannel
): DraftIdea {
  const hooks = [
    "Shipping fast beats perfect.",
    "Here's what nobody tells you about...",
    "I tried this for 30 days. Here's what happened.",
    "The one thing that changed everything:",
    "Stop doing this. Start doing that.",
  ];

  const ctas = [
    "Follow for more insights",
    "What's your experience? Share below 👇",
    "Save this for later",
    "DM me if you want to know more",
    "Drop a 🔥 if this resonates",
  ];

  const outlineTemplates = {
    linkedin: [
      "Problem: describe the challenge",
      "Why it matters: impact and consequences",
      "Solution: 3-step approach",
      "Results: what changed",
    ],
    x: [
      "Hook: bold statement",
      "Context: why this matters now",
      "Key insight #1",
      "Key insight #2",
      "Closing thought",
    ],
    instagram: [
      "Visual story: set the scene",
      "The turning point",
      "What I learned",
      "Your takeaway",
    ],
    youtube: [
      "Intro: hook + preview",
      "Main content: 3 key points",
      "Demo or example",
      "Recap and CTA",
    ],
    blog: [
      "Introduction: context and hook",
      "Background: why this topic",
      "Main sections: 3-5 points",
      "Conclusion: summary + next steps",
    ],
  };

  const outline = outlineTemplates[channel] || outlineTemplates.linkedin;

  const hashtags = channel === "linkedin" || channel === "instagram"
    ? [`#${pillar.name.replace(/\s/g, "")}`, "#Growth", "#Learning"]
    : undefined;

  return {
    title: `${pillar.name}: ${getRandomTopic(pillar.name)}`,
    hook: hooks[Math.floor(Math.random() * hooks.length)],
    outline,
    cta: ctas[Math.floor(Math.random() * ctas.length)],
    hashtags,
    replies: generateReplyKit(),
  };
}

/**
 * Generate 3 reply suggestions for engagement
 */
function generateReplyKit(): string[] {
  const replyTemplates = [
    [
      "Happy to share more details if helpful.",
      "Curious: what's your experience with this?",
      "Trade-off I made: [specific choice] for [reason].",
    ],
    [
      "This is just one approach. What works for you?",
      "I'd love to hear your perspective on this.",
      "The key for me was [specific insight].",
    ],
    [
      "Great question! Here's what I learned...",
      "Totally agree. I'd add that [additional insight].",
      "Interesting take. My experience was slightly different...",
    ],
  ];

  return replyTemplates[Math.floor(Math.random() * replyTemplates.length)];
}

/**
 * Get a random topic based on pillar name
 */
function getRandomTopic(pillarName: string): string {
  const topics: Record<string, string[]> = {
    "Build in Public": [
      "From zero to MVP in 5 days",
      "My first 3 paying customers",
      "Choosing the right tech stack",
      "Weekend project that got traction",
    ],
    "Founder Lessons": [
      "What I'd do differently",
      "Biggest mistake I made (and fixed)",
      "Time management as a solo founder",
      "When to say no to features",
    ],
    "Client Wins": [
      "Case study: 3x growth in 30 days",
      "Turning objections into sales",
      "My fastest onboarding ever",
      "Solving an impossible problem",
    ],
    "Product Roadmap": [
      "What's coming in v2",
      "Feature prioritization framework",
      "User-driven development",
      "Our public roadmap approach",
    ],
  };

  const pillarTopics = topics[pillarName] || [
    "Quick win that worked",
    "Strategy that surprised me",
    "Counterintuitive approach",
    "Simple framework",
  ];

  return pillarTopics[Math.floor(Math.random() * pillarTopics.length)];
}

/**
 * Get next Monday at 9 AM
 */
function getNextMonday(): Date {
  const now = new Date();
  const monday = new Date(now);
  const dayOfWeek = now.getDay();
  const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // 0 = Sunday

  monday.setDate(now.getDate() + daysUntilMonday);
  monday.setHours(9, 0, 0, 0);

  return monday;
}

/**
 * Enhance a basic plan with week1Schedule, metrics, and engagement targets
 */
export function enhancePlan(plan: Plan, userId?: number): EnhancedPlan {
  const week1Schedule = generateWeek1Calendar(plan);

  // Calculate metrics based on audience stage
  const metricsMap = {
    starting: { weeklyPostTarget: 5, dailyReplyTarget: 5 },
    small: { weeklyPostTarget: 7, dailyReplyTarget: 8 },
    growing: { weeklyPostTarget: 10, dailyReplyTarget: 10 },
  };

  const metrics = metricsMap[plan.audienceStage];

  return {
    ...plan,
    planId: createId(),
    week1Schedule,
    engagementTargets: {
      meaningfulRepliesPerDay: plan.dailyReplies,
      personas: ["Peers", "Prospects", "Leaders"],
    },
    metrics,
    byok: {
      xConnected: false, // TODO: Check actual X connection status
      engagementLists: [],
    },
  };
}
