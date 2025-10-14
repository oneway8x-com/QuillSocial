/**
 * tRPC router for Threads Connect Engagement feature
 * Handles discovery, filtering, and queuing of engagement jobs for Threads
 */

import { z } from "zod";
import authedProcedure from "../../procedures/authedProcedure";
import { router } from "../../trpc";
import prisma from "@quillsocial/prisma";
import { TRPCError } from "@trpc/server";
import * as threadsManager from "@quillsocial/app-store/threadssocial/lib/threadsManager";
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
  threadsPostId: z.string(),
  template: z.string().max(280).optional(),
  topics: z.array(z.string()).optional(),
});

const bulkGeneratePreviewInputSchema = z.object({
  threadsPostIds: z.array(z.string()).min(1).max(50),
  template: z.string().max(280),
  topics: z.array(z.string()).optional(),
});

const queueEngagementInputSchema = z.object({
  threadsPostIds: z.array(z.string()).min(1).max(50),
  template: z.string().min(1, "Template cannot be empty").max(500, "Template must be 500 characters or less"),
  topics: z.array(z.string()).optional(),
});

const listJobsInputSchema = z.object({
  statuses: z.array(z.enum(["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELLED"])).optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

const markPostsInputSchema = z.object({
  threadsPostIds: z.array(z.string()).min(1).max(50),
  status: z.enum(["QUEUED", "ENGAGED", "SKIPPED"]),
});

const commentOnPostInputSchema = z.object({
  threadsPostId: z.string().min(1, "Post ID is required"),
  comment: z.string().min(1, "Comment cannot be empty").max(500, "Comment must be 500 characters or less"),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get or create settings for a user
 */
async function getOrCreateSettings(userId: number) {
  let settings = await prisma.threadsConnectSetting.findUnique({
    where: { userId },
  });

  if (!settings) {
    settings = await prisma.threadsConnectSetting.create({
      data: { userId },
    });
  }

  return settings;
}

/**
 * Get or create usage counter for a user
 */
async function getOrCreateUsageCounter(userId: number) {
  let counter = await prisma.threadsUsageCounter.findUnique({
    where: { userId },
  });

  if (!counter) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    counter = await prisma.threadsUsageCounter.create({
      data: {
        userId,
        resetAt: nextMonth,
      },
    });
  }

  // Check if counter needs reset
  if (counter.resetAt < new Date()) {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    counter = await prisma.threadsUsageCounter.update({
      where: { userId },
      data: {
        readsUsed: 0,
        postsUsed: 0,
        resetAt: nextMonth,
      },
    });
  }

  return counter;
}

/**
 * Get Threads credential
 */
async function getThreadsCredential(userId: number) {
  const credential = await prisma.credential.findFirst({
    where: {
      userId,
      appId: "threads-social",
      invalid: false,
    },
  });

  if (!credential) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "No Threads credential found",
    });
  }

  return credential;
}

/**
 * Render template with variables
 */
function renderTemplate(template: string, authorHandle: string, topics: string[]): string {
  let rendered = template;
  rendered = rendered.replace(/{author}/g, `@${authorHandle}`);
  if (topics.length > 0) {
    rendered = rendered.replace(/{topics}/g, topics.join(", "));
  }
  return rendered;
}

/**
 * Count posts made in last 3 hours
 */
async function countPostsInLast3Hours(userId: number): Promise<number> {
  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);

  const count = await prisma.threadsEngagementJob.count({
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

  const count = await prisma.threadsEngagementJob.count({
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

export const threadsConnectRouter = router({
  /**
   * Start a scan for new posts with hashtags
   * Note: This is a placeholder - actual implementation would need Threads API for search
   */
  startScan: authedProcedure.input(scanInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const scanStartTime = Date.now();
    console.log(`\n========================================`);
    console.log(`[ThreadsConnect] 🚀 START SCAN TRIGGERED`);
    console.log(`[ThreadsConnect] User ID: ${userId}`);
    console.log(`[ThreadsConnect] Force scan: ${input.force}`);
    console.log(`[ThreadsConnect] Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================\n`);

    // Load user settings
    console.log(`[ThreadsConnect] 📋 Loading user settings...`);
    const settings = await getOrCreateSettings(userId);
    console.log(`[ThreadsConnect] ✅ Settings loaded:`, {
      hashtags: settings.hashtags,
      hashtagCount: settings.hashtags.length,
      maxReadsPerScan: settings.maxReadsPerScan,
      monthlyReadCap: settings.monthlyReadCap,
      excludeKeywords: settings.excludeKeywords,
      excludeFollowed: settings.excludeFollowed,
      minLikes: settings.minLikes,
      minReplies: settings.minReplies,
    });

    // Check usage counter
    console.log(`[ThreadsConnect] 📊 Checking usage counter...`);
    const counter = await getOrCreateUsageCounter(userId);
    const readsRemaining = settings.monthlyReadCap - counter.readsUsed;
    console.log(`[ThreadsConnect] ✅ Usage counter:`, {
      readsUsed: counter.readsUsed,
      postsUsed: counter.postsUsed,
      readsRemaining,
      resetAt: counter.resetAt.toISOString(),
      daysUntilReset: Math.ceil((counter.resetAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    });

    if (readsRemaining <= 0) {
      console.error(`[ThreadsConnect] ❌ Read budget exhausted for user ${userId}`);
      console.error(`[ThreadsConnect] Next reset: ${counter.resetAt.toLocaleDateString()}`);
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: `Read budget exhausted. Resets on ${counter.resetAt.toLocaleDateString()}`,
      });
    }

    // Get Threads credential
    console.log(`[ThreadsConnect] 🔑 Fetching Threads credential...`);
    const credential = await getThreadsCredential(userId);
    console.log(`[ThreadsConnect] ✅ Threads credential found:`, {
      credentialId: credential.id,
      appId: credential.appId,
      hasKey: !!credential.key,
      invalid: credential.invalid,
    });

    // Initialize scan results
    let found = 0;
    let inserted = 0;
    let skipped = 0;
    let readsConsumed = 0;

    console.log(`\n[ThreadsConnect] 🔍 Starting hashtag search...`);
    console.log(`[ThreadsConnect] Searching for hashtags:`, settings.hashtags.join(', '));

    // TODO: Implement actual Threads API search for hashtags
    // This is where we would use threadsManager to search posts
    console.log(`\n[ThreadsConnect] 📡 Calling threadsManager.searchHashtags()...`);
    console.log(`[ThreadsConnect] Parameters:`, {
      credentialId: credential.id,
      hashtags: settings.hashtags,
      maxResults: Math.min(settings.maxReadsPerScan, readsRemaining),
      filters: {
        minLikes: settings.minLikes,
        minReplies: settings.minReplies,
        excludeKeywords: settings.excludeKeywords,
        language: settings.language,
      }
    });

    try {
      // Search for posts using each hashtag
      const allResults: any[] = [];
      const maxPerHashtag = Math.ceil(Math.min(settings.maxReadsPerScan, readsRemaining) / settings.hashtags.length);

      console.log(`[ThreadsConnect] Searching ${settings.hashtags.length} hashtags, ~${maxPerHashtag} posts per hashtag`);

      for (const hashtag of settings.hashtags) {
        console.log(`[ThreadsConnect] 🔍 Searching hashtag: #${hashtag}`);

        const searchResult = await threadsManager.searchByKeyword(credential.id, {
          query: hashtag,
          searchType: "RECENT", // Get most recent posts
          searchMode: "TAG", // Search by hashtag
          limit: maxPerHashtag,
          fields: ["id", "text", "media_type", "permalink", "timestamp", "username", "like_count", "reply_count"],
        });

        if (searchResult?.data) {
          console.log(`[ThreadsConnect] ✅ Found ${searchResult.data.length} posts for #${hashtag}`);
          allResults.push(...searchResult.data);
        } else {
          console.warn(`[ThreadsConnect] ⚠️  No results for #${hashtag}`);
        }
      }

      console.log(`[ThreadsConnect] 📦 API Response received:`, {
        totalResults: allResults.length,
        readsConsumed: allResults.length,
      });

      // Process each result
      console.log(`\n[ThreadsConnect] 🔄 Processing search results...`);
      for (const post of allResults) {
        console.log(`[ThreadsConnect] Processing post ${post.id} from @${post.username}`);

        // Check if post already exists
        const existing = await prisma.threadsDiscoveredPost.findUnique({
          where: {
            userId_threadsPostId: {
              userId,
              threadsPostId: post.id,
            },
          },
        });

        if (existing) {
          console.log(`[ThreadsConnect] ⏭️  Post ${post.id} already exists, skipping`);
          skipped++;
          continue;
        }

        // Apply filters (Note: API might not return like_count/reply_count without proper permissions)
        const likeCount = post.like_count || 0;
        const replyCount = post.reply_count || 0;

        if (settings.minLikes && likeCount < settings.minLikes) {
          console.log(`[ThreadsConnect] ⏭️  Post ${post.id} below minLikes threshold (${likeCount} < ${settings.minLikes})`);
          skipped++;
          continue;
        }

        if (settings.minReplies && replyCount < settings.minReplies) {
          console.log(`[ThreadsConnect] ⏭️  Post ${post.id} below minReplies threshold (${replyCount} < ${settings.minReplies})`);
          skipped++;
          continue;
        }

        // Check for excluded keywords
        const hasExcludedKeyword = settings.excludeKeywords.some(keyword =>
          post.text?.toLowerCase().includes(keyword.toLowerCase())
        );
        if (hasExcludedKeyword) {
          console.log(`[ThreadsConnect] ⏭️  Post ${post.id} contains excluded keyword`);
          skipped++;
          continue;
        }

        // Insert new post
        console.log(`[ThreadsConnect] ✨ Inserting new post ${post.id}`);
        await prisma.threadsDiscoveredPost.create({
          data: {
            userId,
            threadsPostId: post.id,
            authorId: post.username, // Use username as authorId since actual ID might not be available
            authorHandle: post.username,
            authorName: post.username, // API doesn't return display name in search
            authorIsFollowed: false, // API doesn't return this info
            text: post.text || "",
            likeCount,
            replyCount,
            lang: settings.language || null, // Use settings language as fallback
            status: "ACTIVE",
          },
        });
        inserted++;
      }

      found = allResults.length;
      readsConsumed = allResults.length; // Each post counts as one read

      // Update usage counter
      if (readsConsumed > 0) {
        console.log(`[ThreadsConnect] 📈 Updating usage counter...`);
        await prisma.threadsUsageCounter.update({
          where: { userId },
          data: {
            readsUsed: counter.readsUsed + readsConsumed,
          },
        });
        console.log(`[ThreadsConnect] ✅ Usage counter updated: ${counter.readsUsed} → ${counter.readsUsed + readsConsumed}`);
      }

    } catch (error: any) {
      console.error(`\n[ThreadsConnect] ❌ ERROR during scan:`, {
        errorMessage: error.message,
        errorCode: error.code,
        stack: error.stack?.split('\n').slice(0, 3).join('\n'),
      });
      throw error;
    }

    const scanDuration = Date.now() - scanStartTime;
    console.log(`\n========================================`);
    console.log(`[ThreadsConnect] ✅ SCAN COMPLETED`);
    console.log(`[ThreadsConnect] Results:`, {
      found,
      inserted,
      skipped,
      readsConsumed,
      readsRemaining: readsRemaining - readsConsumed,
      duration: `${scanDuration}ms`,
      timestamp: new Date().toISOString(),
    });
    console.log(`========================================\n`);

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

    console.log(`[ThreadsConnect] Listing discovered posts for user ${userId}:`, {
      page,
      pageSize,
      onlyNotFollowed,
      status,
      searchQuery: q
    });

    const where: Prisma.ThreadsDiscoveredPostWhereInput = {
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
      prisma.threadsDiscoveredPost.findMany({
        where,
        orderBy: { discoveredAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.threadsDiscoveredPost.count({ where }),
    ]);

    console.log(`[ThreadsConnect] Found ${posts.length} posts (total: ${total})`);

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
    console.log(`[ThreadsConnect] Saving settings for user ${userId}:`, {
      hashtags: input.hashtags,
      topics: input.topics,
      dailyMaxComments: input.dailyMaxComments,
      monthlyReadCap: input.monthlyReadCap,
      monthlyPostCap: input.monthlyPostCap,
    });

    const settings = await prisma.threadsConnectSetting.upsert({
      where: { userId },
      create: {
        userId,
        ...input,
      },
      update: input,
    });

    console.log(`[ThreadsConnect] Settings saved successfully for user ${userId}`);
    return settings;
  }),

  /**
   * Generate preview for a single post
   */
  generatePreviewForPost: authedProcedure
    .input(generatePreviewInputSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const { threadsPostId, template: customTemplate, topics: customTopics } = input;

      const post = await prisma.threadsDiscoveredPost.findUnique({
        where: {
          userId_threadsPostId: {
            userId,
            threadsPostId,
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
      const { threadsPostIds } = input;

      const posts = await prisma.threadsDiscoveredPost.findMany({
        where: {
          userId,
          threadsPostId: { in: threadsPostIds },
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
      const { threadsPostIds, template, topics: customTopics } = input;
      console.log(`[ThreadsConnect] Queueing engagement for user ${userId}:`, {
        postCount: threadsPostIds.length,
        hasTemplate: !!template,
        customTopics: customTopics?.length
      });

      const settings = await getOrCreateSettings(userId);
      const counter = await getOrCreateUsageCounter(userId);
      const topics = customTopics || settings.topics;

      // Fetch posts
      const posts = await prisma.threadsDiscoveredPost.findMany({
        where: {
          userId,
          threadsPostId: { in: threadsPostIds },
        },
      });

      console.log(`[ThreadsConnect] Found ${posts.length} valid posts to queue`);

      if (posts.length === 0) {
        console.error(`[ThreadsConnect] No valid posts found for user ${userId}`);
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

      console.log(`[ThreadsConnect] Rate limits:`, {
        todayPosted,
        dailyMax: settings.dailyMaxComments,
        last3HoursPosted,
        postsRemainingMonthly,
        postsRemaining3Hour,
        postsRemainingDaily,
      });

      const allowed = Math.min(
        postsRemainingMonthly,
        postsRemaining3Hour,
        postsRemainingDaily,
        posts.length
      );

      console.log(`[ThreadsConnect] Allowed to queue: ${allowed} posts`);

      if (allowed <= 0) {
        console.error(`[ThreadsConnect] Rate limit reached for user ${userId}`);
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
          console.error(`[ThreadsConnect] Generated empty comment for post ${post.threadsPostId}`);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Generated comment is empty. Please provide a valid template.",
          });
        }

        const scheduledAt = new Date(now.getTime() + i * settings.rateSpacingMs);

        await prisma.threadsEngagementJob.create({
          data: {
            userId,
            threadsPostId: post.threadsPostId,
            authorHandle: post.authorHandle,
            plannedComment,
            scheduledAt,
          },
        });

        queued++;
      }

      console.log(`[ThreadsConnect] Successfully queued ${queued} engagement jobs for user ${userId}`);

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

    const where: Prisma.ThreadsEngagementJobWhereInput = {
      userId,
      ...(statuses ? { status: { in: statuses } } : {}),
    };

    const [jobs, total] = await Promise.all([
      prisma.threadsEngagementJob.findMany({
        where,
        orderBy: { scheduledAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.threadsEngagementJob.count({ where }),
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
    console.log(`[ThreadsConnect] Fetching stats for user ${userId}`);

    const settings = await getOrCreateSettings(userId);
    const counter = await getOrCreateUsageCounter(userId);

    const todayPosted = await countPostsToday(userId);

    const lastScan = await prisma.threadsDiscoveredPost.findFirst({
      where: { userId },
      orderBy: { discoveredAt: "desc" },
      select: { discoveredAt: true },
    });

    // Get counts for each status
    const [activeCount, queuedCount, engagedCount, skippedCount, totalCount] = await Promise.all([
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "ACTIVE" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "QUEUED" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "ENGAGED" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId, status: "SKIPPED" } }),
      prisma.threadsDiscoveredPost.count({ where: { userId } }),
    ]);

    console.log(`[ThreadsConnect] Stats:`, {
      todayPosted,
      dailyMax: settings.dailyMaxComments,
      statusCounts: { activeCount, queuedCount, engagedCount, skippedCount, totalCount },
      monthlyUsage: { readsUsed: counter.readsUsed, postsUsed: counter.postsUsed },
    });

    return {
      todayPosted,
      dailyMax: settings.dailyMaxComments,
      lastScanAt: lastScan?.discoveredAt,
      lastScan: lastScan?.discoveredAt, // For backward compatibility
      monthlyReadsUsed: counter.readsUsed,
      monthlyPostsUsed: counter.postsUsed,
      monthlyReadCap: settings.monthlyReadCap,
      monthlyPostCap: settings.monthlyPostCap,
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
    const { threadsPostIds, status } = input;

    const updated = await prisma.threadsDiscoveredPost.updateMany({
      where: {
        userId,
        threadsPostId: { in: threadsPostIds },
      },
      data: {
        status,
      },
    });

    return {
      updated: updated.count,
    };
  }),

  /**
   * Check if user has Threads credential
   */
  hasThreadsCredential: authedProcedure.query(async ({ ctx }) => {
    const userId = ctx.user.id;

    const credential = await prisma.credential.findFirst({
      where: {
        userId,
        appId: "threads-social",
        invalid: false,
      },
    });

    return {
      hasCredential: !!credential,
    };
  }),

  /**
   * Comment on a post directly (without queuing)
   * Posts comment via API immediately, then marks post as ENGAGED on success or SKIPPED on error
   */
  commentOnPost: authedProcedure.input(commentOnPostInputSchema).mutation(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const { threadsPostId, comment } = input;

    console.log(`\n========================================`);
    console.log(`[ThreadsConnect] 💬 COMMENT ON POST TRIGGERED`);
    console.log(`[ThreadsConnect] User ID: ${userId}`);
    console.log(`[ThreadsConnect] Post ID: ${threadsPostId}`);
    console.log(`[ThreadsConnect] Comment length: ${comment.length} chars`);
    console.log(`[ThreadsConnect] Timestamp: ${new Date().toISOString()}`);
    console.log(`========================================\n`);

    // Get the post
    console.log(`[ThreadsConnect] 🔍 Fetching post from database...`);
    const post = await prisma.threadsDiscoveredPost.findFirst({
      where: {
        userId,
        threadsPostId,
      },
    });

    if (!post) {
      console.error(`[ThreadsConnect] ❌ Post not found: ${threadsPostId}`);
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Post not found",
      });
    }

    console.log(`[ThreadsConnect] ✅ Post found:`, {
      id: post.id,
      authorHandle: post.authorHandle,
      authorName: post.authorName,
      text: post.text.substring(0, 100) + (post.text.length > 100 ? '...' : ''),
      currentStatus: post.status,
    });

    // Get Threads credential
    console.log(`[ThreadsConnect] 🔑 Fetching Threads credential...`);
    const credential = await getThreadsCredential(userId);
    if (!credential) {
      console.error(`[ThreadsConnect] ❌ No Threads credential found for user ${userId}`);
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "No Threads credential found. Please connect your Threads account.",
      });
    }
    console.log(`[ThreadsConnect] ✅ Credential found:`, { credentialId: credential.id });

    // Check rate limits
    console.log(`[ThreadsConnect] 📊 Checking rate limits...`);
    const settings = await getOrCreateSettings(userId);
    const todayPosted = await countPostsToday(userId);
    const last3HoursPosted = await countPostsInLast3Hours(userId);

    console.log(`[ThreadsConnect] Rate limits:`, {
      todayPosted,
      dailyMax: settings.dailyMaxComments,
      last3HoursPosted,
      threeHourLimit: 300,
      dailyRemaining: settings.dailyMaxComments - todayPosted,
      threeHourRemaining: 300 - last3HoursPosted,
    });

    if (todayPosted >= settings.dailyMaxComments) {
      console.error(`[ThreadsConnect] ❌ Daily comment limit reached: ${todayPosted}/${settings.dailyMaxComments}`);
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Daily comment limit reached",
      });
    }

    if (last3HoursPosted >= 300) {
      console.error(`[ThreadsConnect] ❌ 3-hour rate limit reached: ${last3HoursPosted}/300`);
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "Rate limit reached (300 posts per 3 hours)",
      });
    }

    // Post the comment
    console.log(`\n[ThreadsConnect] 📡 Posting comment via Threads API...`);
    console.log(`[ThreadsConnect] Target post: ${threadsPostId}`);
    console.log(`[ThreadsConnect] Author: @${post.authorHandle}`);
    console.log(`[ThreadsConnect] Comment preview: "${comment.substring(0, 80)}${comment.length > 80 ? '...' : ''}"`);

    try {
      console.log(`[ThreadsConnect] 📞 Calling threadsManager.replyToPost()...`);
      console.log(`[ThreadsConnect] Parameters:`, {
        credentialId: credential.id,
        postId: threadsPostId,
        commentLength: comment.length,
      });

      // Post the actual reply via Threads API
      const result = await threadsManager.replyToPost(credential.id, {
        replyToId: threadsPostId,
        text: comment,
        mediaType: "TEXT",
      });

      if (!result) {
        console.error(`[ThreadsConnect] ❌ Failed to post reply - API returned null`);
        throw new Error("Failed to post comment to Threads");
      }

      console.log(`[ThreadsConnect] ✅ Reply posted successfully:`, {
        replyId: result.id,
        permalink: result.permalink,
      });

      // Mark as engaged
      console.log(`[ThreadsConnect] 📝 Marking post as ENGAGED in database...`);
      await prisma.threadsDiscoveredPost.update({
        where: { id: post.id },
        data: { status: "ENGAGED" },
      });
      console.log(`[ThreadsConnect] ✅ Post status updated: ACTIVE → ENGAGED`);

      // Update usage counter
      console.log(`[ThreadsConnect] 📈 Updating usage counter...`);
      const counter = await getOrCreateUsageCounter(userId);
      await prisma.threadsUsageCounter.update({
        where: { userId },
        data: {
          postsUsed: counter.postsUsed + 1,
        },
      });
      console.log(`[ThreadsConnect] ✅ Posts used updated: ${counter.postsUsed} → ${counter.postsUsed + 1}`);

      console.log(`\n========================================`);
      console.log(`[ThreadsConnect] ✅ COMMENT POSTED SUCCESSFULLY`);
      console.log(`[ThreadsConnect] Post ID: ${threadsPostId}`);
      console.log(`[ThreadsConnect] Author: @${post.authorHandle}`);
      console.log(`========================================\n`);

      return {
        success: true,
        message: "Comment posted successfully!",
      };
    } catch (error: any) {
      console.error(`\n========================================`);
      console.error(`[ThreadsConnect] ❌ ERROR POSTING COMMENT`);
      console.error(`[ThreadsConnect] Post ID: ${threadsPostId}`);
      console.error(`[ThreadsConnect] Error:`, {
        message: error.message,
        code: error.code,
        name: error.name,
      });
      console.error(`========================================\n`);

      // Mark as skipped on any error
      console.log(`[ThreadsConnect] 📝 Marking post as SKIPPED due to error...`);
      await prisma.threadsDiscoveredPost.update({
        where: { id: post.id },
        data: { status: "SKIPPED" },
      });
      console.log(`[ThreadsConnect] ✅ Post status updated: → SKIPPED`);

      // Re-throw TRPCError as is
      if (error instanceof TRPCError) {
        throw error;
      }

      // Wrap other errors
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: error.message || "Failed to post comment",
      });
    }
  }),
});
