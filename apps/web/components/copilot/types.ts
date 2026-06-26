export type ToneOption = "friendly" | "authoritative" | "contrarian";

export type AudienceStage = "starting" | "small" | "growing";

export type CadenceFormat = "text" | "thread" | "carousel" | "shorts" | "blog";

export type CadenceChannel = "linkedin" | "x" | "instagram" | "youtube" | "blog";

export type CadenceDay = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type TargetPlatform =
  | "x"
  | "linkedin"
  | "youtube"
  | "rss"
  | "instagram"
  | "other";

export interface Target {
  id: string;
  handle: string;
  platform: TargetPlatform;
  notes?: string;
}

export interface PlanPillar {
  id: string;
  name: string;
  color: string;
}

export interface PlanCadenceSlot {
  id: string;
  day: CadenceDay;
  type: CadenceFormat;
  channels: CadenceChannel[];
  hourHint?: number;
}

export interface PlanTargets {
  peers: Target[];
  prospects: Target[];
  leaders: Target[];
}

export interface DraftIdea {
  title: string;
  hook: string;
  outline: string[];
  cta: string;
  hashtags?: string[];
  replies: string[]; // 3 suggested first-replies
}

export interface Week1Slot {
  date: string; // ISO date string
  channel: CadenceChannel;
  draft: DraftIdea;
}

export interface EngagementTargets {
  meaningfulRepliesPerDay: number;
  personas: string[]; // e.g., ["Peers", "Prospects", "Leaders"]
}

export interface PlanMetrics {
  weeklyPostTarget: number;
  dailyReplyTarget: number;
}

export interface BYOK {
  xConnected: boolean;
  engagementLists: Target[];
}

export interface Plan {
  purpose: string;
  tone: ToneOption;
  audienceStage: AudienceStage;
  pillars: PlanPillar[];
  cadence: PlanCadenceSlot[];
  targets: PlanTargets;
  dailyReplies: number;
}

export interface EnhancedPlan extends Plan {
  planId?: string;
  week1Schedule?: Week1Slot[];
  engagementTargets?: EngagementTargets;
  metrics?: PlanMetrics;
  byok?: BYOK;
}

export type PlanBlockKey = "pillars" | "cadence" | "targets" | "engagement";
