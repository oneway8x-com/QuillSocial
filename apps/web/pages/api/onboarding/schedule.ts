import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "@quillsocial/features/auth/lib/getServerSession";
import { captureServer } from "@quillsocial/lib/posthog";
import prisma from "@quillsocial/prisma";
import { PostStatus } from "@quillsocial/prisma/enums";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession({ req });
  const userId = session?.user?.id;

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { channel, whenISO, content, idea } = req.body || {};

  try {
    // Get the user's credential for the selected channel
    let appId: string | null = null;
    let credentialId: number | null = null;

    if (channel === "linkedin") {
      appId = "linkedinsocial";
    } else if (channel === "x") {
      appId = "xsocial";
    } else if (channel === "instagram") {
      appId = "instagram";
    } else if (channel === "youtube") {
      appId = "youtube";
    }

    if (appId) {
      const credential = await prisma.credential.findFirst({
        where: {
          userId,
          appId,
        },
        orderBy: {
          id: "desc",
        },
      });
      credentialId = credential?.id || null;
    }

    // Create a draft post scheduled for tomorrow
    const post = await prisma.post.create({
      data: {
        userId,
        credentialId,
        appId,
        idea: idea || "First onboarding post",
        content: content || "Your first scheduled post from onboarding! 🎉",
        status: PostStatus.SCHEDULED,
        schedulePostDate: new Date(whenISO),
        tone: "FRIENDLY",
      },
    });

    await captureServer(userId, "onb_post_scheduled", {
      channel,
      whenISO,
      postId: post.id,
    });

    res.status(200).json({ ok: true, draftId: `post_${post.id}`, postId: post.id });
  } catch (error) {
    console.error("Error scheduling onboarding post:", error);
    res.status(500).json({ error: "Failed to schedule post" });
  }
}
