/**
 * X Engagement Worker
 * Processes queued engagement jobs with rate limiting and retry logic
 * Uses GCP Pub/Sub for job queue
 */

import prisma from "@quillsocial/prisma";
import * as twitterManager from "@quillsocial/app-store/xconsumerkeyssocial/lib/twitterManager";
import { PubSub, Message } from "@google-cloud/pubsub";
import logger from "@quillsocial/lib/logger";

const log = logger.getChildLogger({ prefix: ["[xEngagement/worker]"] });

interface ProcessResult {
  processed: number;
  succeeded: number;
  failed: number;
  errors: string[];
}

/**
 * Process pending X engagement jobs
 * Should be called by a cron job or background worker
 */
export async function processXEngagementJobs(): Promise<ProcessResult> {
  const startTime = Date.now();
  log.info("Starting X engagement job processing");

  const result: ProcessResult = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    errors: [],
  };

  try {
    // Find jobs ready to be processed
    const now = new Date();
    log.info("Querying for pending jobs", { currentTime: now.toISOString() });

    const jobs = await prisma.xEngagementJob.findMany({
      where: {
        status: "PENDING",
        scheduledAt: {
          lte: now,
        },
      },
      orderBy: {
        scheduledAt: "asc",
      },
      take: 50, // Process in batches
    });

    log.info(`Found ${jobs.length} jobs to process`, {
      jobIds: jobs.map(j => j.id),
      jobCount: jobs.length
    });

    for (const job of jobs) {
      try {
        log.info(`Processing job ${job.id}`, {
          jobId: job.id,
          userId: job.userId,
          xPostId: job.xPostId,
          attempt: job.attempt,
          scheduledAt: job.scheduledAt.toISOString(),
        });

        // Mark as running
        await prisma.xEngagementJob.update({
          where: { id: job.id },
          data: {
            status: "RUNNING",
            startedAt: new Date(),
          },
        });

        log.info(`Job ${job.id} marked as RUNNING`);

        // Get user's X credential
        log.info(`Fetching X credential for user ${job.userId}`);

        const credential = await prisma.credential.findFirst({
          where: {
            userId: job.userId,
            appId: "xconsumerkeys-social",
            invalid: false,
          },
        });

        if (!credential) {
          log.error(`No valid X credential found for user ${job.userId}`, {
            jobId: job.id,
            userId: job.userId
          });
          throw new Error("No valid X credential found");
        }

        log.info(`Found credential for user ${job.userId}`, {
          credentialId: credential.id
        });

        // Re-validate that author is not followed (optional)
        const post = await prisma.xDiscoveredPost.findFirst({
          where: {
            userId: job.userId,
            xPostId: job.xPostId,
          },
        });

        if (post?.authorIsFollowed) {
          log.warn(`Skipping job ${job.id} - author is now followed`, {
            jobId: job.id,
            xPostId: job.xPostId,
            authorHandle: post.authorHandle,
          });

          await prisma.xEngagementJob.update({
            where: { id: job.id },
            data: {
              status: "CANCELLED",
              finishedAt: new Date(),
              error: "Author is now followed",
            },
          });
          result.processed++;
          continue;
        }

        // Post reply
        log.info(`Attempting to post reply to tweet ${job.xPostId}`, {
          jobId: job.id,
          xPostId: job.xPostId,
          xPostIdType: typeof job.xPostId,
          xPostIdLength: job.xPostId.length,
          commentLength: job.plannedComment.length,
          commentPreview: job.plannedComment.substring(0, 100),
        });

        const replyResult = await twitterManager.replyToTweet(
          credential.id,
          job.xPostId,
          job.plannedComment
        );

        if (!replyResult.success || replyResult.error) {
          log.error(`Failed to post reply for job ${job.id}`, {
            jobId: job.id,
            error: replyResult.error,
            success: replyResult.success,
          });
          throw new Error(replyResult.error || "Failed to post reply");
        }

        log.info(`Successfully posted reply for job ${job.id}`, {
          jobId: job.id,
          tweetId: replyResult.tweetId,
        });

        // Mark as success
        await prisma.xEngagementJob.update({
          where: { id: job.id },
          data: {
            status: "SUCCESS",
            finishedAt: new Date(),
          },
        });

        log.info(`Job ${job.id} marked as SUCCESS`);

        // Update usage counter
        await prisma.xUsageCounter.updateMany({
          where: { userId: job.userId },
          data: {
            postsUsed: {
              increment: 1,
            },
          },
        });

        log.info(`Updated usage counter for user ${job.userId}`);

        log.info(
          `Job ${job.id} completed successfully. Tweet ID: ${replyResult.tweetId || "unknown"}`
        );
        result.processed++;
        result.succeeded++;

        // TODO: Send notification to user

        // Rate limiting: wait between posts
        log.info("Waiting 3 seconds before next job (rate limiting)");
        await new Promise((resolve) => setTimeout(resolve, 3000)); // 3 second spacing
      } catch (error: any) {
        log.error(`Error processing job ${job.id}`, {
          jobId: job.id,
          error: error.message,
          stack: error.stack,
          attempt: job.attempt,
        });

        // Increment attempt
        const nextAttempt = job.attempt + 1;
        const maxAttempts = 5;

        if (nextAttempt >= maxAttempts) {
          // Mark as failed after max attempts
          log.error(`Job ${job.id} failed after ${maxAttempts} attempts`, {
            jobId: job.id,
            finalError: error.message,
          });

          await prisma.xEngagementJob.update({
            where: { id: job.id },
            data: {
              status: "FAILED",
              finishedAt: new Date(),
              error: error.message,
              attempt: nextAttempt,
            },
          });

          result.failed++;
          result.errors.push(`Job ${job.id}: ${error.message}`);
        } else {
          // Retry with exponential backoff
          const backoffMinutes = Math.pow(2, nextAttempt); // 1m, 2m, 4m, 8m, 16m
          const nextSchedule = new Date(Date.now() + backoffMinutes * 60 * 1000);

          log.warn(`Job ${job.id} will be retried (attempt ${nextAttempt}/${maxAttempts})`, {
            jobId: job.id,
            nextAttempt,
            nextSchedule: nextSchedule.toISOString(),
            backoffMinutes,
            error: error.message,
          });

          await prisma.xEngagementJob.update({
            where: { id: job.id },
            data: {
              status: "PENDING",
              attempt: nextAttempt,
              scheduledAt: nextSchedule,
              error: error.message,
              startedAt: null,
            },
          });

          log.info(`Job ${job.id} rescheduled successfully`, {
            jobId: job.id,
            scheduledAt: nextSchedule.toISOString(),
          });
        }

        result.processed++;
      }
    }

    const duration = Date.now() - startTime;
    log.info("X engagement job processing completed", {
      duration: `${duration}ms`,
      totalProcessed: result.processed,
      succeeded: result.succeeded,
      failed: result.failed,
      errorCount: result.errors.length,
    });
  } catch (error: any) {
    log.error("Fatal error in processXEngagementJobs", {
      error: error.message,
      stack: error.stack,
    });
    result.errors.push(`Fatal error: ${error.message}`);
  }

  return result;
}

/**
 * Check if we need to throttle based on 3-hour window (300 posts limit)
 */
export async function checkRateLimit(userId: number): Promise<boolean> {
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

  const isWithinLimit = count < 300;
  log.info("Rate limit check", {
    userId,
    postsInLast3Hours: count,
    limit: 300,
    isWithinLimit
  });

  return isWithinLimit;
}

/**
 * Get worker stats
 */
export async function getWorkerStats() {
  const [pending, running, failed] = await Promise.all([
    prisma.xEngagementJob.count({ where: { status: "PENDING" } }),
    prisma.xEngagementJob.count({ where: { status: "RUNNING" } }),
    prisma.xEngagementJob.count({ where: { status: "FAILED" } }),
  ]);

  const nextJob = await prisma.xEngagementJob.findFirst({
    where: { status: "PENDING" },
    orderBy: { scheduledAt: "asc" },
  });

  return {
    pending,
    running,
    failed,
    nextJob: nextJob?.scheduledAt,
  };
}
