/**
 * API endpoint to process X engagement jobs
 * Can be called by cron or manually
 * Protected by CRON_API_KEY
 */
import {
  processXEngagementJobs,
  getWorkerStats,
} from "@quillsocial/lib/xEngagement/worker";
import type { NextApiRequest, NextApiResponse } from "next";

// Timeout helper to prevent hanging requests
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage: string = "Operation timed out"
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
    ),
  ]);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const startTime = Date.now();
  console.log("[X-Engagement API] Request received:", {
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers["user-agent"],
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress,
  });

  const apiKey = req.headers.authorization || req.query.apiKey;

  if (process.env.CRON_API_KEY !== apiKey) {
    console.warn("[X-Engagement API] Authentication failed:", {
      hasAuthHeader: !!req.headers.authorization,
      hasQueryKey: !!req.query.apiKey,
      timestamp: new Date().toISOString(),
    });
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  console.log("[X-Engagement API] Authentication successful");

  if (req.method === "POST") {
    console.log("[X-Engagement API] Starting job processing...");
    try {
      const jobStartTime = Date.now();

      // Add 5-minute timeout to prevent indefinite hangs
      // This is important for cron jobs and serverless environments
      const result = await withTimeout(
        processXEngagementJobs(),
        5 * 60 * 1000, // 5 minutes
        "Job processing timed out after 5 minutes"
      );

      const duration = Date.now() - jobStartTime;

      console.log("[X-Engagement API] Job processing completed:", {
        duration: `${duration}ms`,
        result: result,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        result,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      const isTimeout = error.message?.includes("timed out");

      console.error("[X-Engagement API] Error processing X engagement jobs:", {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
        isTimeout,
        timestamp: new Date().toISOString(),
      });

      return res.status(isTimeout ? 504 : 500).json({
        success: false,
        error: error.message,
        duration,
        isTimeout,
      });
    }
  }

  if (req.method === "GET") {
    console.log("[X-Engagement API] Fetching worker stats...");
    try {
      const statsStartTime = Date.now();
      const stats = await getWorkerStats();
      const duration = Date.now() - statsStartTime;

      console.log("[X-Engagement API] Worker stats retrieved:", {
        stats: stats,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,
        stats,
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error("[X-Engagement API] Error fetching worker stats:", {
        error: error.message,
        stack: error.stack,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString(),
      });
      return res.status(500).json({
        success: false,
        error: error.message,
        duration,
      });
    }
  }

  console.warn("[X-Engagement API] Method not allowed:", {
    method: req.method,
    timestamp: new Date().toISOString(),
  });
  return res.status(405).json({ error: "Method not allowed" });
}
