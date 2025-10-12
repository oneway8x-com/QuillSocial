import {
  executeComment,
  hasCommentHandler,
  getSupportedCommentApps,
  PLATFORMS_WITHOUT_COMMENT_SUPPORT,
} from "@quillsocial/app-store/commentRegistry";
import prisma from "@quillsocial/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("---------------");
  console.log("[CommentPlug Cron] Schedule job started");
  console.log("---------------");
  const apiKey = req.headers.authorization || req.query.apiKey;

  if (process.env.CRON_API_KEY !== apiKey) {
    console.warn("[CommentPlug Cron] Authentication failed");
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ message: "Invalid method" });
    return;
  }

  // Ensure we compare schedule times against an explicit UTC 'now'
  const nowUtc = new Date(new Date().toISOString());
  console.log("[CommentPlug Cron] UTC now:", nowUtc.toISOString());

  const plugs = await prisma.plug.findMany({
    where: {
      status: "NEW",
      schedulePostDate: {
        not: null,
        lte: nowUtc,
      },
      post: {
        result: {
          not: undefined,
        },
      },
    },
    select: {
      id: true,
      content: true,
      post: {
        select: {
          id: true,
          appId: true,
          result: true,
          credentialId: true,
        },
      },
    },
  });

  console.log(`[CommentPlug Cron] Found ${plugs.length} plugs to process:`,
    plugs.map(p => ({ id: p.id, appId: p.post?.appId }))
  );

  if (plugs.length === 0) {
    console.log("[CommentPlug Cron] No plugs to update");
    res.status(200).json({ processed: 0, results: [] });
    return;
  }

  // Process plugs with individual error handling
  const results = await Promise.allSettled(
    plugs.map(async (p) => {
      const appId = p.post?.appId;
      console.log(`[CommentPlug Cron] Processing plug ${p.id} for ${appId}`);

      try {
        if (!appId) {
          throw new Error("Missing app ID");
        }

        if (!p.post?.credentialId) {
          throw new Error("Missing credential ID");
        }

        // Check if platform supports comments
        if (!hasCommentHandler(appId)) {
          // Check if it's a known platform without support yet
          if (PLATFORMS_WITHOUT_COMMENT_SUPPORT.includes(appId as any)) {
            console.log(`[CommentPlug Cron] ⚠️ ${appId} comments not yet supported for plug ${p.id}`);
            return {
              plugId: p.id,
              appId,
              status: "skipped",
              reason: "Platform comment API not implemented yet"
            };
          }

          throw new Error(
            `Unsupported app: ${appId}. Supported apps: ${getSupportedCommentApps().join(", ")}`
          );
        }

        // Extract parent post ID from result (platform-specific format)
        const parentId = (p.post.result as any)?.data?.id ||
                        (p.post.result as any)?.tweetId ||
                        (p.post.result as any)?.id;

        if (!parentId) {
          throw new Error("Parent post ID not found in post result");
        }

        // Execute comment using registry
        const result = await executeComment(
          appId,
          p.post.credentialId,
          parentId,
          p.content
        );

        // Update plug status based on result
        await prisma.plug.update({
          where: { id: p.id },
          data: {
            status: result.success ? "POSTED" : "ERROR",
            postedDate: result.success ? new Date() : undefined,
            result: result as any
          }
        });

        console.log(`[CommentPlug Cron] ✅ Successfully replied plug ${p.id} to ${appId} post ${parentId}`);
        return { plugId: p.id, appId, parentId, status: "success", result };
      } catch (error: any) {
        console.error(`[CommentPlug Cron] ❌ Failed to process plug ${p.id} for ${appId}:`, error.message);

        // Update plug status to ERROR
        try {
          await prisma.plug.update({
            where: { id: p.id },
            data: {
              status: "ERROR",
              result: { error: error.message } as any
            }
          });
        } catch (updateError) {
          console.error(`[CommentPlug Cron] Failed to update plug ${p.id} status:`, updateError);
        }

        return { plugId: p.id, appId, status: "error", error: error.message };
      }
    })
  );

  // Summarize results
  const summary = {
    total: plugs.length,
    successful: results.filter(r => r.status === "fulfilled" && r.value.status === "success").length,
    skipped: results.filter(r => r.status === "fulfilled" && r.value.status === "skipped").length,
    failed: results.filter(r => r.status === "rejected" || (r.status === "fulfilled" && r.value.status === "error")).length,
    results: results.map(r => r.status === "fulfilled" ? r.value : { status: "error", error: "Promise rejected" })
  };

  console.log("[CommentPlug Cron] Summary:", summary);
  res.status(200).json(summary);
}
