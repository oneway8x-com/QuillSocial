import { Plan } from "./types";
import { buildDefaultPlan, cloneTargets, createId, nextColor, resetPaletteCursor } from "./utils";

export interface CopilotPreset {
  id: string;
  label: string;
  mantra: string;
  buildPlan: () => Plan;
}

const withPillars = (names: string[]) => {
  resetPaletteCursor();
  return names.map((name) => ({
    id: createId(),
    name,
    color: nextColor(),
  }));
};

export const COPILOT_PRESETS: CopilotPreset[] = [
  {
    id: "indie-hacker",
    label: "Indie Hacker",
    mantra: "Share transparent build-in-public updates to attract early adopters.",
    buildPlan: () => {
      const base = buildDefaultPlan(
        "Document the journey of bootstrapping a SaaS to $10k MRR",
        "friendly",
        "starting"
      );
      base.pillars = withPillars([
        "Build in Public",
        "Customer Wins",
        "Product Roadmap",
        "Founder Lessons",
      ]);
      base.cadence = [
        {
          id: createId(),
          day: "Mon",
          type: "thread",
          channels: ["x"],
          hourHint: 9,
        },
        {
          id: createId(),
          day: "Tue",
          type: "text",
          channels: ["linkedin"],
          hourHint: 10,
        },
        {
          id: createId(),
          day: "Thu",
          type: "carousel",
          channels: ["instagram"],
          hourHint: 11,
        },
        {
          id: createId(),
          day: "Fri",
          type: "shorts",
          channels: ["youtube"],
          hourHint: 13,
        },
        {
          id: createId(),
          day: "Sun",
          type: "blog",
          channels: ["blog", "linkedin"],
          hourHint: 8,
        },
      ];
      base.targets = cloneTargets({
        peers: [
          { id: createId(), handle: "@indiehackers", platform: "x" },
          { id: createId(), handle: "@tinyseedfund", platform: "x" },
          { id: createId(), handle: "@janelle_stacks", platform: "linkedin" },
          { id: createId(), handle: "@rosieshn", platform: "x" },
        ],
        prospects: [
          { id: createId(), handle: "@nocodefounders", platform: "x" },
          { id: createId(), handle: "@microconf", platform: "x" },
          { id: createId(), handle: "buildpublic.club", platform: "rss" },
          { id: createId(), handle: "@outseta", platform: "x" },
        ],
        leaders: [
          { id: createId(), handle: "@levelsio", platform: "x" },
          { id: createId(), handle: "@suhail", platform: "x" },
          { id: createId(), handle: "@julian", platform: "x" },
        ],
      });
      base.dailyReplies = 10;
      return base;
    },
  },
  {
    id: "consultant",
    label: "Consultant",
    mantra: "Package client wins and diagnostic insights to warm up pipeline.",
    buildPlan: () => {
      const plan = buildDefaultPlan(
        "Attract B2B retainers by showing diagnostic expertise",
        "authoritative",
        "small"
      );
      plan.pillars = withPillars([
        "Client Transformations",
        "Framework Drops",
        "Industry Signals",
        "Behind the Audit",
      ]);
      plan.cadence = [
        {
          id: createId(),
          day: "Mon",
          type: "text",
          channels: ["linkedin"],
          hourHint: 9,
        },
        {
          id: createId(),
          day: "Tue",
          type: "thread",
          channels: ["x"],
          hourHint: 8,
        },
        {
          id: createId(),
          day: "Wed",
          type: "carousel",
          channels: ["instagram"],
          hourHint: 12,
        },
        {
          id: createId(),
          day: "Thu",
          type: "blog",
          channels: ["blog", "linkedin"],
          hourHint: 14,
        },
        {
          id: createId(),
          day: "Fri",
          type: "shorts",
          channels: ["youtube"],
          hourHint: 11,
        },
      ];
      plan.targets = cloneTargets({
        peers: [
          { id: createId(), handle: "@agencycollectiv", platform: "instagram" },
          { id: createId(), handle: "@revopsleaders", platform: "linkedin" },
          { id: createId(), handle: "@heyblake", platform: "x" },
        ],
        prospects: [
          { id: createId(), handle: "@demandcurve", platform: "x" },
          { id: createId(), handle: "@chriswalker171", platform: "linkedin" },
          { id: createId(), handle: "b2b-marketing", platform: "rss" },
          { id: createId(), handle: "@reforge", platform: "x" },
        ],
        leaders: [
          { id: createId(), handle: "@annielytics", platform: "x" },
          { id: createId(), handle: "@jayacunzo", platform: "x" },
          { id: createId(), handle: "@skoolgames", platform: "youtube" },
        ],
      });
      plan.dailyReplies = 12;
      return plan;
    },
  },
  {
    id: "dev-creator",
    label: "Dev Creator",
    mantra: "Turn technical explorations into teaching moments that convert peers.",
    buildPlan: () => {
      const plan = buildDefaultPlan(
        "Grow a developer audience around modern web platform tutorials",
        "friendly",
        "growing"
      );
      plan.pillars = withPillars([
        "Code Walkthroughs",
        "Performance Wins",
        "Tooling Experiments",
        "Hot Takes",
      ]);
      plan.cadence = [
        {
          id: createId(),
          day: "Mon",
          type: "thread",
          channels: ["x", "linkedin"],
          hourHint: 8,
        },
        {
          id: createId(),
          day: "Tue",
          type: "shorts",
          channels: ["youtube"],
          hourHint: 9,
        },
        {
          id: createId(),
          day: "Wed",
          type: "carousel",
          channels: ["instagram"],
          hourHint: 10,
        },
        {
          id: createId(),
          day: "Thu",
          type: "text",
          channels: ["linkedin"],
          hourHint: 11,
        },
        {
          id: createId(),
          day: "Fri",
          type: "blog",
          channels: ["blog"],
          hourHint: 13,
        },
        {
          id: createId(),
          day: "Sat",
          type: "thread",
          channels: ["x"],
          hourHint: 12,
        },
      ];
      plan.targets = cloneTargets({
        peers: [
          { id: createId(), handle: "@leeerob", platform: "x" },
          { id: createId(), handle: "@thepracticaldev", platform: "x" },
          { id: createId(), handle: "@webdevcody", platform: "youtube" },
          { id: createId(), handle: "@midudev", platform: "x" },
        ],
        prospects: [
          { id: createId(), handle: "@vercel", platform: "x" },
          { id: createId(), handle: "@azuredevelopers", platform: "x" },
          { id: createId(), handle: "frontend.focus", platform: "rss" },
          { id: createId(), handle: "@reactnewsletter", platform: "x" },
        ],
        leaders: [
          { id: createId(), handle: "@kentcdodds", platform: "x" },
          { id: createId(), handle: "@dan_abramov", platform: "x" },
          { id: createId(), handle: "@thekitze", platform: "x" },
        ],
      });
      plan.dailyReplies = 15;
      return plan;
    },
  },
];
