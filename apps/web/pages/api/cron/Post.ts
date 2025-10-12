import { LinkedinManager } from "@quillsocial/app-store/linkedinsocial/lib";
import { post } from "@quillsocial/app-store/xconsumerkeyssocial/lib";
import { TWITTER_APP_ID } from "@quillsocial/lib/constants";
import prisma from "@quillsocial/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("---------------");
  console.log("schedule job");
  console.log("---------------");
  const apiKey = req.headers.authorization || req.query.apiKey;
  console.log(apiKey);
  if (process.env.CRON_API_KEY !== apiKey) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }
  if (req.method !== "POST") {
    res.status(405).json({ message: "Invalid method" });
    return;
  }
  // Ensure we compare schedule times against an explicit UTC 'now'
  const nowUtc = new Date(new Date().toISOString());
  console.log("Cron UTC now:", nowUtc.toISOString());

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
  console.log(`Found ${posts.length} posts to update `, posts);
  if (posts.length > 0) {
    await Promise.all(
      posts.map((p) => {
        if (p.credential?.appId === "linkedin-social") {
          return LinkedinManager.post(p.id);
        } else if (p.credential?.appId === "xconsumerkeys-social") {
          return post(p.id);
        }
        return;
      })
    );
  } else {
    console.log("No data to update");
  }
  res.status(200).json(posts.length);
}
