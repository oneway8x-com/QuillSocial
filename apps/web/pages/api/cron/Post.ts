import { executePost, hasPostHandler, getSupportedPostApps } from "@quillsocial/app-store/postRegistry";
import prisma from "@quillsocial/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("---------------");
  console.log("[Post Cron] Schedule job started");
  console.log("---------------");
  const apiKey = req.headers.authorization || req.query.apiKey;

  if (process.env.CRON_API_KEY !== apiKey) {
    console.warn("[Post Cron] Authentication failed");
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Invalid method" });
    return;
  }

  // Ensure we compare schedule times against an explicit UTC 'now'
  const nowUtc = new Date(new Date().toISOString());
  console.log("[Post Cron] UTC now:", nowUtc.toISOString());

  const posts = await prisma.post.findMany({
    where: {
      status: "SCHEDULED",
      schedulePostDate: {
        not: null,
        // compare using UTC 'now'
        lte: nowUtc,
      },
      credential: {
        appId: {
          not: null,
        },
      },
    },
    select: {
      id: true,
      credential: {
        select: {
          appId: true,
        },
      },
    },
  });

  console.log(`[Post Cron] Found ${posts.length} posts to publish:`,
    posts.map(p => ({ id: p.id, appId: p.credential?.appId }))
  );

  if (posts.length === 0) {
    console.log("[Post Cron] No posts to update");
    res.status(200).json({ processed: 0, results: [] });
    return;
  }

  // Process posts with individual error handling
  const results = await Promise.allSettled(
    posts.map(async (p) => {
      const appId = p.credential?.appId;
      console.log(`[Post Cron] Processing post ${p.id} for ${appId}`);

      try {
        if (!appId) {
          throw new Error("Missing app ID");
        }

        if (!hasPostHandler(appId)) {
          throw new Error(
            `Unsupported app: ${appId}. Supported apps: ${getSupportedPostApps().join(", ")}`
          );
        }

        const result = await executePost(appId, p.id);

        console.log(`[Post Cron] ✅ Successfully posted ${p.id} to ${appId}`);
        return { postId: p.id, appId, status: "success", result };
      } catch (error: any) {
        console.error(`[Post Cron] ❌ Failed to post ${p.id} to ${appId}:`, error.message);
        return { postId: p.id, appId, status: "error", error: error.message };
      }
    })
  );

  // Summarize results
  const summary = {
    total: posts.length,
    successful: results.filter(r => r.status === "fulfilled" && r.value.status === "success").length,
    failed: results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && r.value.status === "error")).length,
    results: results.map(r => r.status === "fulfilled" ? r.value : { status: "error", error: "Promise rejected" })
  };

  console.log("[Post Cron] Summary:", summary);
  res.status(200).json(summary);
}
