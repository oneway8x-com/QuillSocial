import { replyToTweet } from "@quillsocial/app-store/xconsumerkeyssocial/lib";
import { TWITTER_APP_ID } from "@quillsocial/lib/constants";
import prisma from "@quillsocial/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const apiKey = req.headers.authorization || req.query.apiKey;

  if (process.env.CRON_API_KEY !== apiKey) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ message: "Invalid method" });
    return;
  }
  const plugs = await prisma.plug.findMany({
    where: {
      status: "NEW",
      schedulePostDate: {
        not: null,
        lte: new Date(),
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
  if (plugs.length > 0) {
    await Promise.all(
      plugs.map(async (p) => {
        console.log("commenting for ", p);
        if (p.post?.appId === TWITTER_APP_ID && p.post.credentialId) {
          // Extract tweet ID from result - adjust this based on actual result structure
          const tweetId = (p.post.result as any)?.data?.id || (p.post.result as any)?.tweetId;
          if (tweetId) {
            const result = await replyToTweet(
              p.post.credentialId,
              tweetId,
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

            return result;
          }
        } else if (p.post?.appId === "linkedin-social") {
          // return LinkedinManager.post(p.id);
        }
        return;
      })
    );
  } else {
    console.log("No data to update");
  }
  res.status(200).json(plugs.length);
}
