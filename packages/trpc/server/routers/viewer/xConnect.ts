/**
 * tRPC router for X Connect Engagement feature
 * Handles discovery, filtering, and queuing of engagement jobs
 */

import { z } from "zod";
import authedProcedure from "../../procedures/authedProcedure";
import { router } from "../../trpc";
import prisma from "@quillsocial/prisma";
import { TRPCError } from "@trpc/server";
import * as twitterManager from "@quillsocial/app-store/xconsumerkeyssocial/lib/twitterManager";
import { Prisma } from "@quillsocial/prisma/client";

// ============================================================================
// Zod Schemas
// ============================================================================

const settingsInputSchema = z.object({
  hashtags: z
    .array(z.string().min(1).max(100))
    .min(1)
    .max(20)
    .refine((tags) => tags.every((t) => !t.includes("#")), {
      message: "Hashtags should not include # symbol",
    }),
  language: z.string().optional(),
  minLikes: z.number().int().min(0).optional(),
  minReplies: z.number().int().min(0).optional(),
  excludeKeywords: z.array(z.string()).max(50).default([]),
  excludeFollowed: z.boolean().default(true),
  dailyMaxComments: z.number().int().min(1).max(100).default(20),
  rateSpacingMs: z.number().int().min(1000).max(60000).default(3000),
  topics: z.array(z.string()).min(1).max(20),
  maxReadsPerScan: z.number().int().min(1).max(50).default(20),
  monthlyReadCap: z.number().int().min(1).default(100),
  monthlyPostCap: z.number().int().min(1).default(500),
});

const scanInputSchema = z.object({
  force: z.boolean().optional(),
});

const listDiscoveredInputSchema = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
  onlyNotFollowed: z.boolean().optional(),
  q: z.string().optional(),
  status: z.enum(["ACTIVE", "QUEUED", "ENGAGED", "SKIPPED", "ALL"]).optional().default("ACTIVE"),
});

const generatePreviewInputSchema = z.object({
  xPostId: z.string(),
  template: z.string().max(280).optional(),
  topics: z.array(z.string()).optional(),
});

const bulkGeneratePreviewInputSchema = z.object({
  xPostIds: z.array(z.string()).min(1).max(50),
  template: z.string().max(280),
  topics: z.array(z.string()).optional(),
});

const queueEngagementInputSchema = z.object({
  xPostIds: z.array(z.string()).min(1).max(50),
  template: z.string().min(1, "Template cannot be empty").max(280, "Template must be 280 characters or less"),
  topics: z.array(z.string()).optional(),
});

const listJobsInputSchema = z.object({
  statuses: z.array(z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"])).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const markPostsInputSchema = z.object({
  xPostIds: z.array(z.string()).min(1).max(50),
  status: z.enum(["QUEUED", "ENGAGED", "SKIPPED"]),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create settings for a user
 */
async function getOrCreateSettings(userId: number) {
  let settings = await prisma.xConnectSetting.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.xConnectSetting.create({
      data: { userId },
    });
  }

  return settings;
}

/**
 * Get or create usage counter for a user
 */
async function getOrCreateUsageCounter(userId: number) {
  let counter = await prisma.xUsageCounter.findUnique({
    where: { userId },
  });

  if (!counter) {
    // Set reset date to first day of next month
    const now = new Date();
    const resetAt = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    counter = await prisma.xUsageCounter.create({
      data: {
        userId,
        resetAt,
      },
    });
  }

  // Check if we need to reset counter (month rolled over)
  if (counter.resetAt < new Date()) {
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    counter = await prisma.xUsageCounter.update({
      where: { userId },
      data: {
        readsUsed: 0,
        postsUsed: 0,
        resetAt: nextReset,
      },
    });
  }

  return counter;
}

/**
 * Get X credential for user
 */
async function getXCredential(userId: number) {
  const credential = await prisma.credential.findFirst({
    where: {
      userId,
      appId: "xconsumerkeys-social",
      invalid: false,
    },
  });

  if (!credential) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No active X credential found. Please connect your X account first.",
    });
  }

  return credential;
}

/**
 * Render comment template with tokens
 */
function renderTemplate(template: string, authorHandle: string, topics: string[]): string {
  let rendered = template.replace(/{author}/g, `@${authorHandle}`);

  if (topics.length > 0) {
    const topicsStr = topics.join(", ");
    rendered = rendered.replace(/{topics}/g, topicsStr);
  }

  return rendered;
}

/**
 * Count posts made in last 3 hours (for 300/3h window)
 */
async function countPostsInLast3Hours(userId: number): Promise<number> {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const count = await prisma.xEngagementJob.count({
    where: {
      userId,
      status: "SUCCESS",
      finishedAt: {
        gte: threeHoursAgo,
      },
    },
  });

  return count;
}

/**
 * Count posts made today
 */
async function countPostsToday(userId: number): Promise<number> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const count = await prisma.xEngagementJob.count({
    where: {
      userId,
      status: "SUCCESS",
      finishedAt: {
        gte: startOfDay,
      },
    },
  });

  return count;
}

// ============================================================================
// Router
// ============================================================================

export const xConnectRouter = router({
  /**
   * Start a scan for new posts with hashtags
   */
  startScan: authedProcedure.input(scanInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const settings = await getOrCreateSettings(userId);
    const counter = await getOrCreateUsageCounter(userId);

    // Check read budget
    const readsRemaining = settings.monthlyReadCap - counter.readsUsed;
    if (readsRemaining <= 0) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Read budget exhausted. Resets on ${counter.resetAt.toLocaleDateString()}`,
      });
    }

    // Get X credential
    const credential = await getXCredential(userId);

    // Get authenticated user's X ID
    const userIdResult = await twitterManager.getAuthenticatedUserId(credential.id);
    if (userIdResult.error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to get X user ID: ${userIdResult.error}`,
      });
    }

    const xUserId = userIdResult.userId!;

    // Fetch following list (cached check)
    const allPostAuthorIds: string[] = [];
    const discoveredPosts: typeof allPostAuthorIds = [];

    let found = 0;
    let inserted = 0;
    let skipped = 0;
    let readsConsumed = 0;
    let nextToken: string | undefined;

    // Search loop
    while (readsConsumed < Math.min(settings.maxReadsPerScan, readsRemaining)) {
      const searchResult = await twitterManager.searchHashtags(credential.id, settings.hashtags, {
        max: 100,
        lang: settings.language || undefined,
        minLikes: settings.minLikes || undefined,
        minReplies: settings.minReplies || undefined,
        excludeKeywords: settings.excludeKeywords,
        nextToken,
      });

      if (searchResult.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to search hashtags: ${searchResult.error}`,
        });
      }

      const posts = searchResult.posts || [];
      found += posts.length;
      readsConsumed++; // Each search request counts as 1 read

      // Collect author IDs
      posts.forEach((post) => {
        if (!allPostAuthorIds.includes(post.authorId)) {
          allPostAuthorIds.push(post.authorId);
        }
      });

      // Store discovered posts temporarily
      discoveredPosts.push(...posts.map((p) => p.id));

      // Upsert posts
      for (const post of posts) {
        const existing = await prisma.xDiscoveredPost.findUnique({
          where: {
            userId_xPostId: {
              userId,
              xPostId: post.id,
            },
          },
        });

        if (existing) {
          skipped++;
          // Update lastSeenAt
          await prisma.xDiscoveredPost.update({
            where: { id: existing.id },
            data: { lastSeenAt: new Date() },
          });
        } else {
          await prisma.xDiscoveredPost.create({
            data: {
              userId,
              xPostId: post.id,
              authorId: post.authorId,
              authorHandle: post.authorHandle,
              authorName: post.authorName || null,
              text: post.text,
              likeCount: post.likeCount,
              replyCount: post.replyCount,
              lang: post.lang || undefined,
              authorIsFollowed: false, // Will update below
            },
          });
          inserted++;
        }
      }

      nextToken = searchResult.nextToken;
      if (!nextToken) break;
    }

    // Batch check following status
    if (settings.excludeFollowed && allPostAuthorIds.length > 0) {
      const followingResult = await twitterManager.batchCheckFollowing(credential.id, allPostAuthorIds);

      if (followingResult.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to check following status: ${followingResult.error}`,
        });
      }

      // Update authorIsFollowed for all posts
      for (const [authorId, isFollowing] of Object.entries(followingResult.followingMap)) {
        await prisma.xDiscoveredPost.updateMany({
          where: {
            userId,
            authorId,
          },
          data: {
            authorIsFollowed: isFollowing,
          },
        });
      }
    }

    // Update usage counter
    await prisma.xUsageCounter.update({
      where: { userId },
      data: {
        readsUsed: counter.readsUsed + readsConsumed,
      },
    });

    return {
      found,
      inserted,
      skipped,
      readsConsumed,
      readsRemaining: readsRemaining - readsConsumed,
    };
  }),

  /**
   * List discovered posts
   */
  listDiscovered: authedProcedure.input(listDiscoveredInputSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { page, pageSize, onlyNotFollowed, q, status } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.XDiscoveredPostWhereInput = {
      userId,
      ...(status && status !== "ALL" ? { status: status as "ACTIVE" | "QUEUED" | "ENGAGED" | "SKIPPED" } : {}),
      ...(onlyNotFollowed ? { authorIsFollowed: false } : {}),
      ...(q
        ? {
            OR: [
              { text: { contains: q, mode: "insensitive" } },
              { authorHandle: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [posts, total] = await Promise.all([
      prisma.xDiscoveredPost.findMany({
        where,
        orderBy: { discoveredAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.xDiscoveredPost.count({ where }),
    ]);

    return {
      posts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  /**
   * Save settings
   */
  saveSettings: authedProcedure.input(settingsInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;

    const settings = await prisma.xConnectSetting.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
      },
      update: input,
    });

    return settings;
  }),

  /**
   * Generate preview for a single post
   */
  generatePreviewForPost: authedProcedure
    .input(generatePreviewInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { xPostId, template: customTemplate, topics: customTopics } = input;

      const post = await prisma.xDiscoveredPost.findUnique({
        where: {
          userId_xPostId: {
            userId,
            xPostId,
          },
        },
      });

      if (!post) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Post not found",
        });
      }

      const settings = await getOrCreateSettings(userId);
      const template =
        customTemplate ||
        `Let's #connect if you're into:\n🎨 Frontend • 💼 Backend • 👩‍💻 GenAI • ✨ Full-stack • 🧑‍💻 DevOps • ✅ DSA • 💻 LeetCode • 🧠 AI/ML • 🧱 Web3 • 📊 Data Science • 💸 Freelancing • 🐍 Python • 🔨 Startups\n\nHey {author}, loved your post! I'm building in public and would love to connect with folks into {topics}. #buildinpublic #letsconnect`;

      const topics = customTopics || settings.topics;
      const preview = renderTemplate(template, post.authorHandle, topics);

      return { preview };
    }),

  /**
   * Bulk generate preview (returns count)
   */
  bulkGeneratePreview: authedProcedure
    .input(bulkGeneratePreviewInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { xPostIds } = input;

      const posts = await prisma.xDiscoveredPost.findMany({
        where: {
          userId,
          xPostId: { in: xPostIds },
        },
      });

      return { count: posts.length };
    }),

  /**
   * Queue engagement jobs
   */
  queueEngagement: authedProcedure
    .input(queueEngagementInputSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { xPostIds, template, topics: customTopics } = input;

      const settings = await getOrCreateSettings(userId);
      const counter = await getOrCreateUsageCounter(userId);
      const topics = customTopics || settings.topics;

      // Fetch posts
      const posts = await prisma.xDiscoveredPost.findMany({
        where: {
          userId,
          xPostId: { in: xPostIds },
        },
      });

      if (posts.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid posts found",
        });
      }

      // Check limits
      const todayPosted = await countPostsToday(userId);
      const last3HoursPosted = await countPostsInLast3Hours(userId);
      const postsRemainingMonthly = settings.monthlyPostCap - counter.postsUsed;
      const postsRemaining3Hour = 300 - last3HoursPosted;
      const postsRemainingDaily = settings.dailyMaxComments - todayPosted;

      const allowed = Math.min(
        postsRemainingMonthly,
        postsRemaining3Hour,
        postsRemainingDaily,
        posts.length
      );

      if (allowed <= 0) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "Daily or rate limit reached",
        });
      }

      // Create jobs
      const now = new Date();
      let queued = 0;

      for (let i = 0; i < allowed; i++) {
        const post = posts[i];
        const plannedComment = renderTemplate(template, post.authorHandle, topics);

        // Safety check: ensure comment is not empty
        if (!plannedComment || plannedComment.trim() === '') {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Generated comment is empty. Please provide a valid template.",
          });
        }

        const scheduledAt = new Date(now.getTime() + i * settings.rateSpacingMs);

        await prisma.xEngagementJob.create({
          data: {
            userId,
            xPostId: post.xPostId,
            authorHandle: post.authorHandle,
            plannedComment,
            scheduledAt,
          },
        });

        queued++;
      }

      return {
        queued,
        capped: posts.length - allowed,
        postsRemainingInWindow: Math.min(postsRemaining3Hour, postsRemainingMonthly),
      };
    }),

  /**
   * List engagement jobs
   */
  listJobs: authedProcedure.input(listJobsInputSchema).query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { statuses, page, pageSize } = input;
    const skip = (page - 1) * pageSize;

    const where: Prisma.XEngagementJobWhereInput = {
      userId,
      ...(statuses ? { status: { in: statuses } } : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.xEngagementJob.findMany({
        where,
        orderBy: { scheduledAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.xEngagementJob.count({ where }),
    ]);

    return {
      jobs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }),

  /**
   * Get stats
   */
  stats: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;
    const settings = await getOrCreateSettings(userId);
    const counter = await getOrCreateUsageCounter(userId);

    const todayPosted = await countPostsToday(userId);

    const lastScan = await prisma.xDiscoveredPost.findFirst({
      where: { userId },
      orderBy: { discoveredAt: "desc" },
      select: { discoveredAt: true },
    });

    // Get counts for each status
    const [activeCount, queuedCount, engagedCount, skippedCount, totalCount] = await Promise.all([
      prisma.xDiscoveredPost.count({ where: { userId, status: "ACTIVE" } }),
      prisma.xDiscoveredPost.count({ where: { userId, status: "QUEUED" } }),
      prisma.xDiscoveredPost.count({ where: { userId, status: "ENGAGED" } }),
      prisma.xDiscoveredPost.count({ where: { userId, status: "SKIPPED" } }),
      prisma.xDiscoveredPost.count({ where: { userId } }),
    ]);

    return {
      todayPosted,
      dailyMax: settings.dailyMaxComments,
      lastScan: lastScan?.discoveredAt,
      readsRemaining: settings.monthlyReadCap - counter.readsUsed,
      postsRemaining: settings.monthlyPostCap - counter.postsUsed,
      resetAt: counter.resetAt,
      settings,
      statusCounts: {
        active: activeCount,
        queued: queuedCount,
        engaged: engagedCount,
        skipped: skippedCount,
        total: totalCount,
      },
    };
  }),

  /**
   * Mark posts as engaged or skipped
   */
  markPosts: authedProcedure.input(markPostsInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { xPostIds, status } = input;

    const updated = await prisma.xDiscoveredPost.updateMany({
      where: {
        userId,
        xPostId: { in: xPostIds },
      },
      data: {
        status,
      },
    });

    return {
      updated: updated.count,
    };
  }),
});
