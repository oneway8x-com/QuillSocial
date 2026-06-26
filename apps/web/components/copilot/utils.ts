import {
  AudienceStage,
  CadenceChannel,
  CadenceDay,
  CadenceFormat,
  Plan,
  PlanBlockKey,
  PlanCadenceSlot,
  PlanPillar,
  PlanTargets,
  Target,
  TargetPlatform,
  ToneOption,
} from "./types";

export const COPILOT_DRAFT_STORAGE_KEY = "copilot-plan-draft";

export const cadenceFormats: CadenceFormat[] = [
  "text",
  "thread",
  "carousel",
  "shorts",
  "blog",
];

export const cadenceChannels: CadenceChannel[] = [
  "linkedin",
  "x",
  "instagram",
  "youtube",
  "blog",
];

export const cadenceDays: CadenceDay[] = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

export const targetPlatforms: TargetPlatform[] = [
  "x",
  "linkedin",
  "youtube",
  "rss",
  "other",
];

const colorPalette = [
  "#6366F1",
  "#F97316",
  "#22C55E",
  "#0EA5E9",
  "#EC4899",
  "#F59E0B",
  "#a855f7",
  "#14b8a6",
];

let colorIndex = 0;

export const createId = () =>
  `copilot-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

export const nextColor = () => {
  const color = colorPalette[colorIndex % colorPalette.length];
  colorIndex += 1;
  return color;
};

export const resetPaletteCursor = () => {
  colorIndex = 0;
};

export const createEmptyPlan = (overrides: Partial<Plan> = {}): Plan => ({
  purpose: "",
  tone: "friendly",
  audienceStage: "starting",
  pillars: [],
  cadence: [],
  targets: {
    peers: [],
    prospects: [],
    leaders: [],
  },
  dailyReplies: 6,
  ...overrides,
});

const normalizePurpose = (purpose: string) =>
  purpose.trim().replace(/\s+/g, " ");

const extractKeywords = (purpose: string) => {
  const cleaned = normalizePurpose(purpose)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "");
  const words = cleaned.split(" ").filter((w) => w.length > 3);
  const counts = new Map<string, number>();
  words.forEach((word) => counts.set(word, (counts.get(word) ?? 0) + 1));
  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word)
    .slice(0, 6);
  if (sorted.length === 0) {
    return ["Audience Growth", "Offers", "Credibility", "Pipeline"];
  }
  const capitalized = sorted.map((word) =>
    word
      .split(" ")
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(" ")
  );
  return Array.from(new Set(capitalized));
};

const buildPillarsFromPurpose = (purpose: string): PlanPillar[] => {
  resetPaletteCursor();
  const keywords = extractKeywords(purpose);
  const baseNames = keywords.length >= 4 ? keywords : keywords.concat([
    "Momentum Stories",
    "Product Insights",
    "Community",
    "Growth Experiments",
  ]);
  return baseNames.slice(0, 4).map((name) => ({
    id: createId(),
    name,
    color: nextColor(),
  }));
};

const baseCadenceByAudience: Record<AudienceStage, Partial<PlanCadenceSlot>[]> = {
  starting: [
    { day: "Mon", type: "text", channels: ["linkedin"] },
    { day: "Tue", type: "thread", channels: ["x"] },
    { day: "Wed", type: "carousel", channels: ["instagram"] },
    { day: "Thu", type: "text", channels: ["linkedin"] },
    { day: "Fri", type: "shorts", channels: ["youtube"] },
  ],
  small: [
    { day: "Mon", type: "thread", channels: ["x"] },
    { day: "Tue", type: "text", channels: ["linkedin", "blog"] },
    { day: "Wed", type: "carousel", channels: ["instagram"] },
    { day: "Thu", type: "shorts", channels: ["youtube"] },
    { day: "Sat", type: "blog", channels: ["blog", "linkedin"] },
  ],
  growing: [
    { day: "Mon", type: "thread", channels: ["x", "linkedin"] },
    { day: "Tue", type: "shorts", channels: ["youtube"] },
    { day: "Wed", type: "carousel", channels: ["instagram"] },
    { day: "Thu", type: "text", channels: ["linkedin"] },
    { day: "Fri", type: "text", channels: ["linkedin", "x"] },
    { day: "Sun", type: "blog", channels: ["blog"] },
  ],
};

const defaultTargets: PlanTargets = {
  peers: [
    { id: createId(), handle: "@indieworldwide", platform: "x" },
    { id: createId(), handle: "@microacquire", platform: "x" },
    { id: createId(), handle: "@femalefounders", platform: "instagram" as TargetPlatform },
  ],
  prospects: [
    { id: createId(), handle: "@revopsleaders", platform: "linkedin" },
    { id: createId(), handle: "@productledge", platform: "linkedin" },
    { id: createId(), handle: "growthopsweekly.com", platform: "rss" },
  ],
  leaders: [
    { id: createId(), handle: "@levelsio", platform: "x" },
    { id: createId(), handle: "@suhail", platform: "x" },
    { id: createId(), handle: "@csallen", platform: "x" },
  ],
};

export const buildDefaultPlan = (
  purpose: string,
  tone: ToneOption,
  audienceStage: AudienceStage
): Plan => {
  const pillars = buildPillarsFromPurpose(purpose);
  const cadenceTemplates = baseCadenceByAudience[audienceStage];
  const cadence: PlanCadenceSlot[] = cadenceTemplates.map((slot, index) => ({
    id: createId(),
    day: slot.day ?? "Mon",
    type: slot.type ?? "text",
    channels: slot.channels ?? ["linkedin"],
    hourHint: 9 + index,
  }));

  const dailyReplies = audienceStage === "growing" ? 15 : audienceStage === "small" ? 12 : 8;

  return {
    purpose: normalizePurpose(purpose) || "Grow my audience with consistent storytelling",
    tone,
    audienceStage,
    pillars,
    cadence,
    targets: JSON.parse(JSON.stringify(defaultTargets)) as PlanTargets,
    dailyReplies,
  };
};

export interface PlanValidationResult {
  valid: boolean;
  errors: Partial<Record<PlanBlockKey, string>>;
}

export const validatePlan = (plan: Plan): PlanValidationResult => {
  const errors: Partial<Record<PlanBlockKey, string>> = {};

  if (plan.pillars.length < 2) {
    errors.pillars = "Add at least two pillars to stay focused.";
  }

  if (plan.cadence.length < 3) {
    errors.cadence = "Schedule at least three publishing slots across the week.";
  }

  if (plan.dailyReplies < 4) {
    errors.engagement = "Set replies per day to four or more for momentum.";
  }

  const perDayChannel: Record<string, number> = {};
  plan.cadence.forEach((slot) => {
    slot.channels.forEach((channel) => {
      const key = `${slot.day}-${channel}`;
      perDayChannel[key] = (perDayChannel[key] ?? 0) + 1;
    });
  });

  const hasHardCapBreach = Object.values(perDayChannel).some((count) => count > 2);
  if (hasHardCapBreach) {
    errors.cadence =
      "There can be at most two slots per channel per day. Please prune or move a slot.";
  }

  const uniqueDays = new Set(plan.cadence.map((slot) => slot.day));
  if (uniqueDays.size < 3) {
    errors.cadence =
      errors.cadence ?? "Keep at least three unique posting days to maintain consistency.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

export interface CadenceConflict {
  id: string;
  day: CadenceDay;
  channel: CadenceChannel;
  slots: PlanCadenceSlot[];
}

export const detectCadenceConflicts = (plan: Plan): CadenceConflict[] => {
  const map = new Map<string, PlanCadenceSlot[]>();

  plan.cadence.forEach((slot) => {
    slot.channels.forEach((channel) => {
      const key = `${slot.day}-${channel}-${slot.type}`;
      const existing = map.get(key) ?? [];
      map.set(key, [...existing, slot]);
    });
  });

  const conflicts: CadenceConflict[] = [];

  map.forEach((slots, key) => {
    if (slots.length > 1) {
      const [day, channel] = key.split("-") as [CadenceDay, CadenceChannel];
      conflicts.push({
        id: createId(),
        day,
        channel,
        slots,
      });
    }
  });

  return conflicts;
};

export const summarisePlan = (plan: Plan) => {
  const pillarCount = plan.pillars.length;
  const slotCount = plan.cadence.length;
  const targetCount =
    plan.targets.peers.length + plan.targets.prospects.length + plan.targets.leaders.length;
  const dailyReplies = plan.dailyReplies;

  return {
    pillarCount,
    slotCount,
    targetCount,
    dailyReplies,
    label: `${pillarCount} pillar${pillarCount === 1 ? "" : "s"} • ${slotCount} weekly slot${
      slotCount === 1 ? "" : "s"
    } • ${targetCount} target${targetCount === 1 ? "" : "s"} • ${dailyReplies}/day replies`,
  };
};

export const cloneTargets = (targets: PlanTargets): PlanTargets => ({
  peers: targets.peers.map((target) => ({ ...target })),
  prospects: targets.prospects.map((target) => ({ ...target })),
  leaders: targets.leaders.map((target) => ({ ...target })),
});

export const dedupeTargets = (targets: PlanTargets): PlanTargets => {
  const seen = new Map<string, Target>();
  const priority: Record<string, number> = {
    leaders: 3,
    prospects: 2,
    peers: 1,
  };

  const add = (group: keyof PlanTargets) =>
    targets[group].forEach((target) => {
      const key = `${target.platform}-${target.handle}`.toLowerCase();
      const existing = seen.get(key);
      if (!existing || priority[group] > (existing as any).__priority) {
        const enriched = { ...target } as Target & { __priority: number };
        enriched.__priority = priority[group];
        seen.set(key, enriched);
      }
    });

  add("leaders");
  add("prospects");
  add("peers");

  const result: PlanTargets = {
    leaders: [],
    prospects: [],
    peers: [],
  };

  seen.forEach((value) => {
    const clone = { ...value } as Target;
    delete (clone as any).__priority;
    const key = `${value.platform}-${value.handle}`.toLowerCase();
    const origin = targets.leaders.find((t) => `${t.platform}-${t.handle}`.toLowerCase() === key)
      ? "leaders"
      : targets.prospects.find((t) => `${t.platform}-${t.handle}`.toLowerCase() === key)
      ? "prospects"
      : "peers";
    result[origin as keyof PlanTargets].push(clone);
  });

  return result;
};
