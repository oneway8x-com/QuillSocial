import type { EnhancedPlan, Week1Slot, PlanPillar, PlanCadenceSlot } from "@components/copilot/types";
import { createId, nextColor, resetPaletteCursor } from "@components/copilot/utils";

interface AIPillar {
  name: string;
  why: string;
  exampleTopics: string[];
}

interface AICadence {
  [channel: string]: {
    perWeek: number;
    days: string[];
    postTypes: string[];
  };
}

interface AIWeek1Slot {
  date: string;
  channel: string;
  draft: {
    title: string;
    hook: string;
    outline: string[];
    cta: string;
    replies: string[];
  };
}

interface AIGeneratedPlan {
  planId?: string;
  purpose: string;
  persona?: string;
  tone: string | string[];
  pillars: AIPillar[];
  cadence: AICadence;
  week1Schedule: AIWeek1Slot[];
  engagementPlan: {
    meaningfulRepliesPerDay: number;
    personasToEngage: string[];
    topics: string[];
  };
  metrics: {
    weeklyPostTarget: number;
    dailyReplyTarget: number;
  };
}

/**
 * Transform AI-generated plan to our EnhancedPlan format
 */
export function transformAIPlanToEnhancedPlan(
  aiPlan: AIGeneratedPlan,
  userTone: string,
  audienceStage: "starting" | "small" | "growing"
): EnhancedPlan {
  // Reset color palette for consistent pillar colors
  resetPaletteCursor();

  // Transform pillars
  const pillars: PlanPillar[] = aiPlan.pillars.map((p) => ({
    id: createId(),
    name: p.name,
    color: nextColor(),
  }));

  // Transform cadence
  const cadence: PlanCadenceSlot[] = [];
  const dayMap: Record<string, string> = {
    Monday: "Mon",
    Tuesday: "Tue",
    Wednesday: "Wed",
    Thursday: "Thu",
    Friday: "Fri",
    Saturday: "Sat",
    Sunday: "Sun",
  };

  Object.entries(aiPlan.cadence).forEach(([channel, config]) => {
    config.days.forEach((day) => {
      const shortDay = dayMap[day] || day;
      cadence.push({
        id: createId(),
        day: shortDay as any,
        type: "text", // Default type, can be enhanced
        channels: [channel as any],
        hourHint: 9,
      });
    });
  });

  // Transform week1Schedule
  const week1Schedule: Week1Slot[] = aiPlan.week1Schedule.map((slot) => ({
    date: slot.date,
    channel: slot.channel as any,
    draft: {
      title: slot.draft.title,
      hook: slot.draft.hook,
      outline: slot.draft.outline,
      cta: slot.draft.cta,
      hashtags: aiPlan.engagementPlan?.topics?.filter(t => t.startsWith("#")).slice(0, 3),
      replies: slot.draft.replies,
    },
  }));

  // Normalize tone
  const toneValue = Array.isArray(aiPlan.tone) ? aiPlan.tone[0] : aiPlan.tone;
  const normalizedTone = (toneValue?.toLowerCase() || userTone) as "friendly" | "authoritative" | "contrarian";

  return {
    planId: aiPlan.planId || createId(),
    purpose: aiPlan.purpose,
    tone: normalizedTone,
    audienceStage,
    pillars,
    cadence,
    targets: {
      peers: [],
      prospects: [],
      leaders: [],
    },
    dailyReplies: aiPlan.engagementPlan?.meaningfulRepliesPerDay || 5,
    week1Schedule,
    engagementTargets: {
      meaningfulRepliesPerDay: aiPlan.engagementPlan?.meaningfulRepliesPerDay || 5,
      personas: aiPlan.engagementPlan?.personasToEngage || ["Peers", "Prospects", "Leaders"],
    },
    metrics: {
      weeklyPostTarget: aiPlan.metrics?.weeklyPostTarget || 5,
      dailyReplyTarget: aiPlan.metrics?.dailyReplyTarget || 5,
    },
    byok: {
      xConnected: false,
      engagementLists: [],
    },
  };
}

/**
 * Get selected channels from cadence
 */
export function getSelectedChannels(plan: EnhancedPlan): string[] {
  return [...new Set(plan.cadence.flatMap(c => c.channels))];
}
