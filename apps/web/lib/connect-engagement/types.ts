/**
 * Shared types for Connect Engagement feature (X and Threads)
 */

export type Platform = "x" | "threads";

export type DiscoveredStatus = "ACTIVE" | "QUEUED" | "ENGAGED" | "SKIPPED" | "ALL";

export type EngagementStatus = "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELLED";

export interface ConnectSettings {
  hashtags: string[];
  language?: string | null;
  minLikes?: number | null;
  minReplies?: number | null;
  excludeKeywords: string[];
  excludeFollowed: boolean;
  dailyMaxComments: number;
  rateSpacingMs: number;
  topics: string[];
  monthlyReadCap: number;
  monthlyPostCap: number;
  maxReadsPerScan: number;
}

export interface DiscoveredPost {
  id: string;
  postId: string; // xPostId or threadsPostId
  authorHandle: string;
  authorName?: string | null;
  authorIsFollowed: boolean;
  text: string;
  likeCount: number;
  replyCount: number;
  discoveredAt: Date;
  status: Exclude<DiscoveredStatus, "ALL">;
}

export interface ConnectStats {
  settings: ConnectSettings;
  statusCounts: {
    active: number;
    queued: number;
    engaged: number;
    skipped: number;
    total: number;
  };
  dailyMax: number;
  todayPosted: number;
  lastScanAt?: Date | null;
  lastScan?: Date | null; // For backward compatibility with x-connect
  monthlyReadsUsed: number;
  monthlyPostsUsed: number;
  monthlyReadCap: number;
  monthlyPostCap: number;
  readsRemaining?: number; // For backward compatibility with x-connect
  postsRemaining?: number; // For backward compatibility with x-connect
  resetAt?: Date; // For backward compatibility with x-connect
}

export interface EngagementJob {
  id: string;
  postId: string; // xPostId or threadsPostId
  authorHandle: string;
  plannedComment: string;
  status: EngagementStatus;
  attempt: number;
  scheduledAt: Date;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  error?: string | null;
}

export interface ScanResult {
  found: number;
  inserted: number;
  skipped: number;
}

export interface BulkGenerateResult {
  postId: string;
  comment: string;
  error?: string;
}

export interface CommentResult {
  success: boolean;
  message: string;
  postId?: string;
}

// Platform-specific configuration
export interface PlatformConfig {
  platform: Platform;
  platformName: string; // "X" or "Threads"
  platformDisplayName: string; // "X (Twitter)" or "Threads"
  credentialAppSlug: string; // "xconsumerkeyssocial" or "threadssocial"
  postUrlBase: string; // "https://x.com" or "https://threads.net"
  defaultHashtags: string[];
}

export const PLATFORM_CONFIGS: Record<Platform, PlatformConfig> = {
  x: {
    platform: "x",
    platformName: "X",
    platformDisplayName: "X (Twitter)",
    credentialAppSlug: "xconsumerkeyssocial",
    postUrlBase: "https://x.com",
    defaultHashtags: [
      "connect",
      "letsconnect",
      "followback",
      "buildinpublic",
      "devcommunity",
      "indiehackers",
      "techtwitter",
      "100DaysOfCode",
    ],
  },
  threads: {
    platform: "threads",
    platformName: "Threads",
    platformDisplayName: "Threads",
    credentialAppSlug: "threadssocial",
    postUrlBase: "https://threads.net",
    defaultHashtags: [
      "connect",
      "letsconnect",
      "followback",
      "buildinpublic",
      "devcommunity",
      "indiehackers",
      "techthreads",
      "100DaysOfCode",
    ],
  },
};

export const DEFAULT_TOPICS = [
  "Frontend",
  "Backend",
  "GenAI",
  "Full-stack",
  "DevOps",
  "DSA",
  "LeetCode",
  "AI/ML",
  "Web3",
  "Data Science",
  "Freelancing",
  "Python",
  "Startup",
];
